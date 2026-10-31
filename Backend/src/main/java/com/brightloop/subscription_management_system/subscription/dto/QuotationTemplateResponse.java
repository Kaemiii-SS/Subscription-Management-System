package com.brightloop.subscription_management_system.subscription.dto;

import java.time.OffsetDateTime;
import java.util.List;

public record QuotationTemplateResponse(

        Long id,
        String name,
        Integer validityDays,
        Long planId,
        String planName,
        Boolean active,
        List<TemplateLineResponse> lines,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt

) {
    public record TemplateLineResponse(
            Long id,
            Long productId,
            String productName,
            Long variantId,
            Integer quantity
    ) {}
}