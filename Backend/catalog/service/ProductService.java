package com.brightloop.subscription_management_system.catalog.service;

import com.brightloop.subscription_management_system.catalog.dto.*;
import com.brightloop.subscription_management_system.catalog.entity.*;
import com.brightloop.subscription_management_system.catalog.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final TaxRepository taxRepository;
    private final ProductVariantRepository variantRepository;

    public ProductService(
            ProductRepository productRepository,
            TaxRepository taxRepository,
            ProductVariantRepository variantRepository
    ) {
        this.productRepository = productRepository;
        this.taxRepository = taxRepository;
        this.variantRepository = variantRepository;
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {

        Product product = new Product();
        updateProductFields(product, request);

        product.setActive(true);

        return mapToResponse(productRepository.save(product));
    }

    @Transactional(readOnly = true)
    public ProductResponse getProduct(Long id) {

        Product product = productRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Product not found")
                );

        return mapToResponse(product);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getProducts(
            String search,
            String type,
            Pageable pageable
    ) {
        String searchFilter = (search == null || search.isBlank())
                ? null : search.trim();

        String typeFilter = (type == null || type.isBlank())
                ? null : type.trim();

        return productRepository.searchActiveProducts(
                        searchFilter,
                        typeFilter,
                        pageable
                )
                .map(this::mapToResponse);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {

        Product product = productRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Product not found")
                );

        updateProductFields(product, request);

        return mapToResponse(productRepository.save(product));
    }

    @Transactional
    public void deactivateProduct(Long id) {

        Product product = productRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Product not found")
                );

        product.setActive(false);
        productRepository.save(product);
    }

    @Transactional
    public ProductVariantResponse addVariant(
            Long productId,
            ProductVariantRequest request
    ) {

        Product product = productRepository.findByIdAndActiveTrue(productId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Product not found")
                );

        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);
        variant.setAttribute(request.attribute().trim());
        variant.setValue(request.value().trim());
        variant.setExtraPrice(request.extraPrice());
        variant.setActive(true);

        return mapVariantToResponse(variantRepository.save(variant));
    }

    @Transactional
    public ProductVariantResponse updateVariant(
            Long productId,
            Long variantId,
            ProductVariantRequest request
    ) {

        ProductVariant variant = variantRepository
                .findByIdAndProduct_IdAndActiveTrue(variantId, productId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Variant not found")
                );

        variant.setAttribute(request.attribute().trim());
        variant.setValue(request.value().trim());
        variant.setExtraPrice(request.extraPrice());

        return mapVariantToResponse(variantRepository.save(variant));
    }

    @Transactional
    public void deactivateVariant(Long productId, Long variantId) {

        ProductVariant variant = variantRepository
                .findByIdAndProduct_IdAndActiveTrue(variantId, productId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Variant not found")
                );

        variant.setActive(false);
        variantRepository.save(variant);
    }

    private void updateProductFields(Product product, ProductRequest request) {

        product.setName(request.name().trim());
        product.setType(request.type().trim());
        product.setSalesPrice(request.salesPrice());
        product.setCostPrice(request.costPrice());
        product.setNotes(request.notes());

        if (request.taxId() == null) {
            product.setTax(null);
        } else {
            Tax tax = taxRepository.findByIdAndActiveTrue(request.taxId())
                    .orElseThrow(() ->
                            new IllegalArgumentException("Active tax not found")
                    );

            product.setTax(tax);
        }
    }

    private ProductResponse mapToResponse(Product product) {

        Tax tax = product.getTax();

        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getType(),
                product.getSalesPrice(),
                product.getCostPrice(),
                tax != null ? tax.getId() : null,
                tax != null ? tax.getName() : null,
                tax != null ? tax.getPercent() : BigDecimal.ZERO,
                product.getNotes(),
                product.getActive(),
                product.getVariants()
                        .stream()
                        .filter(ProductVariant::getActive)
                        .map(this::mapVariantToResponse)
                        .toList()
        );
    }

    private ProductVariantResponse mapVariantToResponse(ProductVariant variant) {

        BigDecimal finalPrice = variant.getProduct()
                .getSalesPrice()
                .add(variant.getExtraPrice());

        return new ProductVariantResponse(
                variant.getId(),
                variant.getAttribute(),
                variant.getValue(),
                variant.getExtraPrice(),
                finalPrice,
                variant.getActive()
        );
    }
}