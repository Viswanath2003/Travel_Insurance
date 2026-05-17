package com.insurance.common.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
public class JwtTokenProvider {

    private final SecretKey secretKey;
    private final long accessTokenExpiryMs;
    private final long refreshTokenExpiryMs;
    private final String issuer;

    public JwtTokenProvider(String base64Secret, long accessTokenExpiryMs, long refreshTokenExpiryMs, String issuer) {
        this.secretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(base64Secret));
        this.accessTokenExpiryMs = accessTokenExpiryMs;
        this.refreshTokenExpiryMs = refreshTokenExpiryMs;
        this.issuer = issuer;
    }

    public String generateAccessToken(UserPrincipal principal) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessTokenExpiryMs);
        return Jwts.builder()
                .subject(principal.getUserId())
                .issuer(issuer)
                .issuedAt(now)
                .expiration(expiry)
                .claim("username", principal.getUsername())
                .claim("email", principal.getEmail())
                .claim("roles", principal.getRoles())
                .claim("permissions", principal.getPermissions())
                .claim("type", "ACCESS")
                .signWith(secretKey)
                .compact();
    }

    public String generateRefreshToken(String userId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + refreshTokenExpiryMs);
        return Jwts.builder()
                .subject(userId)
                .issuer(issuer)
                .issuedAt(now)
                .expiration(expiry)
                .claim("type", "REFRESH")
                .signWith(secretKey)
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .requireIssuer(issuer)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.debug("JWT token expired");
        } catch (JwtException e) {
            log.debug("JWT token invalid: {}", e.getMessage());
        }
        return false;
    }

    public String getUserIdFromToken(String token) {
        return parseToken(token).getSubject();
    }

    @SuppressWarnings("unchecked")
    public UserPrincipal buildPrincipalFromToken(String token) {
        Claims claims = parseToken(token);
        return UserPrincipal.builder()
                .userId(claims.getSubject())
                .username(claims.get("username", String.class))
                .email(claims.get("email", String.class))
                .enabled(true)
                .accountNonLocked(true)
                .roles(Set.copyOf((List<String>) claims.get("roles", List.class)))
                .permissions(Set.copyOf((List<String>) claims.get("permissions", List.class)))
                .build();
    }

    public boolean isRefreshToken(String token) {
        return "REFRESH".equals(parseToken(token).get("type", String.class));
    }
}
