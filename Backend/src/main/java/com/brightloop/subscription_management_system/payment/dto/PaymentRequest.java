package com.brightloop.subscription_management_system.payment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentRequest(
        @NotBlank(message = "Payment method is required")
        String method,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        BigDecimal amount,

        LocalDate paymentDate,

        LocalDate date,

        String reference,

        String note
) {
    public PaymentRequest(String method, BigDecimal amount, LocalDate paymentDate, String note) {
        this(method, amount, paymentDate, paymentDate, null, note);
    }

    public LocalDate effectivePaymentDate() {
        if (paymentDate != null) return paymentDate;
        if (date != null) return date;
        return LocalDate.now();
    }

    public String normalizedMethod() {
        if (method == null) return "OTHER";
        String m = method.trim().toUpperCase().replace(" ", "_");
        if (m.contains("BANK")) return "BANK_TRANSFER";
        if (m.contains("CARD")) return "CARD";
        if (m.contains("UPI") || m.contains("QR")) return "UPI";
        if (m.contains("CASH")) return "CASH";
        if (m.contains("CHEQUE")) return "CHEQUE";
        return "OTHER";
    }
}
