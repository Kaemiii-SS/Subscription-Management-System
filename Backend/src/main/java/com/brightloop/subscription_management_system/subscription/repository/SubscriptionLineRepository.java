package com.brightloop.subscription_management_system.subscription.repository;

import com.brightloop.subscription_management_system.subscription.entity.SubscriptionLine;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubscriptionLineRepository
        extends JpaRepository<SubscriptionLine, Long> {
}