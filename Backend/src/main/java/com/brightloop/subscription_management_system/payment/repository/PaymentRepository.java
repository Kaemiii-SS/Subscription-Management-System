package com.brightloop.subscription_management_system.payment.repository;

import com.brightloop.subscription_management_system.payment.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long>, JpaSpecificationExecutor<Payment> {

    List<Payment> findByInvoiceIdOrderByPaymentDateDesc(Long invoiceId);

    Page<Payment> findByInvoiceCustomerId(Long customerId, Pageable pageable);

    Optional<Payment> findByIdAndInvoiceCustomerId(Long id, Long customerId);
}
