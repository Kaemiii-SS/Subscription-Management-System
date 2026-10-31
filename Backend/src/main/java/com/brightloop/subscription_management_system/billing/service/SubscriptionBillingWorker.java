package com.brightloop.subscription_management_system.billing.service;

import com.brightloop.subscription_management_system.billing.entity.Invoice;
import com.brightloop.subscription_management_system.billing.repository.InvoiceRepository;
import com.brightloop.subscription_management_system.catalog.entity.Plan;
import com.brightloop.subscription_management_system.subscription.entity.Subscription;
import com.brightloop.subscription_management_system.subscription.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionBillingWorker {

    private final InvoiceService invoiceService;
    private final InvoiceRepository invoiceRepository;
    private final SubscriptionRepository subscriptionRepository;

    public enum ProcessStatus {
        CREATED,
        SKIPPED
    }

    /**
     * Runs in its own transaction (REQUIRES_NEW) so that if one subscription fails,
     * it rolls back only this subscription without affecting others.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ProcessStatus processSubscription(Long subscriptionId, LocalDate runDate) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalStateException("Subscription not found: " + subscriptionId));

        if (!"ACTIVE".equals(subscription.getStatus())) {
            log.info("Subscription {} is not ACTIVE (status: {}), skipping", subscription.getNumber(), subscription.getStatus());
            return ProcessStatus.SKIPPED;
        }

        LocalDate nextBillingDate = subscription.getNextBillingDate();
        if (nextBillingDate == null || nextBillingDate.isAfter(runDate)) {
            return ProcessStatus.SKIPPED;
        }

        if (nextBillingDate.isAfter(subscription.getExpiryDate())) {
            return ProcessStatus.SKIPPED;
        }

        Plan plan = subscription.getPlan();
        boolean createdAny = false;

        // Catch-up loop: bills missed periods period-by-period
        while (subscription.getNextBillingDate() != null
                && !subscription.getNextBillingDate().isAfter(runDate)
                && !subscription.getNextBillingDate().isAfter(subscription.getExpiryDate())) {

            LocalDate periodStart = subscription.getNextBillingDate();
            LocalDate periodEnd = calculatePeriodEnd(periodStart, plan.getBillingPeriod());

            if (invoiceRepository.existsBySubscriptionIdAndPeriodStartAndStatusNot(subscription.getId(), periodStart, "CANCELLED")) {
                log.info("Invoice already exists for subscription {} period {}, advancing next billing date",
                        subscription.getNumber(), periodStart);
                subscription.setNextBillingDate(periodEnd.plusDays(1));
                subscriptionRepository.save(subscription);
                continue;
            }

            try {
                Invoice invoice = invoiceService.generateFor(subscription, periodStart, periodEnd, runDate);
                createdAny = true;
                log.info("Created invoice {} for subscription {}", invoice.getNumber(), subscription.getNumber());
            } catch (DataIntegrityViolationException e) {
                log.warn("Unique constraint hit for subscription {} period {}: counting as skipped",
                        subscription.getNumber(), periodStart);
                subscription.setNextBillingDate(periodEnd.plusDays(1));
                subscriptionRepository.save(subscription);
            }
        }

        return createdAny ? ProcessStatus.CREATED : ProcessStatus.SKIPPED;
    }

    private LocalDate calculatePeriodEnd(LocalDate periodStart, String billingPeriod) {
        return switch (billingPeriod.toUpperCase()) {
            case "DAILY" -> periodStart;
            case "WEEKLY" -> periodStart.plusWeeks(1).minusDays(1);
            case "MONTHLY" -> periodStart.plusMonths(1).minusDays(1);
            case "YEARLY" -> periodStart.plusYears(1).minusDays(1);
            default -> throw new IllegalStateException("Unsupported billing period: " + billingPeriod);
        };
    }
}
