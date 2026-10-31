package com.brightloop.subscription_management_system.discount.dto;

import com.brightloop.subscription_management_system.discount.entity.DiscountAppliesTo;
import com.brightloop.subscription_management_system.discount.entity.DiscountType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DiscountRequest(
        @NotBlank @Size(max = 120) String name,
        @NotNull DiscountType type,
        @NotNull @DecimalMin("0.01") BigDecimal value,
        @DecimalMin("0.00") BigDecimal minPurchase,
        @Min(0) Integer minQuantity,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @Min(1) Integer usageLimit,
        @NotNull DiscountAppliesTo appliesTo,
        Long productId
) {
}