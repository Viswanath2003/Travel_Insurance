package com.insurance.auth.service.impl;

import com.insurance.auth.entity.OtpToken;
import com.insurance.auth.repository.OtpTokenRepository;
import com.insurance.auth.service.OtpService;
import com.insurance.common.util.ReferenceNumberGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpServiceImpl implements OtpService {

    private final OtpTokenRepository otpTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    @Value("${app.otp.expiry-minutes:10}")
    private int otpExpiryMinutes;

    @Value("${spring.mail.from:noreply@travelsure.com}")
    private String fromEmail;

    @Override
    @Transactional
    public void generateAndSendOtp(String userId, String email, OtpToken.OtpPurpose purpose) {
        otpTokenRepository.invalidateAllForUserAndPurpose(userId, purpose);

        String rawOtp = ReferenceNumberGenerator.generateOtp();

        OtpToken token = new OtpToken();
        token.setUserId(userId);
        token.setOtpHash(passwordEncoder.encode(rawOtp));
        token.setPurpose(purpose);
        token.setExpiresAt(LocalDateTime.now().plusMinutes(otpExpiryMinutes));
        otpTokenRepository.save(token);

        sendOtpEmail(email, rawOtp, purpose);
    }

    @Override
    @Transactional
    public boolean verifyOtp(String userId, String rawOtp, OtpToken.OtpPurpose purpose) {
        return otpTokenRepository
                .findTopByUserIdAndPurposeAndUsedFalseOrderByCreatedAtDesc(userId, purpose)
                .map(token -> {
                    if (token.isExpired()) {
                        log.debug("OTP expired for user {}", userId);
                        return false;
                    }
                    token.setAttempts(token.getAttempts() + 1);
                    if (passwordEncoder.matches(rawOtp, token.getOtpHash())) {
                        token.setUsed(true);
                        return true;
                    }
                    return false;
                })
                .orElse(false);
    }

    @Override
    @Transactional
    public void invalidateOtps(String userId, OtpToken.OtpPurpose purpose) {
        otpTokenRepository.invalidateAllForUserAndPurpose(userId, purpose);
    }

    @Async
    protected void sendOtpEmail(String email, String otp, OtpToken.OtpPurpose purpose) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(email);
            message.setSubject("Your TravelSure OTP for " + purpose.name().replace("_", " ").toLowerCase());
            message.setText("Your One-Time Password (OTP) is: " + otp
                    + "\n\nThis OTP is valid for " + otpExpiryMinutes + " minutes. Do not share this with anyone.");
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", email, e.getMessage());
        }
    }
}
