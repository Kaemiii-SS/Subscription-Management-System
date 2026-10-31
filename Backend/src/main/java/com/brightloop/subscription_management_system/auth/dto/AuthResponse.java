package com.brightloop.subscription_management_system.auth.dto;

public record AuthResponse(
        String token,
        String tokenType,
        Long userId,
        String email,
        String role,
        UserSummary user
) {
    public record UserSummary(
            Long id,
            String name,
            String email,
            String role,
            String companyName
    ) {}

    public AuthResponse(String token, String tokenType, Long userId, String email, String role) {
        this(
                token,
                tokenType,
                userId,
                email,
                role != null ? role.toLowerCase() : "customer",
                new UserSummary(
                        userId,
                        email != null && email.contains("@") ? email.substring(0, email.indexOf('@')) : "User",
                        email,
                        role != null ? role.toLowerCase() : "customer",
                        null
                )
        );
    }
}