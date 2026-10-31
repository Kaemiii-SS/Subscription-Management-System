package com.brightloop.subscription_management_system.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateStaffRequest(

        @NotBlank
        @Size(max = 120)
        String name,

        @NotBlank
        @Email
        @Size(max = 255)
        String email,

        String password,

        @Size(max = 20)
        String phone,

        String department

) {
    public String effectivePassword() {
        if (password != null && !password.isBlank()) return password;
        return "Password123!";
    }
}