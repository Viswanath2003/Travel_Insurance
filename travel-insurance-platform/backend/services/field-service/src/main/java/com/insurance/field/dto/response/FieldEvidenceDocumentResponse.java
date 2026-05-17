package com.insurance.field.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class FieldEvidenceDocumentResponse {

    private String id;
    private String reportId;
    private String assignmentId;
    private String documentType;
    private String documentName;
    private Long fileSizeBytes;
    private String mimeType;
    private String caption;
    private String uploadedBy;
    private LocalDateTime createdAt;
}
