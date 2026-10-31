package com.brightloop.subscription_management_system.catalog.controller;

import com.brightloop.subscription_management_system.catalog.dto.PlanRequest;
import com.brightloop.subscription_management_system.catalog.dto.PlanResponse;
import com.brightloop.subscription_management_system.catalog.service.PlanService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/plans")
public class PlanController {

    private final PlanService planService;

    public PlanController(PlanService planService) {
        this.planService = planService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PlanResponse createPlan(
            @Valid @RequestBody PlanRequest request
    ) {
        return planService.createPlan(request);
    }

    @GetMapping
    public Page<PlanResponse> getPlans(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String billingPeriod,
            @PageableDefault(size = 10, sort = "name") Pageable pageable
    ) {
        return planService.getPlans(search, billingPeriod, pageable);
    }

    @GetMapping("/{id}")
    public PlanResponse getPlan(@PathVariable Long id) {
        return planService.getPlan(id);
    }

    @PutMapping("/{id}")
    public PlanResponse updatePlan(
            @PathVariable Long id,
            @Valid @RequestBody PlanRequest request
    ) {
        return planService.updatePlan(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivatePlan(@PathVariable Long id) {
        planService.deactivatePlan(id);
    }
}