package com.brightloop.subscription_management_system.auth.dto;

public record CurrentUserResponse(
        Long id,
        String name,
        String email,
        String phone,
        String role
) {}