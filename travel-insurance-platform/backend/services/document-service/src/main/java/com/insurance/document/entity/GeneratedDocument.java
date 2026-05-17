package com.insurance.document.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "generated_documents", schema = "ins_document")
@EntityListeners(AuditingEntityListener.class)
public class GeneratedDocument {

    @Id
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "template_id", nullable = false, length = 36)
    private String templateId;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false, length = 36)
    private String entityId;

    @Column(name = "reference_number", nullable = false, length = 50)
    private String referenceNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 50)
    private DocumentType documentType;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "file_size_bytes")
    private long fileSizeBytes;

    @Column(name = "generated_by", nullable = false, length = 36)
    private String generatedBy;

    @CreatedDate
    @Column(name = "generated_at", nullable = false, updatable = false)
    private LocalDateTime generatedAt;

    @PrePersist
    protected void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }

    public enum DocumentType {
        POLICY_SCHEDULE, POLICY_WORDING, CLAIM_DECISION_LETTER,
        CLAIM_SETTLEMENT_VOUCHER, ENDORSEMENT_CERTIFICATE, RENEWAL_NOTICE
    }
}
