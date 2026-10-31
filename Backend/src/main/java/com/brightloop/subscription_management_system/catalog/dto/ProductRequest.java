package com.brightloop.subscription_management_system.catalog.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record ProductRequest(

        @NotBlank
        @Size(max = 160)
        String name,

        @NotBlank
        @Size(max = 40)
        String type,

        @NotNull
        @DecimalMin("0.00")
        @Digits(integer = 12, fraction = 2)
        BigDecimal salesPrice,

        @DecimalMin("0.00")
        @Digits(integer = 12, fraction = 2)
        BigDecimal costPrice,

        Long taxId,

        BigDecimal taxPercent,

        String notes,

        String description,

        List<ProductVariantRequest> variants

) {
    public BigDecimal costPrice() {
        return costPrice != null ? costPrice : BigDecimal.ZERO;
    }

    public String effectiveNotes() {
        if (notes != null && !notes.isBlank()) return notes;
        return description;
    }
}