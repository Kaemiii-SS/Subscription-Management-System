
package com.brightloop.subscription_management_system.subscription.service;

import com.brightloop.subscription_management_system.auth.service.CurrentUserService;
import com.brightloop.subscription_management_system.catalog.entity.Plan;
import com.brightloop.subscription_management_system.subscription.entity.Subscription;
import com.brightloop.subscription_management_system.subscription.entity.SubscriptionStatusHistory;
import com.brightloop.subscription_management_system.subscription.repository.SubscriptionRepository;
import com.brightloop.subscription_management_system.subscription.repository.SubscriptionStatusHistoryRepository;
import com.brightloop.subscription_management_system.user.entity.User;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SubscriptionLifecycleService {

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionStatusHistoryRepository historyRepository;
    private final CurrentUserService currentUserService;

    private Subscription getSubscription(Long id) {
        return subscriptionRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException("Subscription not found: " + id));
    }

    @Transactional(readOnly = true)
    public Page<Subscription> getCustomerSubscriptions(Pageable pageable) {
        User customer = currentUserService.getCurrentUserEntity();
        return subscriptionRepository.findByCustomerId(customer.getId(), pageable);
    }

    @Transactional(readOnly = true)
    public Subscription getCustomerSubscription(Long id) {
        User customer = currentUserService.getCurrentUserEntity();

        return subscriptionRepository.findByIdAndCustomerId(id, customer.getId())
                .orElseThrow(() ->
                        new EntityNotFoundException("Subscription not found: " + id));
    }

    @Transactional(readOnly = true)
    public Page<Subscription> getAllSubscriptions(Pageable pageable) {
        return subscriptionRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Subscription getSubscriptionForStaff(Long id) {
        return getSubscription(id);
    }

    public Subscription quote(Long id) {
        return transition(id, "QUOTATION", "Subscription sent as quotation");
    }

    public Subscription confirm(Long id) {
        return transition(id, "CONFIRMED", "Subscription quotation confirmed");
    }

    public Subscription activate(Long id) {
        Subscription subscription = getSubscription(id);
        String previousStatus = subscription.getStatus();

        subscription.transitionTo("ACTIVE");
        subscription.setActivatedAt(OffsetDateTime.now());
        subscription.setNextBillingDate(subscription.getStartDate());

        saveHistory(subscription, previousStatus, "ACTIVE", "Subscription activated");

        return subscriptionRepository.save(subscription);
    }

    public Subscription pause(Long id) {
        Subscription subscription = getSubscription(id);

        if (!Boolean.TRUE.equals(subscription.getPlan().getPausable())) {
            throw new IllegalStateException("This plan does not allow pausing");
        }

        return transition(id, "PAUSED", "Subscription paused");
    }

    public Subscription resume(Long id) {
        Subscription subscription = getSubscription(id);
        String previousStatus = subscription.getStatus();

        subscription.transitionTo("ACTIVE");

        LocalDate nextBillingDate = subscription.getNextBillingDate();

        if (nextBillingDate != null && nextBillingDate.isBefore(LocalDate.now())) {
            subscription.setNextBillingDate(LocalDate.now());
        }

        saveHistory(subscription, previousStatus, "ACTIVE", "Subscription resumed");

        return subscriptionRepository.save(subscription);
    }

    public Subscription close(Long id) {
        Subscription subscription = getSubscription(id);

        if ("ACTIVE".equals(subscription.getStatus())
                && !Boolean.TRUE.equals(subscription.getPlan().getClosable())) {
            throw new IllegalStateException("This plan does not allow early closure");
        }

        String previousStatus = subscription.getStatus();

        subscription.transitionTo("CLOSED");
        subscription.setClosedAt(OffsetDateTime.now());

        saveHistory(subscription, previousStatus, "CLOSED", "Subscription closed");

        return subscriptionRepository.save(subscription);
    }

    public Subscription renew(Long id) {
        Subscription subscription = getSubscription(id);
        Plan plan = subscription.getPlan();

        if (!"ACTIVE".equals(subscription.getStatus())) {
            throw new IllegalStateException("Only active subscriptions can be renewed");
        }

        if (!Boolean.TRUE.equals(plan.getRenewable())) {
            throw new IllegalStateException("This plan does not allow renewal");
        }

        LocalDate currentExpiry = subscription.getExpiryDate();

        LocalDate newExpiry = switch (plan.getBillingPeriod().toUpperCase()) {
            case "DAILY" -> currentExpiry.plusDays(1);
            case "WEEKLY" -> currentExpiry.plusWeeks(1);
            case "MONTHLY" -> currentExpiry.plusMonths(1);
            case "YEARLY" -> currentExpiry.plusYears(1);
            default -> throw new IllegalStateException(
                    "Unsupported billing period: " + plan.getBillingPeriod()
            );
        };

        subscription.setExpiryDate(newExpiry);

        saveHistory(
                subscription,
                "ACTIVE",
                "ACTIVE",
                "Subscription renewed until " + newExpiry
        );

        return subscriptionRepository.save(subscription);
    }

    @Transactional(readOnly = true)
    public List<SubscriptionStatusHistory> getActivity(Long id) {
        getSubscription(id);
        return historyRepository.findBySubscriptionIdOrderByCreatedAtDesc(id);
    }

    private Subscription transition(Long id, String nextStatus, String note) {
        Subscription subscription = getSubscription(id);
        String previousStatus = subscription.getStatus();

        subscription.transitionTo(nextStatus);

        if ("CLOSED".equals(nextStatus)) {
            subscription.setClosedAt(OffsetDateTime.now());
        }

        saveHistory(subscription, previousStatus, nextStatus, note);

        return subscriptionRepository.save(subscription);
    }

    private void saveHistory(
            Subscription subscription,
            String fromStatus,
            String toStatus,
            String note
    ) {
        SubscriptionStatusHistory history = new SubscriptionStatusHistory();
        history.setSubscription(subscription);
        history.setFromStatus(fromStatus);
        history.setToStatus(toStatus);
        history.setChangedBy(currentUserService.getCurrentUserEntity());
        history.setNote(note);

        historyRepository.save(history);
    }
}
