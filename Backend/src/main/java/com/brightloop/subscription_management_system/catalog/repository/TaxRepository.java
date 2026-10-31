package com.brightloop.subscription_management_system.catalog.repository;

import com.brightloop.subscription_management_system.catalog.entity.Tax;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TaxRepository extends JpaRepository<Tax, Long> {

    Optional<Tax> findByNameIgnoreCase(String name);

    Optional<Tax> findByIdAndActiveTrue(Long id);

    boolean existsByNameIgnoreCase(String name);

    Page<Tax> findByActiveTrue(Pageable pageable);
}