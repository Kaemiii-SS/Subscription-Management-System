package com.brightloop.subscription_management_system.payment.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDate;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PaymentResponse(
        Long id,
        Long invoiceId,
        String method,
        String amount,
        LocalDate paymentDate,
        String note,
        String recordedBy,
        InvoiceSummary invoice,
        String invoiceNumber,
        String customerName,
        Long customerId,
        String paymentNumber,
        LocalDate date,
        String reference
) {
    public PaymentResponse(
            Long id,
            Long invoiceId,
            String method,
            String amount,
            LocalDate paymentDate,
            String note,
            String recordedBy,
            InvoiceSummary invoice
    ) {
        this(
                id,
                invoiceId,
                method,
                amount,
                paymentDate,
                note,
                recordedBy,
                invoice,
                null,
                null,
                null,
                String.format("PAY-2026-%03d", id),
                paymentDate,
                "REF-" + id
        );
    }

    public String getPaymentNumber() {
        return paymentNumber != null ? paymentNumber : String.format("PAY-2026-%03d", id);
    }

    public LocalDate getDate() {
        return date != null ? date : paymentDate;
    }

    public record InvoiceSummary(
            String status,
            String paidAmount,
            String amountLeft
    ) {}
}
