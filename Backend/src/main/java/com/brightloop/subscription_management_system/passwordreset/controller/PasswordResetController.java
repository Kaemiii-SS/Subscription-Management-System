package com.brightloop.subscription_management_system.passwordreset.controller;

import com.brightloop.subscription_management_system.passwordreset.dto.ForgotPasswordRequest;
import com.brightloop.subscription_management_system.passwordreset.dto.ResetPasswordRequest;
import com.brightloop.subscription_management_system.passwordreset.service.PasswordResetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    public PasswordResetController(
            PasswordResetService passwordResetService
    ) {
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/forgot-password")
    public String forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {
        passwordResetService.forgotPassword(request);

        return "If the account exists, a password reset link has been sent.";
    }

    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.OK)
    public String resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        passwordResetService.resetPassword(request);

        return "Password reset successful.";
    }
}