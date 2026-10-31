package com.brightloop.subscription_management_system.auth.controller;

import com.brightloop.subscription_management_system.auth.dto.AuthResponse;
import com.brightloop.subscription_management_system.auth.dto.LoginRequest;
import com.brightloop.subscription_management_system.auth.dto.RegisterRequest;
import com.brightloop.subscription_management_system.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/auth", "/api/v1/auth"})
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping({"/register", "/signup"})
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
}