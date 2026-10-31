
package com.brightloop.subscription_management_system.subscription.controller;

import com.brightloop.subscription_management_system.subscription.dto.SubscriptionCreateRequest;
import com.brightloop.subscription_management_system.subscription.dto.SubscriptionResponse;
import com.brightloop.subscription_management_system.subscription.entity.Subscription;
import com.brightloop.subscription_management_system.subscription.entity.SubscriptionStatusHistory;
import com.brightloop.subscription_management_system.subscription.service.SubscriptionLifecycleService;
import com.brightloop.subscription_management_system.subscription.service.SubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final SubscriptionLifecycleService lifecycleService;

    // CUSTOMER ENDPOINTS

    @PostMapping("/customer/subscriptions")
    @ResponseStatus(HttpStatus.CREATED)
    public SubscriptionResponse create(
            @Valid @RequestBody SubscriptionCreateRequest request
    ) {
        return subscriptionService.create(request);
    }

    @GetMapping("/customer/subscriptions")
    public Page<SubscriptionResponse> getMySubscriptions(
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable
    ) {
        return lifecycleService.getCustomerSubscriptions(pageable)
                .map(this::toResponse);
    }

    @GetMapping("/customer/subscriptions/{id}")
    public SubscriptionResponse getMySubscription(@PathVariable Long id) {
        return toResponse(lifecycleService.getCustomerSubscription(id));
    }

    // STAFF ENDPOINTS

    @GetMapping("/staff/subscriptions")
    public Page<SubscriptionResponse> getAll(
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable
    ) {
        return lifecycleService.getAllSubscriptions(pageable)
                .map(this::toResponse);
    }

    @GetMapping("/staff/subscriptions/{id}")
    public SubscriptionResponse getOne(@PathVariable Long id) {
        return toResponse(lifecycleService.getSubscriptionForStaff(id));
    }

    @PatchMapping("/staff/subscriptions/{id}/quote")
    public SubscriptionResponse quote(@PathVariable Long id) {
        return toResponse(lifecycleService.quote(id));
    }

    @PatchMapping("/staff/subscriptions/{id}/confirm")
    public SubscriptionResponse confirm(@PathVariable Long id) {
        return toResponse(lifecycleService.confirm(id));
    }

    @PatchMapping("/staff/subscriptions/{id}/activate")
    public SubscriptionResponse activate(@PathVariable Long id) {
        return toResponse(lifecycleService.activate(id));
    }

    @PatchMapping("/staff/subscriptions/{id}/pause")
    public SubscriptionResponse pause(@PathVariable Long id) {
        return toResponse(lifecycleService.pause(id));
    }

    @PatchMapping("/staff/subscriptions/{id}/resume")
    public SubscriptionResponse resume(@PathVariable Long id) {
        return toResponse(lifecycleService.resume(id));
    }

    @PatchMapping("/staff/subscriptions/{id}/close")
    public SubscriptionResponse close(@PathVariable Long id) {
        return toResponse(lifecycleService.close(id));
    }

    @PatchMapping("/staff/subscriptions/{id}/renew")
    public SubscriptionResponse renew(@PathVariable Long id) {
        return toResponse(lifecycleService.renew(id));
    }

    @GetMapping("/staff/subscriptions/{id}/activity")
    public List<SubscriptionStatusHistory> activity(@PathVariable Long id) {
        return lifecycleService.getActivity(id);
    }

    private SubscriptionResponse toResponse(Subscription subscription) {

        List<SubscriptionResponse.SubscriptionLineResponse> lines =
                subscription.getLines().stream()
                        .map(line ->
                                new SubscriptionResponse.SubscriptionLineResponse(
                                        line.getId(),
                                        line.getProduct().getId(),
                                        line.getProduct().getName(),
                                        line.getVariant() != null
                                                ? line.getVariant().getId()
                                                : null,
                                        line.getDescription(),
                                        line.getQuantity(),
                                        line.getUnitPrice(),
                                        line.getTaxPercent(),
                                        line.getLineSubtotal(),
                                        line.getTaxAmount(),
                                        line.getLineTotal()
                                ))
                        .toList();

        return new SubscriptionResponse(
                subscription.getId(),
                subscription.getNumber(),
                subscription.getCustomer().getId(),
                subscription.getCustomer().getName(),
                subscription.getPlan().getId(),
                subscription.getPlan().getName(),
                subscription.getTemplate() != null
                        ? subscription.getTemplate().getId()
                        : null,
                subscription.getStatus(),
                subscription.getStartDate(),
                subscription.getExpiryDate(),
                subscription.getPaymentTermsDays(),
                subscription.getQuoteValidUntil(),
                subscription.getNextBillingDate(),
                subscription.getSubtotal(),
                subscription.getTaxTotal(),
                subscription.getTotal(),
                lines
        );
    }
}
