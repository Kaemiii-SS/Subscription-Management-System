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

}