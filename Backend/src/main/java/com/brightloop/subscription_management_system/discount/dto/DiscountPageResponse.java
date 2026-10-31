package com.brightloop.subscription_management_system.discount.dto;

import java.util.List;

public record DiscountPageResponse(
        List<DiscountResponse> items,
        int page,
        int size,
        long totalItems,
        int totalPages
) {
}