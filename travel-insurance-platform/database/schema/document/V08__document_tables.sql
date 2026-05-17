-- =============================================================================
-- V08__document_tables.sql
-- Schema: ins_document
-- Service: document-service
-- Description: Template management and PDF generation pipeline.
--              All generated PDFs stored on local filesystem.
--              Document versions preserved — nothing deleted.
-- =============================================================================

USE ins_document;

-- =============================================================================
-- document_templates
-- HTML templates with ${variable.path} placeholders.
-- Admin manages templates from Admin portal.
-- status workflow: DRAFT → ACTIVE (supersedes previous ACTIVE)
-- product_type_code: null = applies to all product types; set = product-specific template
-- =============================================================================
CREATE TABLE document_templates (
    id                  VARCHAR(36)     NOT NULL,
    template_code       VARCHAR(50)     NOT NULL,
    template_name       VARCHAR(200)    NOT NULL,
    document_type       VARCHAR(50)     NOT NULL,
                                        -- POLICY_SCHEDULE | POLICY_WORDING | QUOTE_SUMMARY
                                        -- CLAIM_ASSESSMENT | FIELD_INVESTIGATION_REPORT
                                        -- RENEWAL_SCHEDULE
    product_type_code   VARCHAR(50)     NULL,
    status              VARCHAR(15)     NOT NULL DEFAULT 'DRAFT',
                                        -- DRAFT | ACTIVE | SUPERSEDED
    version             INT             NOT NULL DEFAULT 1,
    template_body       LONGTEXT        NOT NULL,
    css_styles          TEXT            NULL,
    page_orientation    VARCHAR(10)     NOT NULL DEFAULT 'PORTRAIT',
                                        -- PORTRAIT | LANDSCAPE
    paper_size          VARCHAR(10)     NOT NULL DEFAULT 'A4',
                                        -- A4 | LETTER
    effective_from      DATE            NULL,
    effective_to        DATE            NULL,
    published_by        VARCHAR(36)     NULL,
    published_at        DATETIME        NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by          VARCHAR(36)     NULL,

    CONSTRAINT pk_document_templates PRIMARY KEY (id),
    CONSTRAINT uq_dt_code_version UNIQUE (template_code, version),
    CONSTRAINT chk_dt_type CHECK (document_type IN (
        'POLICY_SCHEDULE','POLICY_WORDING','QUOTE_SUMMARY',
        'CLAIM_ASSESSMENT','FIELD_INVESTIGATION_REPORT','RENEWAL_SCHEDULE'
    )),
    CONSTRAINT chk_dt_status CHECK (status IN ('DRAFT','ACTIVE','SUPERSEDED')),
    CONSTRAINT chk_dt_orientation CHECK (page_orientation IN ('PORTRAIT','LANDSCAPE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_dt_type_status ON document_templates (document_type, status);
CREATE INDEX idx_dt_product_type ON document_templates (product_type_code, document_type);

-- =============================================================================
-- document_template_versions
-- Immutable snapshot of each template at publish time.
-- Allows re-generation of any historical document using the exact template
-- that was active at the time of original generation.
-- =============================================================================
CREATE TABLE document_template_versions (
    id              VARCHAR(36)     NOT NULL,
    template_id     VARCHAR(36)     NOT NULL,
    version_number  INT             NOT NULL,
    version_snapshot JSON           NOT NULL,
    change_notes    TEXT            NULL,
    published_by    VARCHAR(36)     NULL,
    published_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_dtv PRIMARY KEY (id),
    CONSTRAINT uq_dtv_version UNIQUE (template_id, version_number),
    CONSTRAINT fk_dtv_template FOREIGN KEY (template_id) REFERENCES document_templates (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_dtv_template_id ON document_template_versions (template_id);

-- =============================================================================
-- generated_documents
-- Metadata for every generated PDF.
-- file_path is the absolute path on the local filesystem.
-- is_latest = false when a newer version of the same document exists.
-- reference_type + reference_id link back to the source entity.
-- =============================================================================
CREATE TABLE generated_documents (
    id                  VARCHAR(36)     NOT NULL,
    document_type       VARCHAR(50)     NOT NULL,
    reference_type      VARCHAR(20)     NOT NULL,
                                        -- POLICY | CLAIM | QUOTE | FIELD_ASSIGNMENT
    reference_id        VARCHAR(36)     NOT NULL,
    reference_number    VARCHAR(30)     NULL,
    template_id         VARCHAR(36)     NULL,
    template_version    INT             NULL,
    file_name           VARCHAR(200)    NOT NULL,
    file_path           VARCHAR(500)    NOT NULL,
    file_size_bytes     BIGINT          NULL,
    current_version     INT             NOT NULL DEFAULT 1,
    is_latest           TINYINT(1)      NOT NULL DEFAULT 1,
    generated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    generated_by        VARCHAR(36)     NULL,

    CONSTRAINT pk_generated_documents PRIMARY KEY (id),
    CONSTRAINT chk_gd_ref_type CHECK (reference_type IN (
        'POLICY','CLAIM','QUOTE','FIELD_ASSIGNMENT'
    )),
    CONSTRAINT fk_gd_template FOREIGN KEY (template_id) REFERENCES document_templates (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_gd_reference ON generated_documents (reference_type, reference_id);
CREATE INDEX idx_gd_type_latest ON generated_documents (document_type, is_latest);

-- =============================================================================
-- document_versions
-- When a document is re-generated (e.g., after endorsement), the previous
-- version is preserved here and a new row is added.
-- Both old and new files remain on the filesystem — never deleted.
-- =============================================================================
CREATE TABLE document_versions (
    id                      VARCHAR(36)     NOT NULL,
    generated_document_id   VARCHAR(36)     NOT NULL,
    version_number          INT             NOT NULL,
    file_name               VARCHAR(200)    NOT NULL,
    file_path               VARCHAR(500)    NOT NULL,
    file_size_bytes         BIGINT          NULL,
    reason_for_version      TEXT            NULL,
    generated_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    generated_by            VARCHAR(36)     NULL,

    CONSTRAINT pk_document_versions PRIMARY KEY (id),
    CONSTRAINT uq_dv_version UNIQUE (generated_document_id, version_number),
    CONSTRAINT fk_dv_document FOREIGN KEY (generated_document_id) REFERENCES generated_documents (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_dv_document_id ON document_versions (generated_document_id);
