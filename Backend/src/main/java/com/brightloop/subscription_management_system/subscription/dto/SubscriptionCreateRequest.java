package com.brightloop.subscription_management_system.subscription.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record SubscriptionCreateRequest(

        Long templateId,

        LocalDate startDate,

        Integer paymentTermsDays,

        Long customerId,

        Long planId,

        LocalDate expiryDate,

        String paymentTerms,

        List<SubscriptionLineItemRequest> lines

) {
    public SubscriptionCreateRequest(Long templateId, LocalDate startDate, Integer paymentTermsDays) {
        this(templateId, startDate, paymentTermsDays, null, null, null, null, null);
    }

    public LocalDate effectiveStartDate() {
        return startDate != null ? startDate : LocalDate.now();
    }

    public Integer effectivePaymentTermsDays() {
        if (paymentTermsDays != null) return paymentTermsDays;
        if (paymentTerms != null) {
            try {
                return Integer.parseInt(paymentTerms.replaceAll("[^0-9]", ""));
            } catch (Exception ignored) {}
        }
        return 14;
    }

    public record SubscriptionLineItemRequest(
            Long productId,
            Long variantId,
            Integer quantity,
            BigDecimal unitPrice,
            BigDecimal taxPercent,
            BigDecimal amount
    ) {}
}