package com.insurance.auth.controller;

import com.insurance.auth.dto.request.*;
import com.insurance.auth.dto.response.AuthResponse;
import com.insurance.auth.service.AuthService;
import com.insurance.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login, registration, OTP, token refresh, logout")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Authenticate user and issue JWT access token")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        AuthResponse response = authService.login(request, httpResponse, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new customer account")
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<Void>builder().success(true).message("Registration successful. Please verify your email.").build());
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token using HttpOnly refresh token cookie")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            HttpServletRequest request,
            HttpServletResponse response) {
        AuthResponse authResponse = authService.refreshToken(request, response);
        return ResponseEntity.ok(ApiResponse.ok(authResponse));
    }

    @PostMapping("/logout")
    @Operation(summary = "Invalidate session and clear refresh token cookie")
    public ResponseEntity<ApiResponse<Void>> logout(
            HttpServletRequest request,
            HttpServletResponse response) {
        authService.logout(request, response);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Logged out successfully").build());
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Verify email address using OTP")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(@Valid @RequestBody OtpVerifyRequest request) {
        authService.verifyEmail(request);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Email verified successfully").build());
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request OTP for password reset")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("If the email exists, an OTP has been sent").build());
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using OTP")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Password reset successfully").build());
    }

    @PostMapping("/resend-otp")
    @Operation(summary = "Resend OTP for a given purpose")
    public ResponseEntity<ApiResponse<Void>> resendOtp(
            @RequestParam String userId,
            @RequestParam String purpose) {
        authService.resendOtp(userId, purpose);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("OTP resent successfully").build());
    }
}
