package com.brightloop.subscription_management_system.catalog.dto;

import java.math.BigDecimal;

public record TaxResponse(
        Long id,
        String name,
        BigDecimal percent,
        Boolean active
) {}