package com.insurance.auth.service.impl;

import com.insurance.auth.dto.request.ChangePasswordRequest;
import com.insurance.auth.dto.response.UserProfileResponse;
import com.insurance.auth.entity.PasswordHistory;
import com.insurance.auth.entity.Role;
import com.insurance.auth.entity.User;
import com.insurance.auth.repository.PasswordHistoryRepository;
import com.insurance.auth.repository.RoleRepository;
import com.insurance.auth.repository.UserRepository;
import com.insurance.auth.service.UserService;
import com.insurance.common.dto.PagedResponse;
import com.insurance.common.exception.BusinessRuleException;
import com.insurance.common.exception.ResourceNotFoundException;
import com.insurance.common.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordHistoryRepository passwordHistoryRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.password.history-limit:5}")
    private int passwordHistoryLimit;

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile() {
        String userId = SecurityUtils.getCurrentUserId();
        return getUserById(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getUserById(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        return mapToProfileResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<UserProfileResponse> getAllUsers(Pageable pageable) {
        Page<User> page = userRepository.findAll(pageable);
        List<UserProfileResponse> responses = page.getContent().stream()
                .map(this::mapToProfileResponse)
                .collect(Collectors.toList());
        return PagedResponse.of(page, responses);
    }

    @Override
    @Transactional
    public void updateProfile(String userId, String fullName, String phone) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        user.setFullName(fullName);
        user.setPhone(phone);
    }

    @Override
    @Transactional
    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BusinessRuleException("Current password is incorrect", "INVALID_CURRENT_PASSWORD");
        }

        validatePasswordHistory(userId, request.getNewPassword());

        PasswordHistory history = new PasswordHistory();
        history.setUserId(userId);
        history.setPasswordHash(user.getPasswordHash());
        history.setChangedAt(LocalDateTime.now());
        passwordHistoryRepository.save(history);

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
    }

    @Override
    @Transactional
    public void lockUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        user.setStatus(User.UserStatus.LOCKED);
    }

    @Override
    @Transactional
    public void unlockUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        user.setStatus(User.UserStatus.ACTIVE);
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
    }

    @Override
    @Transactional
    public void assignRole(String userId, String roleCode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        Role role = roleRepository.findByRoleCode(roleCode)
                .orElseThrow(() -> new ResourceNotFoundException("Role", roleCode));
        user.getRoles().add(role);
    }

    @Override
    @Transactional
    public void removeRole(String userId, String roleCode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        user.getRoles().removeIf(r -> r.getRoleCode().equals(roleCode));
    }

    private void validatePasswordHistory(String userId, String newPassword) {
        List<PasswordHistory> history = passwordHistoryRepository.findTop5ByUserIdOrderByChangedAtDesc(userId);
        boolean reused = history.stream()
                .anyMatch(h -> passwordEncoder.matches(newPassword, h.getPasswordHash()));
        if (reused) {
            throw new BusinessRuleException(
                "Password cannot be the same as any of the last " + passwordHistoryLimit + " passwords",
                "PASSWORD_REUSE"
            );
        }
    }

    private UserProfileResponse mapToProfileResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .status(user.getStatus().name())
                .emailVerified(user.isEmailVerified())
                .lastLoginAt(user.getLastLoginAt())
                .roles(user.getRoles().stream().map(Role::getRoleCode).collect(Collectors.toSet()))
                .createdAt(user.getCreatedAt())
                .build();
    }
}
