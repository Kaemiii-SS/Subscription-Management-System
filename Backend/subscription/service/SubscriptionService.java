
package com.brightloop.subscription_management_system.subscription.service;

import com.brightloop.subscription_management_system.auth.service.CurrentUserService;
import com.brightloop.subscription_management_system.catalog.entity.Plan;
import com.brightloop.subscription_management_system.catalog.entity.Product;
import com.brightloop.subscription_management_system.catalog.entity.ProductVariant;
import com.brightloop.subscription_management_system.catalog.entity.Tax;
import com.brightloop.subscription_management_system.subscription.dto.SubscriptionCreateRequest;
import com.brightloop.subscription_management_system.subscription.dto.SubscriptionResponse;
import com.brightloop.subscription_management_system.subscription.entity.QuotationTemplate;
import com.brightloop.subscription_management_system.subscription.entity.Subscription;
import com.brightloop.subscription_management_system.subscription.entity.SubscriptionLine;
import com.brightloop.subscription_management_system.subscription.entity.SubscriptionStatusHistory;
import com.brightloop.subscription_management_system.subscription.repository.QuotationTemplateRepository;
import com.brightloop.subscription_management_system.subscription.repository.SubscriptionRepository;
import com.brightloop.subscription_management_system.subscription.repository.SubscriptionStatusHistoryRepository;
import com.brightloop.subscription_management_system.user.entity.User;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final QuotationTemplateRepository templateRepository;
    private final SubscriptionStatusHistoryRepository historyRepository;
    private final SubscriptionNumberService numberService;
    private final CurrentUserService currentUserService;

    public SubscriptionResponse create(SubscriptionCreateRequest request) {

        User customer = currentUserService.getCurrentUserEntity();

        QuotationTemplate template = templateRepository.findById(request.templateId())
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Quotation template not found: " + request.templateId()
                        ));

        if (!Boolean.TRUE.equals(template.getActive())) {
            throw new IllegalArgumentException("Quotation template is inactive");
        }

        Plan plan = template.getPlan();

        if (!Boolean.TRUE.equals(plan.getActive())) {
            throw new IllegalArgumentException("Plan is inactive");
        }

        LocalDate startDate = request.startDate();

        if (startDate.isBefore(plan.getAvailableFrom())) {
            throw new IllegalArgumentException("Plan is not available on the selected start date");
        }

        if (plan.getAvailableTo() != null
                && startDate.isAfter(plan.getAvailableTo())) {
            throw new IllegalArgumentException("Plan is no longer available on the selected start date");
        }

        Subscription subscription = new Subscription();

        subscription.setNumber(numberService.generate());
        subscription.setCustomer(customer);
        subscription.setPlan(plan);
        subscription.setTemplate(template);
        subscription.setStatus("DRAFT");
        subscription.setStartDate(startDate);
        subscription.setExpiryDate(startDate.plusDays(template.getValidityDays()));
        subscription.setPaymentTermsDays(request.paymentTermsDays());

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;
        BigDecimal total = BigDecimal.ZERO;

        for (var templateLine : template.getLines()) {

            Product product = templateLine.getProduct();

            if (!Boolean.TRUE.equals(product.getActive())) {
                throw new IllegalArgumentException(
                        "Product is inactive: " + product.getName()
                );
            }

            if (templateLine.getQuantity() < plan.getMinQuantity()) {
                throw new IllegalArgumentException(
                        "Minimum quantity for this plan is " + plan.getMinQuantity()
                );
            }

            ProductVariant variant = templateLine.getVariant();

            if (variant != null && !Boolean.TRUE.equals(variant.getActive())) {
                throw new IllegalArgumentException(
                        "Product variant is inactive: " + variant.getId()
                );
            }

            BigDecimal unitPrice = product.getSalesPrice();

            if (variant != null) {
                unitPrice = unitPrice.add(variant.getExtraPrice());
            }

            Tax tax = product.getTax();

            BigDecimal taxPercent = BigDecimal.ZERO;

            if (tax != null && Boolean.TRUE.equals(tax.getActive())) {
                taxPercent = tax.getPercent();
            }

            BigDecimal lineSubtotal = unitPrice
                    .multiply(BigDecimal.valueOf(templateLine.getQuantity()));

            BigDecimal taxAmount = lineSubtotal
                    .multiply(taxPercent)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            BigDecimal lineTotal = lineSubtotal.add(taxAmount);

            SubscriptionLine line = new SubscriptionLine();

            line.setProduct(product);
            line.setVariant(variant);
            line.setDescription(product.getName());
            line.setQuantity(templateLine.getQuantity());
            line.setUnitPrice(unitPrice);
            line.setTaxPercent(taxPercent);
            line.setLineSubtotal(lineSubtotal);
            line.setTaxAmount(taxAmount);
            line.setLineTotal(lineTotal);

            subscription.addLine(line);

            subtotal = subtotal.add(lineSubtotal);
            taxTotal = taxTotal.add(taxAmount);
            total = total.add(lineTotal);
        }

        subscription.setSubtotal(subtotal);
        subscription.setTaxTotal(taxTotal);
        subscription.setTotal(total);

        Subscription saved = subscriptionRepository.save(subscription);

        SubscriptionStatusHistory history = new SubscriptionStatusHistory();
        history.setSubscription(saved);
        history.setFromStatus(null);
        history.setToStatus("DRAFT");
        history.setChangedBy(customer);
        history.setNote("Subscription created");

        historyRepository.save(history);

        return mapToResponse(saved);
    }

    private SubscriptionResponse mapToResponse(Subscription subscription) {

        List<SubscriptionResponse.SubscriptionLineResponse> lines =
                subscription.getLines().stream()
                        .map(line ->
                                new SubscriptionResponse.SubscriptionLineResponse(
                                        line.getId(),
                                        line.getProduct().getId(),
                                        line.getProduct().getName(),
                                        line.getVariant() != null
                                                ? line.getVariant().getId()
                                                : null,
                                        line.getDescription(),
                                        line.getQuantity(),
                                        line.getUnitPrice(),
                                        line.getTaxPercent(),
                                        line.getLineSubtotal(),
                                        line.getTaxAmount(),
                                        line.getLineTotal()
                                ))
                        .toList();

        return new SubscriptionResponse(
                subscription.getId(),
                subscription.getNumber(),
                subscription.getCustomer().getId(),
                subscription.getCustomer().getName(),
                subscription.getPlan().getId(),
                subscription.getPlan().getName(),
                subscription.getTemplate() != null
                        ? subscription.getTemplate().getId()
                        : null,
                subscription.getStatus(),
                subscription.getStartDate(),
                subscription.getExpiryDate(),
                subscription.getPaymentTermsDays(),
                subscription.getQuoteValidUntil(),
                subscription.getNextBillingDate(),
                subscription.getSubtotal(),
                subscription.getTaxTotal(),
                subscription.getTotal(),
                lines
        );
    }
}
