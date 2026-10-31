package com.brightloop.subscription_management_system.billing.service;

import com.brightloop.subscription_management_system.billing.dto.BillingRunResponse;
import com.brightloop.subscription_management_system.billing.entity.BillingRun;
import com.brightloop.subscription_management_system.billing.entity.BillingRunFailure;
import com.brightloop.subscription_management_system.billing.repository.BillingRunFailureRepository;
import com.brightloop.subscription_management_system.billing.repository.BillingRunRepository;
import com.brightloop.subscription_management_system.subscription.entity.Subscription;
import com.brightloop.subscription_management_system.subscription.entity.SubscriptionStatusHistory;
import com.brightloop.subscription_management_system.subscription.repository.SubscriptionRepository;
import com.brightloop.subscription_management_system.subscription.repository.SubscriptionStatusHistoryRepository;
import com.brightloop.subscription_management_system.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillingJobService {

    private final SubscriptionBillingWorker billingWorker;
    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionStatusHistoryRepository historyRepository;
    private final BillingRunRepository billingRunRepository;
    private final BillingRunFailureRepository billingRunFailureRepository;

    public BillingRunResponse runBilling(Long singleSubscriptionId, User triggeredBy) {
        LocalDate today = LocalDate.now();
        log.info("Starting billing run for date {}, triggeredBy: {}, targetSubscription: {}",
                today, triggeredBy != null ? triggeredBy.getEmail() : "SCHEDULER", singleSubscriptionId);

        BillingRun run = new BillingRun();
        run.setStartedAt(OffsetDateTime.now());
        run.setTriggeredBy(triggeredBy);
        run = billingRunRepository.save(run);

        int created = 0;
        int skipped = 0;
        int failed = 0;
        List<BillingRunResponse.FailureDetail> failureDetails = new ArrayList<>();

        if (singleSubscriptionId != null) {
            try {
                SubscriptionBillingWorker.ProcessStatus status = billingWorker.processSubscription(singleSubscriptionId, today);
                if (status == SubscriptionBillingWorker.ProcessStatus.CREATED) {
                    created++;
                } else {
                    skipped++;
                }
            } catch (Exception e) {
                failed++;
                String reason = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
                recordFailure(run, singleSubscriptionId, reason);
                failureDetails.add(new BillingRunResponse.FailureDetail(singleSubscriptionId, reason));
            }
        } else {
            List<Subscription> dueSubscriptions = subscriptionRepository.findDueForBilling(today);
            log.info("Found {} subscriptions due for billing", dueSubscriptions.size());

            for (Subscription sub : dueSubscriptions) {
                try {
                    SubscriptionBillingWorker.ProcessStatus status = billingWorker.processSubscription(sub.getId(), today);
                    if (status == SubscriptionBillingWorker.ProcessStatus.CREATED) {
                        created++;
                    } else {
                        skipped++;
                    }
                } catch (Exception e) {
                    failed++;
                    String reason = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
                    log.error("Failed billing for subscription {}: {}", sub.getNumber(), reason);
                    recordFailure(run, sub.getId(), reason);
                    failureDetails.add(new BillingRunResponse.FailureDetail(sub.getId(), reason));
                }
            }
        }

        // Run auto-close step
        autoCloseExpiredSubscriptions(today);

        run.setFinishedAt(OffsetDateTime.now());
        run.setCreatedCount(created);
        run.setSkippedCount(skipped);
        run.setFailedCount(failed);
        billingRunRepository.save(run);

        log.info("Billing run completed: created={}, skipped={}, failed={}", created, skipped, failed);
        return new BillingRunResponse(created, skipped, failed, failureDetails);
    }

    private void recordFailure(BillingRun run, Long subscriptionId, String reason) {
        try {
            subscriptionRepository.findById(subscriptionId).ifPresent(sub -> {
                BillingRunFailure failure = new BillingRunFailure(run, sub, reason.length() > 490 ? reason.substring(0, 490) : reason);
                billingRunFailureRepository.save(failure);
            });
        } catch (Exception e) {
            log.error("Failed to record billing failure for subscription {}: {}", subscriptionId, e.getMessage());
        }
    }

    @Transactional
    public void autoCloseExpiredSubscriptions(LocalDate today) {
        List<Subscription> toClose = subscriptionRepository.findDueForAutoClose(today);
        if (toClose.isEmpty()) {
            return;
        }

        log.info("Auto-closing {} expired subscriptions", toClose.size());
        OffsetDateTime now = OffsetDateTime.now();

        for (Subscription s : toClose) {
            String prevStatus = s.getStatus();
            s.setStatus("CLOSED");
            s.setClosedAt(now);
            subscriptionRepository.save(s);

            SubscriptionStatusHistory history = new SubscriptionStatusHistory();
            history.setSubscription(s);
            history.setFromStatus(prevStatus);
            history.setToStatus("CLOSED");
            history.setNote("Auto-closed by system upon reaching expiry date");
            historyRepository.save(history);
        }
    }
}
