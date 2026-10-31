package com.brightloop.subscription_management_system.auth.dto;

public record StaffResponse(
        Long id,
        String name,
        String email,
        String role,
        String department,
        String status
) {
    public StaffResponse(Long id, String name, String email, String role) {
        this(id, name, email, role != null ? role.toLowerCase() : "staff", "Operations", "Active");
    }
}