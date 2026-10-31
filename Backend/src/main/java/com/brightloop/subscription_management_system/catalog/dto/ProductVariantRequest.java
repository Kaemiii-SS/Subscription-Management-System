package com.brightloop.subscription_management_system.catalog.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProductVariantRequest(

        @NotBlank
        @Size(max = 60)
        String attribute,

        @NotBlank
        @Size(max = 60)
        String value,

        @NotNull
        @DecimalMin("0.00")
        @Digits(integer = 12, fraction = 2)
        BigDecimal extraPrice

) {}