package com.brightloop.subscription_management_system.admin.controller;

import com.brightloop.subscription_management_system.auth.dto.CreateStaffRequest;
import com.brightloop.subscription_management_system.auth.dto.StaffResponse;
import com.brightloop.subscription_management_system.auth.service.AuthService;
import com.brightloop.subscription_management_system.user.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/admin/staff", "/api/staff"})
public class AdminController {

    private final AuthService authService;
    private final UserRepository userRepository;

    public AdminController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<StaffResponse> getStaff() {
        return userRepository.findAll().stream()
                .filter(u -> "STAFF".equalsIgnoreCase(u.getRole()) || "ADMIN".equalsIgnoreCase(u.getRole()))
                .map(u -> new StaffResponse(
                        u.getId(),
                        u.getName(),
                        u.getEmail(),
                        u.getRole().toLowerCase(),
                        "Operations",
                        u.getActive() ? "Active" : "Inactive"
                ))
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StaffResponse createStaff(
            @Valid @RequestBody CreateStaffRequest request
    ) {
        return authService.createStaff(request);
    }
}