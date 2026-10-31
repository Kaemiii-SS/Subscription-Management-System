package com.brightloop.subscription_management_system.catalog.controller;

import com.brightloop.subscription_management_system.catalog.dto.ProductResponse;
import com.brightloop.subscription_management_system.catalog.dto.PlanResponse;
import com.brightloop.subscription_management_system.catalog.service.ProductService;
import com.brightloop.subscription_management_system.catalog.service.PlanService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/catalog")
public class CatalogReadController {

    private final ProductService productService;
    private final PlanService planService;

    public CatalogReadController(
            ProductService productService,
            PlanService planService
    ) {
        this.productService = productService;
        this.planService = planService;
    }

    @GetMapping("/products")
    public Page<ProductResponse> getProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type,
            @PageableDefault(size = 10, sort = "name") Pageable pageable
    ) {
        return productService.getProducts(search, type, pageable);
    }

    @GetMapping("/products/{id}")
    public ProductResponse getProduct(@PathVariable Long id) {
        return productService.getProduct(id);
    }

    @GetMapping("/plans")
    public Page<PlanResponse> getPlans(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String billingPeriod,
            @PageableDefault(size = 10, sort = "name") Pageable pageable
    ) {
        return planService.getPlans(search, billingPeriod, pageable);
    }

    @GetMapping("/plans/{id}")
    public PlanResponse getPlan(@PathVariable Long id) {
        return planService.getPlan(id);
    }
}