package com.insurance.policy.controller;

import com.insurance.common.dto.ApiResponse;
import com.insurance.common.dto.PagedResponse;
import com.insurance.common.security.PermissionConstants;
import com.insurance.policy.dto.response.PolicyResponse;
import com.insurance.policy.service.PolicyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/policies")
@RequiredArgsConstructor
@Tag(name = "Policies", description = "Policy issuance and management")
public class PolicyController {

    private final PolicyService policyService;

    @PostMapping("/issue/{quoteId}")
    @PreAuthorize("hasAuthority('" + PermissionConstants.POLICY_CREATE + "')")
    @Operation(summary = "Issue a policy from an approved quote")
    public ResponseEntity<ApiResponse<PolicyResponse>> issuePolicy(@PathVariable String quoteId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(policyService.issuePolicyFromQuote(quoteId)));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAuthority('" + PermissionConstants.POLICY_VIEW_OWN + "')")
    @Operation(summary = "Get current user's policies")
    public ResponseEntity<ApiResponse<PagedResponse<PolicyResponse>>> getMyPolicies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                policyService.getMyPolicies(PageRequest.of(page, size, Sort.by("createdAt").descending()))));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('" + PermissionConstants.POLICY_VIEW_ALL + "')")
    @Operation(summary = "Get all policies (admin/officer)")
    public ResponseEntity<ApiResponse<PagedResponse<PolicyResponse>>> getAllPolicies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                policyService.getAllPolicies(PageRequest.of(page, size, Sort.by("createdAt").descending()))));
    }

    @GetMapping("/{policyId}")
    @PreAuthorize("hasAuthority('" + PermissionConstants.POLICY_VIEW_OWN + "')")
    @Operation(summary = "Get policy by ID")
    public ResponseEntity<ApiResponse<PolicyResponse>> getPolicyById(@PathVariable String policyId) {
        return ResponseEntity.ok(ApiResponse.ok(policyService.getPolicyById(policyId)));
    }

    @PutMapping("/{policyId}/cancel")
    @PreAuthorize("hasAuthority('" + PermissionConstants.POLICY_CANCEL + "')")
    @Operation(summary = "Cancel a policy")
    public ResponseEntity<ApiResponse<Void>> cancelPolicy(
            @PathVariable String policyId,
            @RequestParam String reason) {
        policyService.cancelPolicy(policyId, reason);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Policy cancellation requested").build());
    }
}

