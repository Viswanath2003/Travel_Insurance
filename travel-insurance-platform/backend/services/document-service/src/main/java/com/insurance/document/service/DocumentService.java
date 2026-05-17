package com.insurance.document.service;

import com.insurance.document.dto.request.GenerateDocumentRequest;
import com.insurance.document.dto.response.DocumentResponse;

import java.util.List;

public interface DocumentService {

    DocumentResponse generate(GenerateDocumentRequest request);

    DocumentResponse getById(String documentId);

    List<DocumentResponse> getByEntity(String entityType, String entityId);

    byte[] download(String documentId);
}
