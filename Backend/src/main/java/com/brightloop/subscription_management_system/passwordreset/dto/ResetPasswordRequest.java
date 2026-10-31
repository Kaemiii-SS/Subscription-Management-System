package com.brightloop.subscription_management_system.passwordreset.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(

        @NotBlank
        String token,

        @NotBlank
        @Size(min = 9, max = 72)
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z0-9]).+$",
                message = "Password must contain uppercase, lowercase, number and special character"
        )
        String newPassword

) {}