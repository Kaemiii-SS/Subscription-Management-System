
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
    private final com.brightloop.subscription_management_system.billing.service.InvoiceService invoiceService;
    private final com.brightloop.subscription_management_system.auth.service.CurrentUserService currentUserService;

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    @GetMapping({"/subscriptions", "/v1/subscriptions"})
    public com.brightloop.subscription_management_system.common.dto.PageResponse<SubscriptionResponse> getSubscriptionsUnified(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long planId,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable
    ) {
        var userOpt = currentUserService.getCurrentUserEntityOptional();
        Page<Subscription> page;
        if (userOpt.isPresent() && "CUSTOMER".equalsIgnoreCase(userOpt.get().getRole())) {
            page = lifecycleService.getCustomerSubscriptions(pageable);
        } else {
            page = lifecycleService.getAllSubscriptions(pageable);
        }
        return com.brightloop.subscription_management_system.common.dto.PageResponse.of(page, this::toResponse);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    @GetMapping({"/subscriptions/{id}", "/v1/subscriptions/{id}"})
    public SubscriptionResponse getSubscriptionUnified(@PathVariable Long id) {
        var userOpt = currentUserService.getCurrentUserEntityOptional();
        if (userOpt.isPresent() && "CUSTOMER".equalsIgnoreCase(userOpt.get().getRole())) {
            return toResponse(lifecycleService.getCustomerSubscription(id));
        }
        return toResponse(lifecycleService.getSubscriptionForStaff(id));
    }

    @PostMapping({"/subscriptions", "/v1/subscriptions"})
    @ResponseStatus(HttpStatus.CREATED)
    public SubscriptionResponse createSubscriptionUnified(
            @Valid @RequestBody SubscriptionCreateRequest request
    ) {
        return subscriptionService.create(request);
    }

    public record SubscriptionStatusUpdateRequest(String status, String reason) {}

    @PatchMapping({"/subscriptions/{id}/status", "/v1/subscriptions/{id}/status"})
    public SubscriptionResponse updateSubscriptionStatusUnified(
            @PathVariable Long id,
            @RequestBody SubscriptionStatusUpdateRequest request
    ) {
        String s = request.status();
        if (s == null) return toResponse(lifecycleService.getSubscriptionForStaff(id));
        Subscription sub = switch (s.toUpperCase()) {
            case "QUOTATION", "QUOTE" -> lifecycleService.quote(id);
            case "CONFIRMED" -> lifecycleService.confirm(id);
            case "ACTIVE" -> {
                Subscription activeSub = lifecycleService.activate(id);
                try {
                    java.time.LocalDate start = activeSub.getStartDate() != null ? activeSub.getStartDate() : java.time.LocalDate.now();
                    java.time.LocalDate end = activeSub.getExpiryDate() != null ? activeSub.getExpiryDate() : start.plusMonths(1);
                    invoiceService.generateFor(activeSub, start, end, java.time.LocalDate.now());
                } catch (Exception ignored) {
                }
                yield activeSub;
            }
            case "PAUSED" -> lifecycleService.pause(id);
            case "CLOSED" -> lifecycleService.close(id);
            case "RENEW", "RENEWED" -> lifecycleService.renew(id);
            default -> lifecycleService.getSubscriptionForStaff(id);
        };
        return toResponse(sub);
    }

    public record ActivityItem(String date, String user, String action, String note) {}

    @GetMapping({"/subscriptions/{id}/activity", "/v1/subscriptions/{id}/activity"})
    public List<ActivityItem> getSubscriptionActivityUnified(@PathVariable Long id) {
        List<SubscriptionStatusHistory> history = lifecycleService.getActivity(id);
        return history.stream()
                .map(h -> new ActivityItem(
                        h.getCreatedAt() != null ? h.getCreatedAt().toString().replace("T", " ").substring(0, 16) : "",
                        h.getChangedBy() != null ? h.getChangedBy().getName() : "System",
                        "Status transitioned from " + (h.getFromStatus() != null ? h.getFromStatus() : "None") + " to " + h.getToStatus() + (h.getNote() != null ? " (" + h.getNote() + ")" : ""),
                        h.getNote()
                ))
                .toList();
    }

    @GetMapping({"/customer/subscriptions/{id}/invoices", "/staff/subscriptions/{id}/invoices", "/v1/subscriptions/{id}/invoices", "/subscriptions/{id}/invoices"})
    public List<com.brightloop.subscription_management_system.billing.dto.InvoiceResponse> getSubscriptionInvoices(@PathVariable Long id) {
        return invoiceService.getInvoicesForSubscription(id);
    }

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
