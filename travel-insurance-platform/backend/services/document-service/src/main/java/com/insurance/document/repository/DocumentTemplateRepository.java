package com.insurance.document.repository;

import com.insurance.document.entity.DocumentTemplate;
import com.insurance.document.entity.GeneratedDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DocumentTemplateRepository extends JpaRepository<DocumentTemplate, String> {

    Optional<DocumentTemplate> findByTemplateCodeAndActiveTrue(String templateCode);

    Optional<DocumentTemplate> findByDocumentTypeAndActiveTrue(GeneratedDocument.DocumentType documentType);
}
