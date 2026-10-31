package com.brightloop.subscription_management_system.catalog.service;

import com.brightloop.subscription_management_system.catalog.dto.PlanRequest;
import com.brightloop.subscription_management_system.catalog.dto.PlanResponse;
import com.brightloop.subscription_management_system.catalog.entity.Plan;
import com.brightloop.subscription_management_system.catalog.repository.PlanRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlanService {

    private final PlanRepository planRepository;

    public PlanService(PlanRepository planRepository) {
        this.planRepository = planRepository;
    }

    @Transactional
    public PlanResponse createPlan(PlanRequest request) {

        validateDates(request);

        if (planRepository.existsByNameIgnoreCase(request.name().trim())) {
            throw new IllegalArgumentException("Plan name already exists");
        }

        Plan plan = new Plan();
        updatePlanFields(plan, request);
        plan.setActive(true);

        return mapToResponse(planRepository.save(plan));
    }

    @Transactional(readOnly = true)
    public PlanResponse getPlan(Long id) {

        Plan plan = planRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Plan not found")
                );

        return mapToResponse(plan);
    }

    @Transactional(readOnly = true)
    public Page<PlanResponse> getPlans(
            String search,
            String billingPeriod,
            Pageable pageable
    ) {
        String searchFilter = (search == null || search.isBlank())
                ? null : search.trim();

        String periodFilter = (billingPeriod == null || billingPeriod.isBlank())
                ? null : billingPeriod.trim().toUpperCase();

        if (searchFilter == null && periodFilter == null) {
            return planRepository.findByActiveTrue(pageable).map(this::mapToResponse);
        }

        return planRepository.searchActivePlans(
                        searchFilter,
                        periodFilter,
                        pageable
                )
                .map(this::mapToResponse);
    }

    @Transactional
    public PlanResponse updatePlan(Long id, PlanRequest request) {

        validateDates(request);

        Plan plan = planRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Plan not found")
                );

        if (planRepository.existsByNameIgnoreCaseAndIdNot(
                request.name().trim(), id)) {
            throw new IllegalArgumentException("Plan name already exists");
        }

        updatePlanFields(plan, request);

        return mapToResponse(planRepository.save(plan));
    }

    @Transactional
    public void deactivatePlan(Long id) {

        Plan plan = planRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Plan not found")
                );

        plan.setActive(false);
        planRepository.save(plan);
    }

    private void validateDates(PlanRequest request) {

        if (request.availableTo() != null &&
                request.availableTo().isBefore(request.effectiveAvailableFrom())) {
            throw new IllegalArgumentException(
                    "Available-to date cannot be before available-from date"
            );
        }
    }

    private void updatePlanFields(Plan plan, PlanRequest request) {

        plan.setName(request.name().trim());
        plan.setPrice(request.price());
        plan.setBillingPeriod(request.normalizedBillingPeriod());
        plan.setMinQuantity(request.effectiveMinQuantity());
        plan.setAvailableFrom(request.effectiveAvailableFrom());
        plan.setAvailableTo(request.availableTo());
        plan.setAutoClose(request.effectiveAutoClose());
        plan.setClosable(request.effectiveClosable());
        plan.setPausable(request.effectivePausable());
        plan.setRenewable(request.effectiveRenewable());
    }

    private PlanResponse mapToResponse(Plan plan) {

        return new PlanResponse(
                plan.getId(),
                plan.getName(),
                plan.getPrice(),
                plan.getBillingPeriod(),
                plan.getMinQuantity(),
                plan.getAvailableFrom(),
                plan.getAvailableTo(),
                plan.getAutoClose(),
                plan.getClosable(),
                plan.getPausable(),
                plan.getRenewable(),
                plan.getActive()
        );
    }
}