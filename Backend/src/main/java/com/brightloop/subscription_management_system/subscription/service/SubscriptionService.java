
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
import com.brightloop.subscription_management_system.catalog.repository.PlanRepository;
import com.brightloop.subscription_management_system.catalog.repository.ProductRepository;
import com.brightloop.subscription_management_system.catalog.repository.ProductVariantRepository;
import com.brightloop.subscription_management_system.user.repository.UserRepository;
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
    private final PlanRepository planRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final UserRepository userRepository;

    public SubscriptionResponse create(SubscriptionCreateRequest request) {

        User customer = null;
        if (request.customerId() != null) {
            customer = userRepository.findById(request.customerId()).orElse(null);
        }
        if (customer == null) {
            customer = currentUserService.getCurrentUserEntityOptional().orElse(null);
        }
        if (customer == null) {
            customer = userRepository.findAll().stream().findFirst().orElseThrow(() -> new IllegalStateException("No customer found"));
        }

        if (request.templateId() == null && request.planId() != null) {
            Plan plan = planRepository.findById(request.planId())
                    .orElseThrow(() -> new EntityNotFoundException("Plan not found: " + request.planId()));

            LocalDate startDate = request.effectiveStartDate();
            LocalDate expiryDate = request.expiryDate() != null ? request.expiryDate() : startDate.plusMonths(1);

            Subscription subscription = new Subscription();
            subscription.setNumber(numberService.generate());
            subscription.setCustomer(customer);
            subscription.setPlan(plan);
            subscription.setStatus("DRAFT");
            subscription.setStartDate(startDate);
            subscription.setExpiryDate(expiryDate);
            subscription.setPaymentTermsDays(request.effectivePaymentTermsDays());

            BigDecimal subtotal = BigDecimal.ZERO;
            BigDecimal taxTotal = BigDecimal.ZERO;

            if (request.lines() != null) {
                for (var lineReq : request.lines()) {
                    Product product = productRepository.findById(lineReq.productId())
                            .orElseThrow(() -> new EntityNotFoundException("Product not found: " + lineReq.productId()));

                    ProductVariant variant = lineReq.variantId() != null
                            ? variantRepository.findById(lineReq.variantId()).orElse(null)
                            : null;

                    BigDecimal unitPrice = lineReq.unitPrice() != null ? lineReq.unitPrice() : product.getSalesPrice();
                    int qty = lineReq.quantity() != null ? lineReq.quantity() : 1;
                    BigDecimal lineSubtotal = unitPrice.multiply(BigDecimal.valueOf(qty));
                    BigDecimal taxPct = lineReq.taxPercent() != null ? lineReq.taxPercent() : (product.getTax() != null ? product.getTax().getPercent() : BigDecimal.ZERO);
                    BigDecimal lineTax = lineSubtotal.multiply(taxPct).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                    BigDecimal lineTotal = lineSubtotal.add(lineTax);

                    SubscriptionLine line = new SubscriptionLine();
                    line.setSubscription(subscription);
                    line.setProduct(product);
                    line.setVariant(variant);
                    line.setDescription(product.getName() + (variant != null ? " (" + variant.getValue() + ")" : ""));
                    line.setQuantity(qty);
                    line.setUnitPrice(unitPrice);
                    line.setTaxPercent(taxPct);
                    line.setLineSubtotal(lineSubtotal);
                    line.setTaxAmount(lineTax);
                    line.setLineTotal(lineTotal);

                    subscription.getLines().add(line);
                    subtotal = subtotal.add(lineSubtotal);
                    taxTotal = taxTotal.add(lineTax);
                }
            }

            subscription.setSubtotal(subtotal);
            subscription.setTaxTotal(taxTotal);
            subscription.setTotal(subtotal.add(taxTotal));

            Subscription saved = subscriptionRepository.save(subscription);

            SubscriptionStatusHistory history = new SubscriptionStatusHistory();
            history.setSubscription(saved);
            history.setFromStatus(null);
            history.setToStatus("DRAFT");
            history.setChangedBy(customer);
            history.setNote("Subscription created in DRAFT status");
            historyRepository.save(history);

            return mapToResponse(saved);
        }

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

        LocalDate startDate = request.effectiveStartDate();

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
