package com.brightloop.subscription_management_system.catalog.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public record PlanRequest(

        @NotBlank
        @Size(max = 120)
        String name,

        @NotNull
        @DecimalMin("0.00")
        @Digits(integer = 12, fraction = 2)
        BigDecimal price,

        String billingPeriod,

        Integer minQuantity,

        Integer minSeats,

        LocalDate availableFrom,

        LocalDate availableTo,

        Boolean autoClose,

        Boolean closable,

        Boolean canCloseEarly,

        Boolean pausable,

        Boolean canPause,

        Boolean renewable,

        Boolean canRenew,

        Boolean autoInvoice

) {
    public String normalizedBillingPeriod() {
        if (billingPeriod == null || billingPeriod.isBlank()) return "MONTHLY";
        return billingPeriod.trim().toUpperCase();
    }

    public Integer effectiveMinQuantity() {
        if (minQuantity != null) return minQuantity;
        if (minSeats != null) return minSeats;
        return 1;
    }

    public LocalDate effectiveAvailableFrom() {
        if (availableFrom != null) return availableFrom;
        return LocalDate.now();
    }

    public Boolean effectiveAutoClose() {
        if (autoClose != null) return autoClose;
        return false;
    }

    public Boolean effectiveClosable() {
        if (closable != null) return closable;
        if (canCloseEarly != null) return canCloseEarly;
        return true;
    }

    public Boolean effectivePausable() {
        if (pausable != null) return pausable;
        if (canPause != null) return canPause;
        return true;
    }

    public Boolean effectiveRenewable() {
        if (renewable != null) return renewable;
        if (canRenew != null) return canRenew;
        return true;
    }
}