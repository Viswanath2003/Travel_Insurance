package com.insurance.auth.controller;

import com.insurance.auth.dto.request.ChangePasswordRequest;
import com.insurance.auth.dto.response.UserProfileResponse;
import com.insurance.auth.service.UserService;
import com.insurance.common.dto.ApiResponse;
import com.insurance.common.dto.PagedResponse;
import com.insurance.common.security.PermissionConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User profile and management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile() {
        return ResponseEntity.ok(ApiResponse.ok(userService.getCurrentUserProfile()));
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasAuthority('" + PermissionConstants.USER_VIEW + "')")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getUserById(@PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getUserById(userId)));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('" + PermissionConstants.USER_VIEW + "')")
    @Operation(summary = "List all users with pagination")
    public ResponseEntity<ApiResponse<PagedResponse<UserProfileResponse>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                userService.getAllUsers(PageRequest.of(page, size, Sort.by("createdAt").descending()))));
    }

    @PutMapping("/{userId}/change-password")
    @Operation(summary = "Change own password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @PathVariable String userId,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(userId, request);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Password changed successfully").build());
    }

    @PutMapping("/{userId}/lock")
    @PreAuthorize("hasAuthority('" + PermissionConstants.USER_MANAGE + "')")
    @Operation(summary = "Lock a user account")
    public ResponseEntity<ApiResponse<Void>> lockUser(@PathVariable String userId) {
        userService.lockUser(userId);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("User locked").build());
    }

    @PutMapping("/{userId}/unlock")
    @PreAuthorize("hasAuthority('" + PermissionConstants.USER_MANAGE + "')")
    @Operation(summary = "Unlock a user account")
    public ResponseEntity<ApiResponse<Void>> unlockUser(@PathVariable String userId) {
        userService.unlockUser(userId);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("User unlocked").build());
    }

    @PostMapping("/{userId}/roles/{roleCode}")
    @PreAuthorize("hasAuthority('" + PermissionConstants.ROLE_MANAGE + "')")
    @Operation(summary = "Assign a role to a user")
    public ResponseEntity<ApiResponse<Void>> assignRole(
            @PathVariable String userId,
            @PathVariable String roleCode) {
        userService.assignRole(userId, roleCode);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Role assigned").build());
    }

    @DeleteMapping("/{userId}/roles/{roleCode}")
    @PreAuthorize("hasAuthority('" + PermissionConstants.ROLE_MANAGE + "')")
    @Operation(summary = "Remove a role from a user")
    public ResponseEntity<ApiResponse<Void>> removeRole(
            @PathVariable String userId,
            @PathVariable String roleCode) {
        userService.removeRole(userId, roleCode);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Role removed").build());
    }
}

