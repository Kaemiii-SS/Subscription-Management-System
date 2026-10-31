package com.brightloop.subscription_management_system.discount.dto;

import java.util.List;

public record DiscountPageResponse(
        List<DiscountResponse> items,
        int page,
        int size,
        long totalItems,
        int totalPages
) {
    public long getTotal() {
        return totalItems;
    }

    public List<DiscountResponse> getContent() {
        return items;
    }

    public long getTotalElements() {
        return totalItems;
    }
}