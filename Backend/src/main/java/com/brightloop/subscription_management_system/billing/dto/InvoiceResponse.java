package com.brightloop.subscription_management_system.billing.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDate;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record InvoiceResponse(
        Long id,
        String number,
        String status,
        SubscriptionRef subscription,
        CustomerRef customer,
        LocalDate periodStart,
        LocalDate periodEnd,
        LocalDate invoiceDate,
        LocalDate dueDate,
        boolean overdue,
        List<InvoiceLineResponse> lines,
        DiscountRef discount,
        String subtotal,
        String taxTotal,
        String discountTotal,
        String total,
        String paidAmount,
        String amountLeft,
        List<String> allowedActions,
        List<PaymentSummaryResponse> payments
) {
    public String getInvoiceNumber() {
        return number;
    }

    public String getCustomerName() {
        return customer != null ? customer.name() : null;
    }

    public String getCustomerEmail() {
        return customer != null ? customer.email() : null;
    }

    public Long getCustomerId() {
        return customer != null ? customer.id() : null;
    }

    public String getSubscriptionNumber() {
        return subscription != null ? subscription.number() : null;
    }

    public Long getSubscriptionId() {
        return subscription != null ? subscription.id() : null;
    }

    public List<PaymentSummaryResponse> getPaymentHistory() {
        return payments;
    }

    public record SubscriptionRef(Long id, String number) {}
    public record CustomerRef(Long id, String name, String email) {}
    public record DiscountRef(Long id, String name, String amount) {}

    public record InvoiceLineResponse(
            Long id,
            String description,
            Integer quantity,
            String unitPrice,
            String taxPercent,
            String amount
    ) {}

    public record PaymentSummaryResponse(
            Long id,
            String method,
            String amount,
            LocalDate paymentDate,
            String note
    ) {}
}
