package com.brightloop.subscription_management_system.billing.dto;

import java.util.List;

public record BillingRunResponse(
        int created,
        int skipped,
        int failed,
        List<FailureDetail> failures
) {
    public record FailureDetail(
            Long subscriptionId,
            String reason
    ) {}
}
