package com.insurance.audit.controller;

import com.insurance.audit.entity.AuditLog;
import com.insurance.audit.service.AuditLogService;
import com.insurance.common.audit.AuditEvent;
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
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Audit", description = "Immutable audit log â€” write and query")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @PostMapping("/internal/audit")
    @Operation(summary = "Internal endpoint â€” record audit event from any service")
    public ResponseEntity<ApiResponse<Void>> record(@RequestBody AuditEvent event) {
        auditLogService.record(event);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<Void>builder().success(true).message("Audit event recorded").build());
    }

    @GetMapping("/audit/logs")
    @PreAuthorize("hasAuthority('" + PermissionConstants.AUDIT_VIEW + "')")
    @Operation(summary = "Get all audit logs with pagination")
    public ResponseEntity<ApiResponse<PagedResponse<AuditLog>>> getAllLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                auditLogService.getAllLogs(PageRequest.of(page, size, Sort.by("occurredAt").descending()))));
    }

    @GetMapping("/audit/logs/entity/{entityType}/{entityId}")
    @PreAuthorize("hasAuthority('" + PermissionConstants.AUDIT_VIEW + "')")
    @Operation(summary = "Get audit logs for a specific entity")
    public ResponseEntity<ApiResponse<PagedResponse<AuditLog>>> getByEntity(
            @PathVariable String entityType,
            @PathVariable String entityId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                auditLogService.getLogsByEntity(entityType, entityId,
                        PageRequest.of(page, size, Sort.by("occurredAt").descending()))));
    }

    @GetMapping("/audit/logs/actor/{actorId}")
    @PreAuthorize("hasAuthority('" + PermissionConstants.AUDIT_VIEW + "')")
    @Operation(summary = "Get audit logs for a specific actor")
    public ResponseEntity<ApiResponse<PagedResponse<AuditLog>>> getByActor(
            @PathVariable String actorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                auditLogService.getLogsByActor(actorId,
                        PageRequest.of(page, size, Sort.by("occurredAt").descending()))));
    }
}

