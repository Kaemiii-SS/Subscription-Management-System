package com.brightloop.subscription_management_system.subscription.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record QuotationTemplateRequest(

        @NotBlank
        @Size(max = 160)
        String name,

        @NotNull
        @Positive
        Integer validityDays,

        @NotNull
        Long planId,

        @NotNull
        @Size(min = 1)
        List<@Valid TemplateLineRequest> lines

) {
    public record TemplateLineRequest(

            @NotNull
            Long productId,

            Long variantId,

            @NotNull
            @Positive
            Integer quantity

    ) {}
}