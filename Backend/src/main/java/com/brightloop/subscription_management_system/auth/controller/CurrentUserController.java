package com.brightloop.subscription_management_system.auth.controller;

import com.brightloop.subscription_management_system.auth.dto.CurrentUserResponse;
import com.brightloop.subscription_management_system.auth.service.CurrentUserService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class CurrentUserController {

    private final CurrentUserService currentUserService;

    public CurrentUserController(CurrentUserService currentUserService) {
        this.currentUserService = currentUserService;
    }

    @GetMapping("/me")
    public CurrentUserResponse getCurrentUser() {
        return currentUserService.getCurrentUser();
    }
}