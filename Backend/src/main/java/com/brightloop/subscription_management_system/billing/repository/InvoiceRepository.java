package com.brightloop.subscription_management_system.billing.repository;

import com.brightloop.subscription_management_system.billing.entity.Invoice;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long>, JpaSpecificationExecutor<Invoice> {

    Optional<Invoice> findByNumber(String number);

    Optional<Invoice> findByIdAndCustomerId(Long id, Long customerId);

    Page<Invoice> findByCustomerId(Long customerId, Pageable pageable);

    List<Invoice> findBySubscriptionIdOrderByInvoiceDateDesc(Long subscriptionId);

    List<Invoice> findBySubscriptionIdAndCustomerIdOrderByInvoiceDateDesc(Long subscriptionId, Long customerId);

    boolean existsBySubscriptionIdAndPeriodStartAndStatusNot(Long subscriptionId, LocalDate periodStart, String status);

    @Query(value = "SELECT nextval('invoice_number_seq')", nativeQuery = true)
    Long getNextInvoiceSequence();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Invoice i WHERE i.id = :id")
    Optional<Invoice> findByIdWithLock(@Param("id") Long id);

    @Query("SELECT i FROM Invoice i WHERE i.status = 'CONFIRMED' AND i.dueDate < CURRENT_DATE")
    List<Invoice> findOverdueInvoices();
}
