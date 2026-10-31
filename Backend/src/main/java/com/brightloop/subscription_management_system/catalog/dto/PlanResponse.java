package com.brightloop.subscription_management_system.catalog.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PlanResponse(

        Long id,
        String name,
        BigDecimal price,
        String billingPeriod,
        Integer minQuantity,
        LocalDate availableFrom,
        LocalDate availableTo,
        Boolean autoClose,
        Boolean closable,
        Boolean pausable,
        Boolean renewable,
        Boolean active

) {
    public Integer getMinSeats() {
        return minQuantity;
    }

    public Boolean getCanPause() {
        return pausable;
    }

    public Boolean getCanRenew() {
        return renewable;
    }

    public Boolean getCanCloseEarly() {
        return closable;
    }
}