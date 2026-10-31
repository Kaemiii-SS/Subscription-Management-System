package com.brightloop.subscription_management_system.auth.service;

import com.brightloop.subscription_management_system.auth.dto.CurrentUserResponse;
import com.brightloop.subscription_management_system.user.entity.User;
import com.brightloop.subscription_management_system.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public User getCurrentUserEntity() {
        return getCurrentUserEntityOptional()
                .orElseThrow(() ->
                        new IllegalStateException("User is not authenticated or account disabled")
                );
    }

    @Transactional(readOnly = true)
    public java.util.Optional<User> getCurrentUserEntityOptional() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return java.util.Optional.empty();
        }

        String email = authentication.getName();
        return userRepository.findByEmailIgnoreCase(email)
                .filter(User::getActive);
    }

    @Transactional(readOnly = true)
    public CurrentUserResponse getCurrentUser() {

        User user = getCurrentUserEntity();

        return new CurrentUserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole() != null ? user.getRole().toLowerCase() : "customer",
                user.getName()
        );
    }
}