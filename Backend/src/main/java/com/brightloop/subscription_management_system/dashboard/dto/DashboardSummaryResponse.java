package com.brightloop.subscription_management_system.dashboard.dto;

public record DashboardSummaryResponse(
        long activeSubscriptions,
        String revenueCollected,
        String amountOwed,
        long overdueCount,
        String overdueAmount
) {
    public String getAmountStillOwed() {
        return amountOwed;
    }
}
