package com.insurance.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    private String id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private String status;
    private boolean emailVerified;
    private LocalDateTime lastLoginAt;
    private Set<String> roles;
    private LocalDateTime createdAt;
}
