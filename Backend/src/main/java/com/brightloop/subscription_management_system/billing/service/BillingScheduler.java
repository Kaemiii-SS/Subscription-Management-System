package com.brightloop.subscription_management_system.billing.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class BillingScheduler {

    private final BillingJobService billingJobService;

    // Default: 02:00 AM every day
    @Scheduled(cron = "${app.billing.cron:0 0 2 * * ?}")
    public void runDailyBillingJob() {
        log.info("BillingScheduler triggered daily billing job");
        try {
            billingJobService.runBilling(null, null);
        } catch (Exception e) {
            log.error("Error executing daily scheduled billing job: {}", e.getMessage(), e);
        }
    }
}
