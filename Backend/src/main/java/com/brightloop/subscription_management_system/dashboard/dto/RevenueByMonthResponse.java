package com.brightloop.subscription_management_system.dashboard.dto;

import java.math.BigDecimal;

public record RevenueByMonthResponse(
        String month,
        String billed,
        String collected
) {
    public BigDecimal getRecurring() {
        try {
            return new BigDecimal(collected != null ? collected : "0");
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    public BigDecimal getAddOns() {
        return BigDecimal.ZERO;
    }

    public BigDecimal getTotal() {
        try {
            return new BigDecimal(billed != null ? billed : "0");
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }
}
