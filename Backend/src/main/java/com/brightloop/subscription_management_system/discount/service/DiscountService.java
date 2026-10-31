package com.brightloop.subscription_management_system.discount.service;

import com.brightloop.subscription_management_system.catalog.repository.ProductRepository;
import com.brightloop.subscription_management_system.discount.dto.DiscountPageResponse;
import com.brightloop.subscription_management_system.discount.dto.DiscountRequest;
import com.brightloop.subscription_management_system.discount.dto.DiscountResponse;
import com.brightloop.subscription_management_system.discount.entity.Discount;
import com.brightloop.subscription_management_system.discount.entity.DiscountAppliesTo;
import com.brightloop.subscription_management_system.discount.entity.DiscountType;
import com.brightloop.subscription_management_system.discount.repository.DiscountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class DiscountService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private final DiscountRepository discountRepository;
    private final ProductRepository productRepository;

    @Transactional
    public DiscountResponse create(DiscountRequest request) {
        Discount discount = new Discount();
        apply(discount, request);
        discount.setActive(true);
        return toResponse(discountRepository.save(discount));
    }

    @Transactional
    public DiscountResponse update(Long id, DiscountRequest request) {
        Discount discount = find(id);
        apply(discount, request);
        return toResponse(discount);
    }

    @Transactional(readOnly = true)
    public DiscountResponse get(Long id) {
        return toResponse(find(id));
    }

    @Transactional(readOnly = true)
    public DiscountPageResponse list(Boolean active, Boolean expired, Pageable pageable) {
        LocalDate today = LocalDate.now();

        Specification<Discount> spec = (root, query, cb) -> cb.conjunction();
        if (active != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("active"), active));
        }
        if (expired != null) {
            if (expired) {
                spec = spec.and((root, query, cb) -> cb.lessThan(root.<LocalDate>get("endDate"), today));
            } else {
                spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.<LocalDate>get("endDate"), today));
            }
        }

        Sort sort = pageable.getSort().isSorted() ? pageable.getSort() : Sort.by(Sort.Direction.DESC, "createdAt");
        Pageable safe = PageRequest.of(pageable.getPageNumber(), Math.min(pageable.getPageSize(), MAX_PAGE_SIZE), sort);

        Page<Discount> page = discountRepository.findAll(spec, safe);
        return new DiscountPageResponse(
                page.getContent().stream().map(this::toResponse).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());
    }

    @Transactional
    public void deactivate(Long id) {
        find(id).setActive(false);
    }

    /**
     * Uses one slot of a discount. Must be called inside the invoice transaction,
     * so if the invoice fails, the slot is rolled back too.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void useSlot(Long discountId) {
        int updated = discountRepository.tryUseSlot(discountId);
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Discount is used up or not active");
        }
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void revertSlot(Long discountId) {
        if (discountId != null) {
            discountRepository.revertSlot(discountId);
        }
    }

    // ---------- helpers ----------

    private Discount find(Long id) {
        return discountRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Discount not found"));
    }

    private void apply(Discount d, DiscountRequest r) {
        if (r.endDate().isBefore(r.startDate())) {
            throw bad("endDate cannot be before startDate");
        }
        if (r.type() == DiscountType.PERCENT && r.value().compareTo(HUNDRED) > 0) {
            throw bad("Percent value cannot be more than 100");
        }
        if (r.appliesTo() == DiscountAppliesTo.PRODUCT) {
            if (r.productId() == null) {
                throw bad("productId is required when appliesTo is PRODUCT");
            }
            if (!productRepository.existsById(r.productId())) {
                throw bad("Product not found");
            }
        } else if (r.productId() != null) {
            throw bad("productId must be empty when appliesTo is SUBSCRIPTION");
        }
        if (r.usageLimit() != null && r.usageLimit() < d.getUsedCount()) {
            throw bad("usageLimit cannot be less than the already used count (" + d.getUsedCount() + ")");
        }

        d.setName(r.name().trim());
        d.setType(r.type());
        d.setDiscountValue(r.value());
        d.setMinPurchase(r.minPurchase());
        d.setMinQuantity(r.minQuantity());
        d.setStartDate(r.startDate());
        d.setEndDate(r.endDate());
        d.setUsageLimit(r.usageLimit());
        d.setAppliesTo(r.appliesTo());
        d.setProductId(r.appliesTo() == DiscountAppliesTo.PRODUCT ? r.productId() : null);
    }

    private ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private DiscountResponse toResponse(Discount d) {
        return new DiscountResponse(
                d.getId(),
                d.getName(),
                d.getType(),
                d.getDiscountValue().setScale(2),
                d.getMinPurchase() == null ? null : d.getMinPurchase().setScale(2),
                d.getMinQuantity(),
                d.getStartDate(),
                d.getEndDate(),
                d.getUsageLimit(),
                d.getUsedCount(),
                d.getAppliesTo(),
                d.getProductId(),
                d.isActive(),
                d.getEndDate().isBefore(LocalDate.now()));
    }
}