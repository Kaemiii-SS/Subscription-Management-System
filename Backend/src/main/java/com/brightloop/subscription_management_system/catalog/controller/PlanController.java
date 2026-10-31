package com.brightloop.subscription_management_system.catalog.controller;

import com.brightloop.subscription_management_system.catalog.dto.PlanRequest;
import com.brightloop.subscription_management_system.catalog.dto.PlanResponse;
import com.brightloop.subscription_management_system.catalog.service.PlanService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import com.brightloop.subscription_management_system.common.dto.PageResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/admin/plans", "/api/v1/plans", "/api/plans"})
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
    public PageResponse<PlanResponse> getPlans(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String billingPeriod,
            @RequestParam(required = false) String period,
            @PageableDefault(size = 10, sort = "name") Pageable pageable
    ) {
        String effectivePeriod = billingPeriod != null ? billingPeriod : period;
        return PageResponse.of(planService.getPlans(search, effectivePeriod, pageable));
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