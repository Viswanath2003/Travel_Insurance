package com.insurance.document.dto.request;

import com.insurance.document.entity.GeneratedDocument;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenerateDocumentRequest {

    @NotNull
    private GeneratedDocument.DocumentType documentType;

    @NotBlank
    private String entityType;

    @NotBlank
    private String entityId;

    @NotBlank
    private String referenceNumber;

    private Map<String, Object> variables;
}
