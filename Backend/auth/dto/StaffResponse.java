package com.brightloop.subscription_management_system.auth.dto;

public record StaffResponse(
        Long id,
        String name,
        String email,
        String role
) {}