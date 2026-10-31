package com.brightloop.subscription_management_system.discount.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum DiscountAppliesTo {
    PRODUCT,
    SUBSCRIPTION;

    @JsonCreator
    public static DiscountAppliesTo from(String value) {
        if (value == null) return SUBSCRIPTION;
        if (value.equalsIgnoreCase("total") || value.equalsIgnoreCase("subscription")) return SUBSCRIPTION;
        if (value.equalsIgnoreCase("product")) return PRODUCT;
        return DiscountAppliesTo.valueOf(value.toUpperCase());
    }

    @JsonValue
    public String toValue() {
        return this == SUBSCRIPTION ? "total" : "product";
    }
}