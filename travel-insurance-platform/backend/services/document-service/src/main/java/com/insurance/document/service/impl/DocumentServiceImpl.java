package com.insurance.document.service.impl;

import com.insurance.common.exception.ResourceNotFoundException;
import com.insurance.common.security.UserPrincipal;
import com.insurance.document.dto.request.GenerateDocumentRequest;
import com.insurance.document.dto.response.DocumentResponse;
import com.insurance.document.entity.DocumentTemplate;
import com.insurance.document.entity.GeneratedDocument;
import com.insurance.document.generator.PdfGeneratorService;
import com.insurance.document.repository.DocumentTemplateRepository;
import com.insurance.document.repository.GeneratedDocumentRepository;
import com.insurance.document.service.DocumentService;
import com.insurance.document.storage.LocalFileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {

    private final DocumentTemplateRepository templateRepository;
    private final GeneratedDocumentRepository documentRepository;
    private final PdfGeneratorService pdfGeneratorService;
    private final LocalFileStorageService storageService;

    private static final DateTimeFormatter TIMESTAMP_FMT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    @Override
    @Transactional
    public DocumentResponse generate(GenerateDocumentRequest request) {
        DocumentTemplate template = templateRepository.findByDocumentTypeAndActiveTrue(request.getDocumentType())
                .orElseThrow(() -> new ResourceNotFoundException("DocumentTemplate",
                        request.getDocumentType().name()));

        Map<String, Object> vars = request.getVariables() != null ? request.getVariables() : Collections.emptyMap();
        byte[] pdfBytes = pdfGeneratorService.generate(template.getTemplateContent(), vars);

        String fileName = buildFileName(request);
        String filePath = storageService.storeDocument(pdfBytes, fileName, request.getEntityType(), request.getEntityId());

        GeneratedDocument doc = new GeneratedDocument();
        doc.setTemplateId(template.getId());
        doc.setEntityType(request.getEntityType());
        doc.setEntityId(request.getEntityId());
        doc.setReferenceNumber(request.getReferenceNumber());
        doc.setDocumentType(request.getDocumentType());
        doc.setFileName(fileName);
        doc.setFilePath(filePath);
        doc.setFileSizeBytes(pdfBytes.length);
        doc.setGeneratedBy(currentUserId());

        return toResponse(documentRepository.save(doc));
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentResponse getById(String documentId) {
        return toResponse(findById(documentId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentResponse> getByEntity(String entityType, String entityId) {
        return documentRepository.findByEntityTypeAndEntityId(entityType, entityId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] download(String documentId) {
        GeneratedDocument doc = findById(documentId);
        return storageService.retrieveDocument(doc.getFilePath());
    }

    // --- helpers ---

    private GeneratedDocument findById(String id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", id));
    }

    private String buildFileName(GenerateDocumentRequest request) {
        return request.getDocumentType().name().toLowerCase() + "_"
                + request.getReferenceNumber() + "_"
                + LocalDateTime.now().format(TIMESTAMP_FMT) + ".pdf";
    }

    private String currentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserPrincipal up) return up.getUserId();
        return principal.toString();
    }

    private DocumentResponse toResponse(GeneratedDocument doc) {
        return DocumentResponse.builder()
                .id(doc.getId())
                .templateId(doc.getTemplateId())
                .entityType(doc.getEntityType())
                .entityId(doc.getEntityId())
                .referenceNumber(doc.getReferenceNumber())
                .documentType(doc.getDocumentType().name())
                .fileName(doc.getFileName())
                .filePath(doc.getFilePath())
                .fileSizeBytes(doc.getFileSizeBytes())
                .generatedBy(doc.getGeneratedBy())
                .generatedAt(doc.getGeneratedAt())
                .build();
    }
}
