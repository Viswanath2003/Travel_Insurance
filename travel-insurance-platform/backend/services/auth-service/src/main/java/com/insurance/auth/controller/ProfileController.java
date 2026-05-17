package com.insurance.auth.controller;

import com.insurance.auth.dto.request.UpdateProfileRequest;
import com.insurance.auth.dto.response.CustomerProfileResponse;
import com.insurance.auth.entity.ProfileChangeRequest;
import com.insurance.auth.service.CustomerProfileService;
import com.insurance.common.dto.ApiResponse;
import com.insurance.common.dto.PagedResponse;
import com.insurance.common.security.PermissionConstants;
import com.insurance.common.security.SecurityUtils;
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
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
@Tag(name = "Customer Profile", description = "Customer PII profile management with admin-approval workflow")
@SecurityRequirement(name = "bearerAuth")
public class ProfileController {

    private final CustomerProfileService profileService;

    @GetMapping("/me")
    @Operation(summary = "Get own customer profile (PII)")
    public ResponseEntity<ApiResponse<CustomerProfileResponse>> getMyProfile() {
        String userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.ok(profileService.getProfile(userId)));
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasAuthority('" + PermissionConstants.USER_VIEW + "')")
    @Operation(summary = "Get customer profile by user ID (admin/staff only)")
    public ResponseEntity<ApiResponse<CustomerProfileResponse>> getProfile(@PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.ok(profileService.getProfile(userId)));
    }

    @PostMapping("/me/change-request")
    @Operation(summary = "Submit a profile update request for admin approval")
    public ResponseEntity<ApiResponse<Void>> submitChangeRequest(
            @Valid @RequestBody UpdateProfileRequest request) {
        String userId = SecurityUtils.getCurrentUserId();
        profileService.submitProfileChangeRequest(userId, request);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true)
                .message("Profile update request submitted for admin review").build());
    }

    @GetMapping("/change-requests/pending")
    @PreAuthorize("hasAuthority('" + PermissionConstants.USER_MANAGE + "')")
    @Operation(summary = "List pending profile change requests (admin only)")
    public ResponseEntity<ApiResponse<PagedResponse<ProfileChangeRequest>>> getPendingRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                profileService.getPendingRequests(PageRequest.of(page, size, Sort.by("createdAt").ascending()))));
    }

    @PostMapping("/change-requests/{requestId}/approve")
    @PreAuthorize("hasAuthority('" + PermissionConstants.USER_MANAGE + "')")
    @Operation(summary = "Approve a profile change request (admin only)")
    public ResponseEntity<ApiResponse<Void>> approveRequest(@PathVariable String requestId) {
        String adminId = SecurityUtils.getCurrentUserId();
        profileService.approveProfileChange(requestId, adminId);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true)
                .message("Profile change approved and applied").build());
    }

    @PostMapping("/change-requests/{requestId}/reject")
    @PreAuthorize("hasAuthority('" + PermissionConstants.USER_MANAGE + "')")
    @Operation(summary = "Reject a profile change request (admin only)")
    public ResponseEntity<ApiResponse<Void>> rejectRequest(
            @PathVariable String requestId,
            @RequestParam String notes) {
        String adminId = SecurityUtils.getCurrentUserId();
        profileService.rejectProfileChange(requestId, adminId, notes);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true)
                .message("Profile change request rejected").build());
    }
}
