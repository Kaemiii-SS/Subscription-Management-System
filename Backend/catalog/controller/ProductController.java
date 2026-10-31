package com.brightloop.subscription_management_system.catalog.controller;

import com.brightloop.subscription_management_system.catalog.dto.*;
import com.brightloop.subscription_management_system.catalog.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse createProduct(
            @Valid @RequestBody ProductRequest request
    ) {
        return productService.createProduct(request);
    }

    @GetMapping
    public Page<ProductResponse> getProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type,
            @PageableDefault(size = 10, sort = "name") Pageable pageable
    ) {
        return productService.getProducts(search, type, pageable);
    }

    @GetMapping("/{id}")
    public ProductResponse getProduct(@PathVariable Long id) {
        return productService.getProduct(id);
    }

    @PutMapping("/{id}")
    public ProductResponse updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request
    ) {
        return productService.updateProduct(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateProduct(@PathVariable Long id) {
        productService.deactivateProduct(id);
    }

    @PostMapping("/{productId}/variants")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductVariantResponse addVariant(
            @PathVariable Long productId,
            @Valid @RequestBody ProductVariantRequest request
    ) {
        return productService.addVariant(productId, request);
    }

    @PutMapping("/{productId}/variants/{variantId}")
    public ProductVariantResponse updateVariant(
            @PathVariable Long productId,
            @PathVariable Long variantId,
            @Valid @RequestBody ProductVariantRequest request
    ) {
        return productService.updateVariant(productId, variantId, request);
    }

    @DeleteMapping("/{productId}/variants/{variantId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateVariant(
            @PathVariable Long productId,
            @PathVariable Long variantId
    ) {
        productService.deactivateVariant(productId, variantId);
    }
}