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

        @NotBlank
        @Pattern(regexp = "DAILY|WEEKLY|MONTHLY|YEARLY")
        String billingPeriod,

        @NotNull
        @Min(1)
        Integer minQuantity,

        @NotNull
        LocalDate availableFrom,

        LocalDate availableTo,

        @NotNull
        Boolean autoClose,

        @NotNull
        Boolean closable,

        @NotNull
        Boolean pausable,

        @NotNull
        Boolean renewable

) {}