package com.insurance.auth.service;

import com.insurance.auth.dto.request.*;
import com.insurance.auth.dto.response.AuthResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public interface AuthService {

    AuthResponse login(LoginRequest request, HttpServletResponse response, String ipAddress);

    AuthResponse refreshToken(HttpServletRequest request, HttpServletResponse response);

    void logout(HttpServletRequest request, HttpServletResponse response);

    void register(RegisterRequest request);

    void verifyEmail(OtpVerifyRequest request);

    void forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);

    void resendOtp(String userId, String purpose);
}
