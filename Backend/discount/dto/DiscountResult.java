package com.brightloop.subscription_management_system.discount.dto;

import java.math.BigDecimal;
import java.util.List;

public record DiscountResult(
        Long discountId,
        String discountName,
        BigDecimal amount,
        List<BigDecimal> lineAllocations
) {
}