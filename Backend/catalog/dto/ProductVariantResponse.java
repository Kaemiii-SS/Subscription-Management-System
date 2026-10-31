package com.brightloop.subscription_management_system.catalog.dto;

import java.math.BigDecimal;

public record ProductVariantResponse(

        Long id,
        String attribute,
        String value,
        BigDecimal extraPrice,
        BigDecimal finalPrice,
        Boolean active

) {}