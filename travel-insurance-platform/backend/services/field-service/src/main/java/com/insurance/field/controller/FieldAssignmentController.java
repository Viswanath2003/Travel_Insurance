package com.insurance.field.controller;

import com.insurance.common.dto.ApiResponse;
import com.insurance.common.dto.PagedResponse;
import com.insurance.common.security.PermissionConstants;
import com.insurance.field.dto.request.CreateFieldAssignmentRequest;
import com.insurance.field.dto.request.ReassignFieldOfficerRequest;
import com.insurance.field.dto.request.SubmitFieldReportRequest;
import com.insurance.field.dto.response.FieldAssignmentResponse;
import com.insurance.field.dto.response.FieldEvidenceDocumentResponse;
import com.insurance.field.dto.response.FieldReportResponse;
import com.insurance.field.service.FieldAssignmentService;
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

import java.util.List;

@RestController
@RequestMapping("/api/v1/field")
@RequiredArgsConstructor
@Tag(name = "Field Operations", description = "Field officer assignment and investigation management")
public class FieldAssignmentController {

    private final FieldAssignmentService fieldAssignmentService;

    // --- Assignment management (supervisor / claims officer) ---

    @PostMapping("/assignments")
    @PreAuthorize("hasAuthority('" + PermissionConstants.FIELD_ASSIGN_OFFICER + "')")
    @Operation(summary = "Create a new field assignment for a claim")
    public ResponseEntity<ApiResponse<FieldAssignmentResponse>> createAssignment(
            @Valid @RequestBody CreateFieldAssignmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(fieldAssignmentService.createAssignment(request)));
    }

    @GetMapping("/assignments/queue")
    @PreAuthorize("hasAuthority('" + PermissionConstants.FIELD_ASSIGN_OFFICER + "')")
    @Operation(summary = "Get open assignments queue (supervisors/admins)")
    public ResponseEntity<ApiResponse<PagedResponse<FieldAssignmentResponse>>> getQueue(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                fieldAssignmentService.getOpenAssignmentsQueue(PageRequest.of(page, size))));
    }

    @GetMapping("/assignments/claim/{claimId}")
    @PreAuthorize("hasAnyAuthority('" + PermissionConstants.FIELD_ASSIGN_OFFICER + "','"
            + PermissionConstants.CLAIM_VIEW_ALL + "')")
    @Operation(summary = "Get all assignments for a claim")
    public ResponseEntity<ApiResponse<PagedResponse<FieldAssignmentResponse>>> getByClaimId(
            @PathVariable String claimId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                fieldAssignmentService.getAssignmentsByClaimId(claimId,
                        PageRequest.of(page, size, Sort.by("createdAt").descending()))));
    }

    @PostMapping("/assignments/{assignmentId}/reassign")
    @PreAuthorize("hasAuthority('" + PermissionConstants.FIELD_ASSIGN_OFFICER + "')")
    @Operation(summary = "Reassign field assignment to a different officer")
    public ResponseEntity<ApiResponse<FieldAssignmentResponse>> reassign(
            @PathVariable String assignmentId,
            @Valid @RequestBody ReassignFieldOfficerRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(fieldAssignmentService.reassign(assignmentId, request)));
    }

    // --- Field officer actions ---

    @GetMapping("/assignments/my")
    @PreAuthorize("hasAuthority('" + PermissionConstants.FIELD_VIEW_ASSIGNMENTS + "')")
    @Operation(summary = "Get all my assignments (field officer)")
    public ResponseEntity<ApiResponse<PagedResponse<FieldAssignmentResponse>>> getMyAssignments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                fieldAssignmentService.getMyAssignments(
                        PageRequest.of(page, size, Sort.by("createdAt").descending()))));
    }

    @GetMapping("/assignments/my/active")
    @PreAuthorize("hasAuthority('" + PermissionConstants.FIELD_VIEW_ASSIGNMENTS + "')")
    @Operation(summary = "Get my active (non-completed) assignments")
    public ResponseEntity<ApiResponse<PagedResponse<FieldAssignmentResponse>>> getMyActiveAssignments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                fieldAssignmentService.getActiveAssignments(
                        PageRequest.of(page, size, Sort.by("dueAt").ascending()))));
    }

    @GetMapping("/assignments/{assignmentId}")
    @PreAuthorize("hasAnyAuthority('" + PermissionConstants.FIELD_VIEW_ASSIGNMENTS + "','"
            + PermissionConstants.FIELD_ASSIGN_OFFICER + "')")
    @Operation(summary = "Get assignment by ID")
    public ResponseEntity<ApiResponse<FieldAssignmentResponse>> getById(
            @PathVariable String assignmentId) {
        return ResponseEntity.ok(ApiResponse.ok(fieldAssignmentService.getAssignmentById(assignmentId)));
    }

    @PostMapping("/assignments/{assignmentId}/start")
    @PreAuthorize("hasAuthority('" + PermissionConstants.FIELD_VIEW_ASSIGNMENTS + "')")
    @Operation(summary = "Start investigation — transitions PENDING_START → IN_PROGRESS")
    public ResponseEntity<ApiResponse<FieldAssignmentResponse>> start(
            @PathVariable String assignmentId) {
        return ResponseEntity.ok(ApiResponse.ok(fieldAssignmentService.startAssignment(assignmentId)));
    }

    // --- Field Report ---

    @PostMapping("/assignments/{assignmentId}/report")
    @PreAuthorize("hasAuthority('" + PermissionConstants.FIELD_SUBMIT_REPORT + "')")
    @Operation(summary = "Submit field investigation report — transitions IN_PROGRESS → REPORT_SUBMITTED")
    public ResponseEntity<ApiResponse<FieldReportResponse>> submitReport(
            @PathVariable String assignmentId,
            @Valid @RequestBody SubmitFieldReportRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(fieldAssignmentService.submitReport(assignmentId, request)));
    }

    @GetMapping("/assignments/{assignmentId}/report")
    @PreAuthorize("hasAnyAuthority('" + PermissionConstants.FIELD_VIEW_ASSIGNMENTS + "','"
            + PermissionConstants.FIELD_ASSIGN_OFFICER + "','" + PermissionConstants.CLAIM_VIEW_ALL + "')")
    @Operation(summary = "Get submitted report for an assignment")
    public ResponseEntity<ApiResponse<FieldReportResponse>> getReport(
            @PathVariable String assignmentId) {
        return ResponseEntity.ok(ApiResponse.ok(fieldAssignmentService.getReportByAssignmentId(assignmentId)));
    }

    // --- Evidence Documents ---

    @PostMapping(value = "/assignments/{assignmentId}/evidence", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('" + PermissionConstants.FIELD_SUBMIT_REPORT + "')")
    @Operation(summary = "Upload evidence file for an assignment (requires report submitted first)")
    public ResponseEntity<ApiResponse<FieldEvidenceDocumentResponse>> uploadEvidence(
            @PathVariable String assignmentId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "documentType", required = false) String documentType,
            @RequestParam(value = "caption", required = false) String caption) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(
                fieldAssignmentService.uploadEvidence(assignmentId, file, documentType, caption)));
    }

    @GetMapping("/assignments/{assignmentId}/evidence")
    @PreAuthorize("hasAnyAuthority('" + PermissionConstants.FIELD_VIEW_ASSIGNMENTS + "','"
            + PermissionConstants.FIELD_ASSIGN_OFFICER + "','" + PermissionConstants.CLAIM_VIEW_ALL + "')")
    @Operation(summary = "List all evidence documents for an assignment")
    public ResponseEntity<ApiResponse<List<FieldEvidenceDocumentResponse>>> getEvidence(
            @PathVariable String assignmentId) {
        return ResponseEntity.ok(ApiResponse.ok(fieldAssignmentService.getEvidenceByAssignmentId(assignmentId)));
    }
}
