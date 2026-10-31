package com.brightloop.subscription_management_system.discount.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record DiscountContext(LocalDate date, List<Line> lines) {

    public record Line(Long productId, int quantity, BigDecimal amount) {
    }
}