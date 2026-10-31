package com.brightloop.subscription_management_system.catalog.repository;

import com.brightloop.subscription_management_system.catalog.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    // Existing methods used by ProductService
    Optional<Product> findByIdAndActiveTrue(Long id);

    boolean existsByNameIgnoreCase(String name);

    // Search and filter products
    @Query("""
            SELECT p FROM Product p
            WHERE p.active = true
            AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')))
            AND (:type IS NULL OR LOWER(p.type) = LOWER(:type))
            """)
    Page<Product> searchActiveProducts(
            @Param("search") String search,
            @Param("type") String type,
            Pageable pageable
    );
}