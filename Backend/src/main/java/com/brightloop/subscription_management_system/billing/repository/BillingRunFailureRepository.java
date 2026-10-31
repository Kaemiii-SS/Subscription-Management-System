package com.brightloop.subscription_management_system.billing.repository;

import com.brightloop.subscription_management_system.billing.entity.BillingRunFailure;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BillingRunFailureRepository extends JpaRepository<BillingRunFailure, Long> {
    List<BillingRunFailure> findByRunId(Long runId);
}
