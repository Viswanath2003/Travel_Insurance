package com.insurance.underwriting.controller;

import com.insurance.common.dto.ApiResponse;
import com.insurance.common.dto.PagedResponse;
import com.insurance.common.security.PermissionConstants;
import com.insurance.underwriting.dto.request.UwDecisionRequest;
import com.insurance.underwriting.dto.response.UwCaseResponse;
import com.insurance.underwriting.service.UwCaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/underwriting/cases")
@RequiredArgsConstructor
@Tag(name = "Underwriting", description = "Underwriting queue and case management")
public class UwCaseController {

    private final UwCaseService uwCaseService;

    @GetMapping("/queue")
    @PreAuthorize("hasAuthority('" + PermissionConstants.UW_VIEW_QUEUE + "')")
    @Operation(summary = "Get underwriting queue")
    public ResponseEntity<ApiResponse<PagedResponse<UwCaseResponse>>> getQueue(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                uwCaseService.getQueue(PageRequest.of(page, size, Sort.by("createdAt").ascending()))));
    }

    @GetMapping("/my-cases")
    @PreAuthorize("hasAuthority('" + PermissionConstants.UW_PROCESS_CASE + "')")
    @Operation(summary = "Get cases assigned to current underwriter")
    public ResponseEntity<ApiResponse<PagedResponse<UwCaseResponse>>> getMyCases(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                uwCaseService.getMyAssignedCases(PageRequest.of(page, size))));
    }

    @GetMapping("/{caseId}")
    @PreAuthorize("hasAuthority('" + PermissionConstants.UW_PROCESS_CASE + "')")
    @Operation(summary = "Get case details")
    public ResponseEntity<ApiResponse<UwCaseResponse>> getCaseById(@PathVariable String caseId) {
        return ResponseEntity.ok(ApiResponse.ok(uwCaseService.getCaseById(caseId)));
    }

    @PostMapping("/{caseId}/assign")
    @PreAuthorize("hasAuthority('" + PermissionConstants.UW_ASSIGN_CASE + "')")
    @Operation(summary = "Assign case to underwriter")
    public ResponseEntity<ApiResponse<UwCaseResponse>> assignCase(
            @PathVariable String caseId,
            @RequestParam String underwriterId) {
        return ResponseEntity.ok(ApiResponse.ok(uwCaseService.assignCase(caseId, underwriterId)));
    }

    @PostMapping("/{caseId}/lock")
    @PreAuthorize("hasAuthority('" + PermissionConstants.UW_PROCESS_CASE + "')")
    @Operation(summary = "Lock case for editing")
    public ResponseEntity<ApiResponse<UwCaseResponse>> lockCase(@PathVariable String caseId) {
        return ResponseEntity.ok(ApiResponse.ok(uwCaseService.lockCase(caseId)));
    }

    @PostMapping("/{caseId}/approve")
    @PreAuthorize("hasAuthority('" + PermissionConstants.UW_APPROVE + "')")
    @Operation(summary = "Approve underwriting case")
    public ResponseEntity<ApiResponse<UwCaseResponse>> approve(
            @PathVariable String caseId,
            @Valid @RequestBody UwDecisionRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(uwCaseService.approve(caseId, request)));
    }

    @PostMapping("/{caseId}/approve-conditional")
    @PreAuthorize("hasAuthority('" + PermissionConstants.UW_APPROVE + "')")
    @Operation(summary = "Approve underwriting case with conditions")
    public ResponseEntity<ApiResponse<UwCaseResponse>> approveWithConditions(
            @PathVariable String caseId,
            @Valid @RequestBody UwDecisionRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(uwCaseService.approveWithConditions(caseId, request)));
    }

    @PostMapping("/{caseId}/reject")
    @PreAuthorize("hasAuthority('" + PermissionConstants.UW_REJECT + "')")
    @Operation(summary = "Reject underwriting case")
    public ResponseEntity<ApiResponse<UwCaseResponse>> reject(
            @PathVariable String caseId,
            @Valid @RequestBody UwDecisionRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(uwCaseService.reject(caseId, request)));
    }

    @PostMapping("/{caseId}/refer-l2")
    @PreAuthorize("hasAuthority('" + PermissionConstants.UW_REFER_L2 + "')")
    @Operation(summary = "Refer case to L2 underwriter")
    public ResponseEntity<ApiResponse<UwCaseResponse>> referToL2(
            @PathVariable String caseId,
            @RequestParam String notes) {
        return ResponseEntity.ok(ApiResponse.ok(uwCaseService.referToL2(caseId, notes)));
    }

    @PostMapping("/{caseId}/escalate")
    @PreAuthorize("hasAuthority('" + PermissionConstants.UW_ESCALATE + "')")
    @Operation(summary = "Escalate case")
    public ResponseEntity<ApiResponse<UwCaseResponse>> escalate(
            @PathVariable String caseId,
            @RequestParam String notes) {
        return ResponseEntity.ok(ApiResponse.ok(uwCaseService.escalate(caseId, notes)));
    }

    @PostMapping("/{caseId}/request-info")
    @PreAuthorize("hasAuthority('" + PermissionConstants.UW_PROCESS_CASE + "')")
    @Operation(summary = "Request additional information from customer")
    public ResponseEntity<ApiResponse<UwCaseResponse>> requestInfo(
            @PathVariable String caseId,
            @RequestParam String requestDetails) {
        return ResponseEntity.ok(ApiResponse.ok(uwCaseService.requestMoreInfo(caseId, requestDetails)));
    }
}
