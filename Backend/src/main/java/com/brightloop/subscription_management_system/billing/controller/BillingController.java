package com.brightloop.subscription_management_system.billing.controller;

import com.brightloop.subscription_management_system.auth.service.CurrentUserService;
import com.brightloop.subscription_management_system.billing.dto.BillingRunRequest;
import com.brightloop.subscription_management_system.billing.dto.BillingRunResponse;
import com.brightloop.subscription_management_system.billing.service.BillingJobService;
import com.brightloop.subscription_management_system.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/v1/billing", "/api/billing"})
@RequiredArgsConstructor
public class BillingController {

    private final BillingJobService billingJobService;
    private final CurrentUserService currentUserService;

    @PostMapping("/run")
    @PreAuthorize("hasRole('ADMIN')")
    public BillingRunResponse runBilling(
            @RequestBody(required = false) BillingRunRequest request
    ) {
        User currentUser = currentUserService.getCurrentUserEntityOptional().orElse(null);
        Long subscriptionId = request != null ? request.subscriptionId() : null;
        return billingJobService.runBilling(subscriptionId, currentUser);
    }
}
