package com.insurance.auth.service;

import com.insurance.auth.entity.OtpToken;

public interface OtpService {

    void generateAndSendOtp(String userId, String email, OtpToken.OtpPurpose purpose);

    boolean verifyOtp(String userId, String rawOtp, OtpToken.OtpPurpose purpose);

    void invalidateOtps(String userId, OtpToken.OtpPurpose purpose);
}
