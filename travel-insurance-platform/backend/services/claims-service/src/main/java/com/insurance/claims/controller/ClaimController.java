package com.insurance.claims.controller;

import com.insurance.claims.dto.request.ClaimDecisionRequest;
import com.insurance.claims.dto.request.SubmitClaimRequest;
import com.insurance.claims.dto.response.ClaimResponse;
import com.insurance.claims.service.ClaimService;
import com.insurance.common.dto.ApiResponse;
import com.insurance.common.dto.PagedResponse;
import com.insurance.common.security.PermissionConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/claims")
@RequiredArgsConstructor
@Tag(name = "Claims", description = "Claims submission and management")
public class ClaimController {

    private final ClaimService claimService;

    @PostMapping
    @PreAuthorize("hasAuthority('" + PermissionConstants.CLAIM_SUBMIT + "')")
    @Operation(summary = "Submit a new insurance claim")
    public ResponseEntity<ApiResponse<ClaimResponse>> submitClaim(@Valid @RequestBody SubmitClaimRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(claimService.submitClaim(request)));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAuthority('" + PermissionConstants.CLAIM_VIEW_OWN + "')")
    @Operation(summary = "Get current user's claims history")
    public ResponseEntity<ApiResponse<PagedResponse<ClaimResponse>>> getMyClaims(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                claimService.getMyClaimsHistory(PageRequest.of(page, size, Sort.by("createdAt").descending()))));
    }

    @GetMapping("/queue")
    @PreAuthorize("hasAuthority('" + PermissionConstants.CLAIM_VIEW_ALL + "')")
    @Operation(summary = "Get claims queue for officers")
    public ResponseEntity<ApiResponse<PagedResponse<ClaimResponse>>> getQueue(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                claimService.getClaimsQueue(PageRequest.of(page, size, Sort.by("createdAt").ascending()))));
    }

    @GetMapping("/{claimId}")
    @PreAuthorize("hasAnyAuthority('" + PermissionConstants.CLAIM_VIEW_OWN + "','" + PermissionConstants.CLAIM_VIEW_ALL + "')")
    @Operation(summary = "Get claim by ID")
    public ResponseEntity<ApiResponse<ClaimResponse>> getClaimById(@PathVariable String claimId) {
        return ResponseEntity.ok(ApiResponse.ok(claimService.getClaimById(claimId)));
    }

    @PostMapping("/{claimId}/assign")
    @PreAuthorize("hasAuthority('" + PermissionConstants.CLAIM_ASSIGN_OFFICER + "')")
    @Operation(summary = "Assign claim to officer")
    public ResponseEntity<ApiResponse<ClaimResponse>> assignOfficer(
            @PathVariable String claimId,
            @RequestParam String officerId) {
        return ResponseEntity.ok(ApiResponse.ok(claimService.assignOfficer(claimId, officerId)));
    }

    @PostMapping("/{claimId}/approve")
    @PreAuthorize("hasAuthority('" + PermissionConstants.CLAIM_APPROVE + "')")
    @Operation(summary = "Approve a claim")
    public ResponseEntity<ApiResponse<ClaimResponse>> approve(
            @PathVariable String claimId,
            @Valid @RequestBody ClaimDecisionRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(claimService.approve(claimId, request)));
    }

    @PostMapping("/{claimId}/partial-approve")
    @PreAuthorize("hasAuthority('" + PermissionConstants.CLAIM_APPROVE + "')")
    @Operation(summary = "Partially approve a claim")
    public ResponseEntity<ApiResponse<ClaimResponse>> partialApprove(
            @PathVariable String claimId,
            @Valid @RequestBody ClaimDecisionRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(claimService.partialApprove(claimId, request)));
    }

    @PostMapping("/{claimId}/decline")
    @PreAuthorize("hasAuthority('" + PermissionConstants.CLAIM_DECLINE + "')")
    @Operation(summary = "Decline a claim")
    public ResponseEntity<ApiResponse<ClaimResponse>> decline(
            @PathVariable String claimId,
            @Valid @RequestBody ClaimDecisionRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(claimService.decline(claimId, request)));
    }

    @PostMapping(value = "/{claimId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyAuthority('" + PermissionConstants.CLAIM_SUBMIT + "','" + PermissionConstants.CLAIM_PROCESS + "')")
    @Operation(summary = "Upload document for a claim")
    public ResponseEntity<ApiResponse<Void>> uploadDocument(
            @PathVariable String claimId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentName") String documentName) {
        claimService.uploadDocument(claimId, file, documentName);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Document uploaded successfully").build());
    }
}

