package com.brightloop.subscription_management_system.catalog.repository;

import com.brightloop.subscription_management_system.catalog.entity.Plan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PlanRepository extends JpaRepository<Plan, Long> {

    Optional<Plan> findByIdAndActiveTrue(Long id);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    @Query("""
            SELECT p FROM Plan p
            WHERE p.active = true
            AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')))
            AND (:period IS NULL OR p.billingPeriod = :period)
            """)
    Page<Plan> searchActivePlans(
            @Param("search") String search,
            @Param("period") String period,
            Pageable pageable
    );
}