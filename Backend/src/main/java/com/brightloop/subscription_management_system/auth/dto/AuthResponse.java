package com.brightloop.subscription_management_system.auth.dto;

public record AuthResponse(
        String token,
        String tokenType,
        Long userId,
        String email,
        String role
) {}