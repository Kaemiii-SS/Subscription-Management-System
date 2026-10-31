package com.brightloop.subscription_management_system.subscription.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record SubscriptionResponse(

        Long id,
        String number,
        Long customerId,
        String customerName,
        Long planId,
        String planName,
        Long templateId,
        String status,
        LocalDate startDate,
        LocalDate expiryDate,
        Integer paymentTermsDays,
        LocalDate quoteValidUntil,
        LocalDate nextBillingDate,
        BigDecimal subtotal,
        BigDecimal taxTotal,
        BigDecimal total,
        List<SubscriptionLineResponse> lines

) {

    public record SubscriptionLineResponse(
            Long id,
            Long productId,
            String productName,
            Long variantId,
            String description,
            Integer quantity,
            BigDecimal unitPrice,
            BigDecimal taxPercent,
            BigDecimal lineSubtotal,
            BigDecimal taxAmount,
            BigDecimal lineTotal
    ) {}
}