package com.brightloop.subscription_management_system.subscription.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;

public record SubscriptionCreateRequest(

        @NotNull
        @Positive
        Long templateId,

        @NotNull
        LocalDate startDate,

        @NotNull
        @Min(0)
        Integer paymentTermsDays

) {}