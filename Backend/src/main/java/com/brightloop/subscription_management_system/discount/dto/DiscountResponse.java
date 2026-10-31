package com.brightloop.subscription_management_system.discount.dto;

import com.brightloop.subscription_management_system.discount.entity.DiscountAppliesTo;
import com.brightloop.subscription_management_system.discount.entity.DiscountType;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DiscountResponse(
        Long id,
        String name,
        DiscountType type,
        @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal value,
        @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal minPurchase,
        Integer minQuantity,
        LocalDate startDate,
        LocalDate endDate,
        Integer usageLimit,
        int usedCount,
        DiscountAppliesTo appliesTo,
        Long productId,
        boolean active,
        boolean expired
) {
    public String getCode() {
        return name;
    }

    public Integer getMinSeats() {
        return minQuantity != null ? minQuantity : 1;
    }

    public Long getTargetProductId() {
        return productId;
    }
}