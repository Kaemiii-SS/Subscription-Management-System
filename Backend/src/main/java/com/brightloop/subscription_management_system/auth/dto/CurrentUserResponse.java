package com.brightloop.subscription_management_system.auth.dto;

public record CurrentUserResponse(
        Long id,
        String name,
        String email,
        String phone,
        String role,
        String companyName
) {
    public CurrentUserResponse(Long id, String name, String email, String phone, String role) {
        this(id, name, email, phone, role != null ? role.toLowerCase() : "customer", name);
    }
}