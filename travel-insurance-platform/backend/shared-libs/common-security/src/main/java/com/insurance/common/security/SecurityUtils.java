package com.insurance.common.security;

import com.insurance.common.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static UserPrincipal getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof UserPrincipal)) {
            throw new UnauthorizedException("No authenticated user found in security context");
        }
        return (UserPrincipal) authentication.getPrincipal();
    }

    public static String getCurrentUserId() {
        return getCurrentUser().getUserId();
    }

    public static String getCurrentUsername() {
        return getCurrentUser().getUsername();
    }

    public static boolean isCurrentUser(String userId) {
        try {
            return getCurrentUserId().equals(userId);
        } catch (UnauthorizedException e) {
            return false;
        }
    }
}
