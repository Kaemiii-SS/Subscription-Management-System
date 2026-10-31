package com.brightloop.subscription_management_system.billing.repository;

import com.brightloop.subscription_management_system.billing.entity.BillingRun;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BillingRunRepository extends JpaRepository<BillingRun, Long> {
}
