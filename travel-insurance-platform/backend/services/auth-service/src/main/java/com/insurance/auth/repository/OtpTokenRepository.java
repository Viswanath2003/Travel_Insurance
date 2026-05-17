package com.insurance.auth.repository;

import com.insurance.auth.entity.OtpToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpTokenRepository extends JpaRepository<OtpToken, String> {

    Optional<OtpToken> findTopByUserIdAndPurposeAndUsedFalseOrderByCreatedAtDesc(
            String userId, OtpToken.OtpPurpose purpose);

    @Modifying
    @Query("UPDATE OtpToken o SET o.used = true WHERE o.userId = :userId AND o.purpose = :purpose AND o.used = false")
    void invalidateAllForUserAndPurpose(String userId, OtpToken.OtpPurpose purpose);

    @Modifying
    @Query("DELETE FROM OtpToken o WHERE o.expiresAt < :cutoff")
    void deleteExpiredTokens(LocalDateTime cutoff);
}
