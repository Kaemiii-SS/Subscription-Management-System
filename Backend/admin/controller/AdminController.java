package com.brightloop.subscription_management_system.admin.controller;

import com.brightloop.subscription_management_system.auth.dto.CreateStaffRequest;
import com.brightloop.subscription_management_system.auth.dto.StaffResponse;
import com.brightloop.subscription_management_system.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AuthService authService;

    public AdminController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/staff")
    @ResponseStatus(HttpStatus.CREATED)
    public StaffResponse createStaff(
            @Valid @RequestBody CreateStaffRequest request
    ) {
        return authService.createStaff(request);
    }
}