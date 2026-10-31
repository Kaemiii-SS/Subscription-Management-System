package com.brightloop.subscription_management_system.passwordreset.service;

import com.brightloop.subscription_management_system.passwordreset.dto.ForgotPasswordRequest;
import com.brightloop.subscription_management_system.passwordreset.dto.ResetPasswordRequest;
import com.brightloop.subscription_management_system.passwordreset.entity.PasswordResetToken;
import com.brightloop.subscription_management_system.passwordreset.repository.PasswordResetTokenRepository;
import com.brightloop.subscription_management_system.user.entity.User;
import com.brightloop.subscription_management_system.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.Base64;

@Service
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    @Value("${app.password-reset.url}")
    private String resetUrl;

    @Value("${spring.mail.username}")
    private String senderEmail;

    private final SecureRandom secureRandom = new SecureRandom();

    public PasswordResetService(
            UserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            PasswordEncoder passwordEncoder,
            JavaMailSender mailSender
    ) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSender = mailSender;
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {

        userRepository.findByEmailIgnoreCase(request.email())
                .filter(User::getActive)
                .ifPresent(user -> {

                    // Invalidate previous unused reset tokens
                    tokenRepository.deleteByUser_IdAndUsedAtIsNull(user.getId());

                    // Generate a cryptographically secure token
                    byte[] randomBytes = new byte[32];
                    secureRandom.nextBytes(randomBytes);

                    String rawToken = Base64.getUrlEncoder()
                            .withoutPadding()
                            .encodeToString(randomBytes);

                    // Store only its SHA-256 hash
                    PasswordResetToken resetToken = new PasswordResetToken();
                    resetToken.setUser(user);
                    resetToken.setTokenHash(hashToken(rawToken));
                    resetToken.setExpiresAt(
                            OffsetDateTime.now().plusMinutes(15)
                    );

                    tokenRepository.save(resetToken);

                    // Email the original token, never its hash
                    sendResetEmail(user.getEmail(), rawToken);
                });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {

        String tokenHash = hashToken(request.token());

        PasswordResetToken resetToken = tokenRepository
                .findByTokenHashForUpdate(tokenHash)
                .orElseThrow(() ->
                        new IllegalArgumentException("Invalid or expired reset token")
                );

        if (resetToken.getUsedAt() != null ||
                resetToken.getExpiresAt().isBefore(OffsetDateTime.now())) {

            throw new IllegalArgumentException(
                    "Invalid or expired reset token"
            );
        }

        User user = resetToken.getUser();

        if (!user.getActive()) {
            throw new IllegalArgumentException("Account is disabled");
        }

        user.setPasswordHash(
                passwordEncoder.encode(request.newPassword())
        );

        resetToken.setUsedAt(OffsetDateTime.now());

        userRepository.save(user);
        tokenRepository.save(resetToken);
    }

    private String hashToken(String token) {

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            byte[] hash = digest.digest(
                    token.getBytes(StandardCharsets.UTF_8)
            );

            return HexFormat.of().formatHex(hash);

        } catch (Exception ex) {
            throw new IllegalStateException("Could not hash reset token", ex);
        }
    }

    private void sendResetEmail(String email, String token) {

        String link = resetUrl + "?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(senderEmail);
        message.setTo(email);
        message.setSubject("Brightloop - Password Reset");
        message.setText(
                "We received a request to reset your password.\n\n" +
                        "Use the following link to reset it:\n" +
                        link + "\n\n" +
                        "This link expires in 15 minutes and can only be used once.\n\n" +
                        "If you did not request this, ignore this email."
        );

        mailSender.send(message);
    }
}