package com.insurance.auth.service.impl;

import com.insurance.auth.dto.request.*;
import com.insurance.auth.dto.response.AuthResponse;
import com.insurance.auth.entity.OtpToken;
import com.insurance.auth.entity.User;
import com.insurance.auth.entity.UserSession;
import com.insurance.auth.repository.UserRepository;
import com.insurance.auth.repository.UserSessionRepository;
import com.insurance.auth.service.AuthService;
import com.insurance.auth.service.OtpService;
import com.insurance.common.exception.BusinessRuleException;
import com.insurance.common.exception.ResourceNotFoundException;
import com.insurance.common.exception.UnauthorizedException;
import com.insurance.common.security.JwtTokenProvider;
import com.insurance.common.security.UserPrincipal;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final UserSessionRepository userSessionRepository;
    private final OtpService otpService;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.jwt.refresh-token-expiry-days:7}")
    private int refreshTokenExpiryDays;

    @Value("${app.login.max-failed-attempts:5}")
    private int maxFailedAttempts;

    @Value("${app.login.lock-duration-minutes:30}")
    private int lockDurationMinutes;

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletResponse response, String ipAddress) {
        User user = userRepository.findByUsernameWithRolesAndPermissions(request.getUsernameOrEmail())
                .or(() -> userRepository.findByEmailWithRolesAndPermissions(request.getUsernameOrEmail()))
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

        if (user.isAccountLocked()) {
            throw new BusinessRuleException("Account is locked. Please reset your password or contact support.", "ACCOUNT_LOCKED");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            handleFailedLogin(user);
            throw new UnauthorizedException("Invalid credentials");
        }

        if (user.getStatus() == User.UserStatus.PENDING_VERIFICATION) {
            throw new BusinessRuleException("Email not verified. Please verify your email first.", "EMAIL_NOT_VERIFIED");
        }

        resetFailedLoginAttempts(user);
        user.setLastLoginAt(LocalDateTime.now());

        Set<String> roleNames = user.getRoles().stream().map(r -> r.getRoleCode()).collect(Collectors.toSet());
        Set<String> permCodes = user.getRoles().stream()
                .flatMap(r -> r.getPermissions().stream())
                .map(p -> p.getPermissionCode())
                .collect(Collectors.toSet());

        UserPrincipal principal = UserPrincipal.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .enabled(true)
                .accountNonLocked(true)
                .roles(roleNames)
                .permissions(permCodes)
                .build();

        String accessToken = jwtTokenProvider.generateAccessToken(principal);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        storeRefreshToken(user.getId(), refreshToken, ipAddress, response);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roleNames)
                .permissions(permCodes)
                .build();
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = extractRefreshTokenFromCookie(request);
        if (refreshToken == null || !jwtTokenProvider.validateToken(refreshToken)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        String tokenHash = hashToken(refreshToken);
        UserSession session = userSessionRepository.findByRefreshTokenHash(tokenHash)
                .orElseThrow(() -> new UnauthorizedException("Session not found"));

        if (!session.isValid()) {
            throw new UnauthorizedException("Session has expired or been revoked");
        }

        String userId = jwtTokenProvider.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Set<String> roleNames = user.getRoles().stream().map(r -> r.getRoleCode()).collect(Collectors.toSet());
        Set<String> permCodes = user.getRoles().stream()
                .flatMap(r -> r.getPermissions().stream())
                .map(p -> p.getPermissionCode())
                .collect(Collectors.toSet());

        UserPrincipal principal = UserPrincipal.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .enabled(true)
                .accountNonLocked(true)
                .roles(roleNames)
                .permissions(permCodes)
                .build();

        String newAccessToken = jwtTokenProvider.generateAccessToken(principal);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(userId);

        session.setRevoked(true);
        session.setRevokedAt(LocalDateTime.now());
        storeRefreshToken(userId, newRefreshToken, request.getRemoteAddr(), response);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .userId(userId)
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roleNames)
                .permissions(permCodes)
                .build();
    }

    @Override
    @Transactional
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = extractRefreshTokenFromCookie(request);
        if (refreshToken != null) {
            String tokenHash = hashToken(refreshToken);
            userSessionRepository.findByRefreshTokenHash(tokenHash).ifPresent(session -> {
                session.setRevoked(true);
                session.setRevokedAt(LocalDateTime.now());
            });
        }
        clearRefreshTokenCookie(response);
    }

    @Override
    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessRuleException("Email already in use", "EMAIL_EXISTS");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessRuleException("Username already taken", "USERNAME_EXISTS");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setStatus(User.UserStatus.PENDING_VERIFICATION);
        userRepository.save(user);

        otpService.generateAndSendOtp(user.getId(), user.getEmail(), OtpToken.OtpPurpose.EMAIL_VERIFICATION);
    }

    @Override
    @Transactional
    public void verifyEmail(OtpVerifyRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getUserId()));

        boolean valid = otpService.verifyOtp(request.getUserId(), request.getOtp(), OtpToken.OtpPurpose.EMAIL_VERIFICATION);
        if (!valid) {
            throw new BusinessRuleException("Invalid or expired OTP", "INVALID_OTP");
        }

        user.setEmailVerified(true);
        user.setStatus(User.UserStatus.ACTIVE);
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user ->
            otpService.generateAndSendOtp(user.getId(), user.getEmail(), OtpToken.OtpPurpose.PASSWORD_RESET)
        );
        // Always succeeds — never reveal whether email exists
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getUserId()));

        boolean valid = otpService.verifyOtp(request.getUserId(), request.getOtp(), OtpToken.OtpPurpose.PASSWORD_RESET);
        if (!valid) {
            throw new BusinessRuleException("Invalid or expired OTP", "INVALID_OTP");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        if (user.getStatus() == User.UserStatus.LOCKED) {
            user.setStatus(User.UserStatus.ACTIVE);
            user.setFailedLoginAttempts(0);
            user.setLockedUntil(null);
        }
        userSessionRepository.revokeAllSessionsForUser(user.getId(), LocalDateTime.now());
    }

    @Override
    public void resendOtp(String userId, String purpose) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        OtpToken.OtpPurpose otpPurpose = OtpToken.OtpPurpose.valueOf(purpose);
        otpService.invalidateOtps(userId, otpPurpose);
        otpService.generateAndSendOtp(userId, user.getEmail(), otpPurpose);
    }

    private void handleFailedLogin(User user) {
        user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
        if (user.getFailedLoginAttempts() >= maxFailedAttempts) {
            user.setStatus(User.UserStatus.LOCKED);
            user.setLockedUntil(LocalDateTime.now().plusMinutes(lockDurationMinutes));
            log.warn("User account locked due to too many failed attempts: {}", user.getUsername());
        }
        userRepository.save(user);
    }

    private void resetFailedLoginAttempts(User user) {
        if (user.getFailedLoginAttempts() > 0) {
            user.setFailedLoginAttempts(0);
        }
    }

    private void storeRefreshToken(String userId, String refreshToken, String ipAddress, HttpServletResponse response) {
        UserSession session = new UserSession();
        session.setUserId(userId);
        session.setRefreshTokenHash(hashToken(refreshToken));
        session.setIpAddress(ipAddress);
        session.setExpiresAt(LocalDateTime.now().plusDays(refreshTokenExpiryDays));
        userSessionRepository.save(session);

        Cookie cookie = new Cookie("refresh_token", refreshToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // set to true in production with HTTPS
        cookie.setPath("/api/v1/auth/refresh");
        cookie.setMaxAge(refreshTokenExpiryDays * 24 * 3600);
        response.addCookie(cookie);
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie("refresh_token", "");
        cookie.setHttpOnly(true);
        cookie.setPath("/api/v1/auth/refresh");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> "refresh_token".equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }

    private String hashToken(String token) {
        // Use SHA-256 for storage — not BCrypt (deterministic needed for lookup)
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                hexString.append(String.format("%02x", b));
            }
            return hexString.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
