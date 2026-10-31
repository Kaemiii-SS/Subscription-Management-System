package com.brightloop.subscription_management_system.discount.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum DiscountType {
    FIXED,
    PERCENT;

    @JsonCreator
    public static DiscountType from(String value) {
        if (value == null) return PERCENT;
        if (value.equalsIgnoreCase("percent") || value.equalsIgnoreCase("percentage")) return PERCENT;
        if (value.equalsIgnoreCase("fixed")) return FIXED;
        return DiscountType.valueOf(value.toUpperCase());
    }

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }
}