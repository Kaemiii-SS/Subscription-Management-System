package com.brightloop.subscription_management_system.auth.service;

import com.brightloop.subscription_management_system.auth.dto.*;
import com.brightloop.subscription_management_system.security.JwtService;
import com.brightloop.subscription_management_system.user.entity.User;
import com.brightloop.subscription_management_system.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    // CUSTOMER REGISTRATION
    @Transactional
    public void register(RegisterRequest request) {

        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = new User();

        user.setName(request.name());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setPhone(request.phone());
        user.setRole("CUSTOMER");
        user.setActive(true);

        userRepository.save(user);
    }

    // USER LOGIN
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {

        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() ->
                        new IllegalArgumentException("Invalid email or password")
                );

        if (!passwordEncoder.matches(
                request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        if (!user.getActive()) {
            throw new IllegalArgumentException("Account is disabled");
        }

        String token = jwtService.generateToken(user);

        return new AuthResponse(
                token,
                "Bearer",
                user.getId(),
                user.getEmail(),
                user.getRole()
        );
    }

    // ADMIN CREATES STAFF
    @Transactional
    public StaffResponse createStaff(CreateStaffRequest request) {

        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User staff = new User();

        staff.setName(request.name());
        staff.setEmail(request.email().trim().toLowerCase());
        staff.setPasswordHash(passwordEncoder.encode(request.password()));
        staff.setPhone(request.phone());
        staff.setRole("STAFF");
        staff.setActive(true);

        User savedStaff = userRepository.save(staff);

        return new StaffResponse(
                savedStaff.getId(),
                savedStaff.getName(),
                savedStaff.getEmail(),
                savedStaff.getRole()
        );
    }
}