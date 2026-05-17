package com.insurance.document.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
public class LocalFileStorageService {

    @Value("${app.storage.document-root:/opt/insurance/storage/documents}")
    private String documentRoot;

    public String storeDocument(byte[] content, String fileName, String entityType, String entityId) {
        try {
            String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
            Path dirPath = Paths.get(documentRoot, entityType.toLowerCase(), datePath, entityId);
            Files.createDirectories(dirPath);

            Path filePath = dirPath.resolve(fileName);
            Files.write(filePath, content);

            log.info("Document stored: {}", filePath);
            return filePath.toString();
        } catch (IOException e) {
            log.error("Failed to store document {}: {}", fileName, e.getMessage());
            throw new RuntimeException("Failed to store document", e);
        }
    }

    public byte[] retrieveDocument(String filePath) {
        try {
            return Files.readAllBytes(Paths.get(filePath));
        } catch (IOException e) {
            log.error("Failed to retrieve document {}: {}", filePath, e.getMessage());
            throw new RuntimeException("Document not found: " + filePath, e);
        }
    }
}
