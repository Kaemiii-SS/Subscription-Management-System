package com.brightloop.subscription_management_system.catalog.repository;

import com.brightloop.subscription_management_system.catalog.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductVariantRepository
        extends JpaRepository<ProductVariant, Long> {

    List<ProductVariant> findByProduct_IdAndActiveTrue(Long productId);

    Optional<ProductVariant> findByIdAndProduct_IdAndActiveTrue(
            Long variantId,
            Long productId
    );
}