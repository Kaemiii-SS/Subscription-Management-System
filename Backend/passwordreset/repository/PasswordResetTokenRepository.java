package com.brightloop.subscription_management_system.passwordreset.repository;

import com.brightloop.subscription_management_system.passwordreset.entity.PasswordResetToken;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PasswordResetTokenRepository
        extends JpaRepository<PasswordResetToken, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM PasswordResetToken t WHERE t.tokenHash = :hash")
    Optional<PasswordResetToken> findByTokenHashForUpdate(
            @Param("hash") String hash
    );

    void deleteByUser_IdAndUsedAtIsNull(Long userId);
}