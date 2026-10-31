package com.brightloop.subscription_management_system.discount.service;

import com.brightloop.subscription_management_system.discount.dto.DiscountContext;
import com.brightloop.subscription_management_system.discount.dto.DiscountResult;
import com.brightloop.subscription_management_system.discount.entity.Discount;
import com.brightloop.subscription_management_system.discount.entity.DiscountAppliesTo;
import com.brightloop.subscription_management_system.discount.entity.DiscountType;
import com.brightloop.subscription_management_system.discount.repository.DiscountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DiscountSelectionService {

    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private final DiscountRepository discountRepository;

    /** Returns the one discount that saves the customer the most, or empty if none is valid. */
    @Transactional(readOnly = true)
    public Optional<DiscountResult> findBest(DiscountContext context) {
        return discountRepository.findCandidates(context.date()).stream()
                .map(d -> evaluate(d, context))
                .flatMap(Optional::stream)
                // biggest saving wins; on a tie, the older discount (lower id) wins
                .max(Comparator.comparing(DiscountResult::amount)
                        .thenComparing(DiscountResult::discountId, Comparator.reverseOrder()));
    }

    /** Checks one discount against the lines. Pure logic, no database, so it is easy to unit test. */
    public Optional<DiscountResult> evaluate(Discount d, DiscountContext ctx) {
        if (!d.isActive()
                || ctx.date().isBefore(d.getStartDate())
                || ctx.date().isAfter(d.getEndDate())) {
            return Optional.empty();
        }
        if (d.getUsageLimit() != null && d.getUsedCount() >= d.getUsageLimit()) {
            return Optional.empty();
        }

        // which lines does this discount look at?
        List<DiscountContext.Line> lines = ctx.lines();
        List<Integer> matching = new ArrayList<>();
        for (int i = 0; i < lines.size(); i++) {
            if (d.getAppliesTo() == DiscountAppliesTo.SUBSCRIPTION
                    || Objects.equals(lines.get(i).productId(), d.getProductId())) {
                matching.add(i);
            }
        }
        if (matching.isEmpty()) {
            return Optional.empty();
        }

        BigDecimal base = BigDecimal.ZERO;
        int quantity = 0;
        for (int i : matching) {
            base = base.add(lines.get(i).amount());
            quantity += lines.get(i).quantity();
        }

        if (d.getMinPurchase() != null && base.compareTo(d.getMinPurchase()) < 0) {
            return Optional.empty();
        }
        if (d.getMinQuantity() != null && quantity < d.getMinQuantity()) {
            return Optional.empty();
        }

        BigDecimal amount = d.getType() == DiscountType.PERCENT
                ? base.multiply(d.getDiscountValue()).divide(HUNDRED, 2, RoundingMode.HALF_UP)
                : d.getDiscountValue();
        amount = amount.min(base).setScale(2, RoundingMode.HALF_UP);

        if (amount.signum() <= 0) {
            return Optional.empty();
        }

        return Optional.of(new DiscountResult(d.getId(), d.getName(), amount,
                allocate(amount, base, matching, lines)));
    }

    // Split the discount across matching lines in proportion to their amount; the last line takes the remainder
    private List<BigDecimal> allocate(BigDecimal amount, BigDecimal base,
                                      List<Integer> matching, List<DiscountContext.Line> lines) {
        List<BigDecimal> result = new ArrayList<>(Collections.nCopies(lines.size(), BigDecimal.ZERO.setScale(2)));
        BigDecimal remaining = amount;
        for (int k = 0; k < matching.size(); k++) {
            int i = matching.get(k);
            BigDecimal share;
            if (k == matching.size() - 1) {
                share = remaining;
            } else {
                share = amount.multiply(lines.get(i).amount()).divide(base, 2, RoundingMode.HALF_UP);
                remaining = remaining.subtract(share);
            }
            result.set(i, share);
        }
        return result;
    }
}