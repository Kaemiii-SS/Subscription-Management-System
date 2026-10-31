package com.brightloop.subscription_management_system.catalog.dto;

import java.math.BigDecimal;
import java.util.List;

public record ProductResponse(

        Long id,
        String name,
        String type,
        BigDecimal salesPrice,
        BigDecimal costPrice,
        Long taxId,
        String taxName,
        BigDecimal taxPercent,
        String notes,
        Boolean active,
        List<ProductVariantResponse> variants

) {
    public String getDescription() {
        return notes;
    }
}