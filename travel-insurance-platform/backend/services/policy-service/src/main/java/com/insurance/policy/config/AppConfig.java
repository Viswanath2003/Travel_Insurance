package com.insurance.policy.config;

import com.insurance.common.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AppConfig {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.access-token-expiry-minutes:15}")
    private long accessTokenExpiryMinutes;

    @Value("${app.jwt.refresh-token-expiry-days:7}")
    private long refreshTokenExpiryDays;

    @Value("${app.jwt.issuer:travel-insurance-platform}")
    private String jwtIssuer;

    @Bean
    public JwtTokenProvider jwtTokenProvider() {
        return new JwtTokenProvider(
            jwtSecret,
            accessTokenExpiryMinutes * 60 * 1000,
            refreshTokenExpiryDays * 24 * 60 * 60 * 1000,
            jwtIssuer
        );
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
