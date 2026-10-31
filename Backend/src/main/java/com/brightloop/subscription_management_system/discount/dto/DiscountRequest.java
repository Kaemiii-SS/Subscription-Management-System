package com.brightloop.subscription_management_system.discount.dto;

import com.brightloop.subscription_management_system.discount.entity.DiscountAppliesTo;
import com.brightloop.subscription_management_system.discount.entity.DiscountType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DiscountRequest(
        String name,
        DiscountType type,
        BigDecimal value,
        BigDecimal minPurchase,
        Integer minQuantity,
        LocalDate startDate,
        LocalDate endDate,
        Integer usageLimit,
        DiscountAppliesTo appliesTo,
        Long productId,
        String code,
        Integer minSeats,
        Long targetProductId
) {
    public DiscountRequest {
        if (name == null || name.isBlank()) {
            name = code != null && !code.isBlank() ? code : "Discount";
        }
        if (startDate == null) {
            startDate = LocalDate.now();
        }
        if (endDate == null) {
            endDate = LocalDate.now().plusYears(1);
        }
        if (usageLimit == null) {
            usageLimit = 100;
        }
        if (productId == null && targetProductId != null) {
            productId = targetProductId;
        }
        if (appliesTo == null) {
            appliesTo = (productId != null) ? DiscountAppliesTo.PRODUCT : DiscountAppliesTo.SUBSCRIPTION;
        }
        if (type == null) {
            type = DiscountType.PERCENT;
        }
        if (value == null) {
            value = BigDecimal.TEN;
        }
        if (minQuantity == null && minSeats != null) {
            minQuantity = minSeats;
        }
    }
}