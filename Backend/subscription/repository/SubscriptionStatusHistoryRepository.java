package com.brightloop.subscription_management_system.subscription.repository;

import com.brightloop.subscription_management_system.subscription.entity.SubscriptionStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubscriptionStatusHistoryRepository
        extends JpaRepository<SubscriptionStatusHistory, Long> {

    List<SubscriptionStatusHistory>
    findBySubscriptionIdOrderByCreatedAtDesc(Long subscriptionId);
}