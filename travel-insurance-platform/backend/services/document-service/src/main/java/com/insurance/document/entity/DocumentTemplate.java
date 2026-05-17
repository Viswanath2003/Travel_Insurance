package com.insurance.document.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "document_templates", schema = "ins_document")
@EntityListeners(AuditingEntityListener.class)
public class DocumentTemplate {

    @Id
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "template_code", unique = true, nullable = false, length = 80)
    private String templateCode;

    @Column(name = "template_name", nullable = false, length = 150)
    private String templateName;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 50)
    private GeneratedDocument.DocumentType documentType;

    @Column(name = "template_content", columnDefinition = "LONGTEXT", nullable = false)
    private String templateContent;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "version", nullable = false)
    private int version = 1;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }
}
