package com.insurance.document.controller;

import com.insurance.common.dto.ApiResponse;
import com.insurance.document.dto.request.GenerateDocumentRequest;
import com.insurance.document.dto.response.DocumentResponse;
import com.insurance.document.service.DocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
@Tag(name = "Documents", description = "Document generation and retrieval APIs")
@SecurityRequirement(name = "bearerAuth")
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping("/generate")
    @PreAuthorize("hasAuthority('DOCUMENT_GENERATE')")
    @Operation(summary = "Generate a PDF document from a template")
    public ResponseEntity<ApiResponse<DocumentResponse>> generate(
            @Valid @RequestBody GenerateDocumentRequest request) {
        DocumentResponse result = documentService.generate(request);
        return ResponseEntity.ok(ApiResponse.created(result));
    }

    @GetMapping("/{documentId}")
    @PreAuthorize("hasAuthority('DOCUMENT_VIEW_OWN') or hasAuthority('DOCUMENT_VIEW_ALL')")
    @Operation(summary = "Get document metadata by ID")
    public ResponseEntity<ApiResponse<DocumentResponse>> getById(@PathVariable String documentId) {
        return ResponseEntity.ok(ApiResponse.ok(documentService.getById(documentId)));
    }

    @GetMapping("/entity/{entityType}/{entityId}")
    @PreAuthorize("hasAuthority('DOCUMENT_VIEW_OWN') or hasAuthority('DOCUMENT_VIEW_ALL')")
    @Operation(summary = "List documents for an entity")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> getByEntity(
            @PathVariable String entityType,
            @PathVariable String entityId) {
        return ResponseEntity.ok(ApiResponse.ok(documentService.getByEntity(entityType, entityId)));
    }

    @GetMapping("/{documentId}/download")
    @PreAuthorize("hasAuthority('DOCUMENT_VIEW_OWN') or hasAuthority('DOCUMENT_VIEW_ALL')")
    @Operation(summary = "Download document as PDF")
    public ResponseEntity<byte[]> download(@PathVariable String documentId) {
        DocumentResponse meta = documentService.getById(documentId);
        byte[] content = documentService.download(documentId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + meta.getFileName() + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(content);
    }
}
