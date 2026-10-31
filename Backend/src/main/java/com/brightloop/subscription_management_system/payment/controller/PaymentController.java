package com.brightloop.subscription_management_system.payment.controller;

import com.brightloop.subscription_management_system.common.dto.PageResponse;
import com.brightloop.subscription_management_system.payment.dto.PaymentRequest;
import com.brightloop.subscription_management_system.payment.dto.PaymentResponse;
import com.brightloop.subscription_management_system.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping({"/api/v1/invoices/{id}/payments", "/api/invoices/{id}/payments"})
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public PaymentResponse recordPayment(
            @PathVariable Long id,
            @Valid @RequestBody PaymentRequest request
    ) {
        return paymentService.recordPayment(id, request);
    }

    @GetMapping({"/api/v1/payments", "/api/payments"})
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    public PageResponse<PaymentResponse> listPayments(
            @RequestParam(required = false) String method,
            @RequestParam(required = false) Long invoiceId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return paymentService.listPayments(method, invoiceId, from, to, pageable);
    }

    @GetMapping({"/api/v1/payments/{id}", "/api/payments/{id}"})
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    public PaymentResponse getPayment(@PathVariable Long id) {
        return paymentService.getPayment(id);
    }
}
