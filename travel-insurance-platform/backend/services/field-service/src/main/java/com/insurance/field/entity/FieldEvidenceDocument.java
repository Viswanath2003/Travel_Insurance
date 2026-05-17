package com.insurance.field.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "field_evidence_documents", schema = "ins_field")
public class FieldEvidenceDocument {

    @Id
    @Column(name = "id", columnDefinition = "uuid", nullable = false, updatable = false)
    private String id;

    @Column(name = "report_id", nullable = false, columnDefinition = "uuid")
    private String reportId;

    @Column(name = "assignment_id", nullable = false, columnDefinition = "uuid")
    private String assignmentId;

    @Column(name = "document_type", nullable = false, length = 60)
    private String documentType;

    @Column(name = "document_name", nullable = false, length = 200)
    private String documentName;

    @Column(name = "storage_key", nullable = false, length = 500)
    private String storageKey;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "caption", length = 300)
    private String caption;

    @Column(name = "uploaded_by", nullable = false, columnDefinition = "uuid")
    private String uploadedBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
