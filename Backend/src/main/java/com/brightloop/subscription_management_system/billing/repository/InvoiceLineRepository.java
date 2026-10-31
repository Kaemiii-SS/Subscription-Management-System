package com.brightloop.subscription_management_system.billing.repository;

import com.brightloop.subscription_management_system.billing.entity.InvoiceLine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InvoiceLineRepository extends JpaRepository<InvoiceLine, Long> {
    List<InvoiceLine> findByInvoiceId(Long invoiceId);
}
