package com.brightloop.subscription_management_system.billing.repository;

import com.brightloop.subscription_management_system.billing.entity.DiscountUsage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DiscountUsageRepository extends JpaRepository<DiscountUsage, Long> {
    Optional<DiscountUsage> findByInvoiceId(Long invoiceId);
    void deleteByInvoiceId(Long invoiceId);
}
