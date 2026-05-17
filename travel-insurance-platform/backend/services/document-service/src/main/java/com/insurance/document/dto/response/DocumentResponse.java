package com.insurance.document.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {

    private String id;
    private String templateId;
    private String entityType;
    private String entityId;
    private String referenceNumber;
    private String documentType;
    private String fileName;
    private String filePath;
    private long fileSizeBytes;
    private String generatedBy;
    private LocalDateTime generatedAt;
}
