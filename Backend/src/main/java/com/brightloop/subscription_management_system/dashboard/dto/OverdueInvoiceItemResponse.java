package com.brightloop.subscription_management_system.dashboard.dto;

import java.time.LocalDate;

public record OverdueInvoiceItemResponse(
        Long invoiceId,
        String number,
        String customerName,
        LocalDate dueDate,
        long daysLate,
        String total,
        String amountLeft
) {
    public Long getId() {
        return invoiceId;
    }

    public String getInvoiceNumber() {
        return number;
    }
}
