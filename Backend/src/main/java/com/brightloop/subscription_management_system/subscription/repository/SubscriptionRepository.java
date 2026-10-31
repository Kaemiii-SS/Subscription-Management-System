package com.brightloop.subscription_management_system.subscription.repository;

import com.brightloop.subscription_management_system.subscription.entity.Subscription;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface SubscriptionRepository
        extends JpaRepository<Subscription, Long>,
        JpaSpecificationExecutor<Subscription> {

    Optional<Subscription> findByNumber(String number);

    boolean existsByNumber(String number);

    @Query(value = "SELECT nextval('subscription_number_seq')",
            nativeQuery = true)
    Long getNextSubscriptionSequence();


    Optional<Subscription> findByIdAndCustomerId(Long id, Long customerId);

    Page<Subscription> findByCustomerId(Long customerId, Pageable pageable);

    @Query("SELECT s FROM Subscription s WHERE s.status = 'ACTIVE' AND s.nextBillingDate <= :maxDate ORDER BY s.nextBillingDate ASC")
    java.util.List<Subscription> findDueForBilling(@org.springframework.data.repository.query.Param("maxDate") java.time.LocalDate maxDate);

    @Query("SELECT s FROM Subscription s JOIN s.plan p WHERE p.autoClose = true AND s.status IN ('ACTIVE', 'PAUSED') AND s.expiryDate < :date")
    java.util.List<Subscription> findDueForAutoClose(@org.springframework.data.repository.query.Param("date") java.time.LocalDate date);

    long countByStatus(String status);

}