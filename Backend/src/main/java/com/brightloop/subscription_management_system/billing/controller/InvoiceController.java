package com.brightloop.subscription_management_system.billing.controller;

import com.brightloop.subscription_management_system.billing.dto.InvoiceResponse;
import com.brightloop.subscription_management_system.billing.service.InvoiceService;
import com.brightloop.subscription_management_system.common.dto.PageResponse;
import com.brightloop.subscription_management_system.payment.dto.PaymentResponse;
import com.brightloop.subscription_management_system.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping({"/api/v1/invoices", "/api/invoices"})
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final PaymentService paymentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    public PageResponse<InvoiceResponse> listInvoices(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean overdue,
            @RequestParam(required = false) Boolean outstanding,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long subscriptionId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return invoiceService.listInvoices(status, overdue, outstanding, customerId, subscriptionId, from, to, search, pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    public InvoiceResponse getInvoice(@PathVariable Long id) {
        return invoiceService.getById(id);
    }

    public record InvoiceStatusUpdateRequest(String status) {}

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public InvoiceResponse updateStatus(
            @PathVariable Long id,
            @RequestBody InvoiceStatusUpdateRequest request
    ) {
        String s = request.status();
        if (s == null) return invoiceService.getById(id);
        return switch (s.toUpperCase()) {
            case "CONFIRMED" -> invoiceService.confirm(id);
            case "CANCELLED" -> invoiceService.cancel(id);
            case "SENT" -> invoiceService.send(id);
            default -> invoiceService.getById(id);
        };
    }

    @PostMapping("/{id}/actions/{action}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public InvoiceResponse performAction(
            @PathVariable Long id,
            @PathVariable String action
    ) {
        return switch (action.toLowerCase()) {
            case "confirm" -> invoiceService.confirm(id);
            case "cancel" -> invoiceService.cancel(id);
            case "send" -> invoiceService.send(id);
            default -> throw new IllegalArgumentException("Unknown invoice action: " + action + ". Allowed: confirm, cancel, send");
        };
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long id) {
        InvoiceResponse invoice = invoiceService.getById(id);
        byte[] pdfBytes = invoiceService.getPdf(id);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + invoice.number() + ".pdf\"")
                .body(pdfBytes);
    }

    @GetMapping("/{id}/payments")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    public List<PaymentResponse> getInvoicePayments(@PathVariable Long id) {
        return paymentService.getPaymentsForInvoice(id);
    }
}
