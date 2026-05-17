-- =============================================================================
-- V07__field_tables.sql
-- Schema: ins_field
-- Service: field-service
-- Description: Field officer investigation assignments and reporting.
-- =============================================================================

USE ins_field;

-- =============================================================================
-- field_assignments
-- Created by claims-service when a claim requires field investigation.
-- Field Officer accepts, investigates, and submits a field_report.
-- =============================================================================
CREATE TABLE field_assignments (
    id                  VARCHAR(36)     NOT NULL,
    assignment_reference VARCHAR(30)    NOT NULL,
    claim_id            VARCHAR(36)     NOT NULL,
    claim_reference     VARCHAR(30)     NOT NULL,
    policy_id           VARCHAR(36)     NOT NULL,
    policy_number       VARCHAR(30)     NOT NULL,
    customer_id         VARCHAR(36)     NOT NULL,
    customer_name       VARCHAR(100)    NULL,
    assigned_officer_id VARCHAR(36)     NULL,
    assigned_officer_name VARCHAR(100)  NULL,
    assigned_by         VARCHAR(36)     NULL,
    assigned_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status              VARCHAR(15)     NOT NULL DEFAULT 'ASSIGNED',
                                        -- ASSIGNED | ACCEPTED | IN_PROGRESS | COMPLETED | REASSIGNED
    priority            VARCHAR(10)     NOT NULL DEFAULT 'NORMAL',
                                        -- LOW | NORMAL | HIGH | URGENT
    investigation_notes TEXT            NULL,
    due_date            DATE            NULL,
    accepted_at         DATETIME        NULL,
    completed_at        DATETIME        NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_field_assignments PRIMARY KEY (id),
    CONSTRAINT uq_fa_reference UNIQUE (assignment_reference),
    CONSTRAINT chk_fa_status CHECK (status IN (
        'ASSIGNED','ACCEPTED','IN_PROGRESS','COMPLETED','REASSIGNED'
    )),
    CONSTRAINT chk_fa_priority CHECK (priority IN ('LOW','NORMAL','HIGH','URGENT'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_fa_officer ON field_assignments (assigned_officer_id, status);
CREATE INDEX idx_fa_claim_id ON field_assignments (claim_id);
CREATE INDEX idx_fa_due_date ON field_assignments (due_date, status);

-- =============================================================================
-- field_reports
-- Submitted by field officer after completing investigation.
-- recommendation drives the subsequent claim decision.
-- fraud_indicators_found triggers fraud review routing.
-- =============================================================================
CREATE TABLE field_reports (
    id                      VARCHAR(36)     NOT NULL,
    assignment_id           VARCHAR(36)     NOT NULL,
    claim_id                VARCHAR(36)     NOT NULL,
    report_reference        VARCHAR(30)     NOT NULL,
    submitted_by            VARCHAR(36)     NOT NULL,
    submitted_by_name       VARCHAR(100)    NULL,
    visit_date              DATE            NOT NULL,
    visit_location          VARCHAR(300)    NULL,
    claimant_contacted      TINYINT(1)      NOT NULL DEFAULT 0,
    incident_verified       TINYINT(1)      NULL,
    findings                TEXT            NOT NULL,
    recommendation          VARCHAR(25)     NOT NULL,
                                            -- APPROVE | PARTIAL_APPROVE | DECLINE | FURTHER_INVESTIGATION
    recommendation_notes    TEXT            NULL,
    fraud_indicators_found  TINYINT(1)      NOT NULL DEFAULT 0,
    fraud_indicator_details TEXT            NULL,
    submitted_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    generated_document_id   VARCHAR(36)     NULL,

    CONSTRAINT pk_field_reports PRIMARY KEY (id),
    CONSTRAINT uq_fr_assignment UNIQUE (assignment_id),
    CONSTRAINT uq_fr_reference UNIQUE (report_reference),
    CONSTRAINT chk_fr_recommendation CHECK (recommendation IN (
        'APPROVE','PARTIAL_APPROVE','DECLINE','FURTHER_INVESTIGATION'
    )),
    CONSTRAINT fk_fr_assignment FOREIGN KEY (assignment_id) REFERENCES field_assignments (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_fr_claim_id ON field_reports (claim_id);

-- =============================================================================
-- field_evidence_documents
-- Evidence files (photos, videos, documents) uploaded by field officer.
-- Stored on local filesystem; path recorded here.
-- =============================================================================
CREATE TABLE field_evidence_documents (
    id              VARCHAR(36)     NOT NULL,
    assignment_id   VARCHAR(36)     NOT NULL,
    file_name       VARCHAR(200)    NOT NULL,
    file_path       VARCHAR(500)    NOT NULL,
    file_size_bytes BIGINT          NULL,
    mime_type       VARCHAR(100)    NULL,
    evidence_type   VARCHAR(30)     NULL,
                                    -- PHOTO | VIDEO | DOCUMENT | WITNESS_STATEMENT
    description     TEXT            NULL,
    uploaded_by     VARCHAR(36)     NOT NULL,
    uploaded_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_field_evidence_documents PRIMARY KEY (id),
    CONSTRAINT fk_fed_assignment FOREIGN KEY (assignment_id) REFERENCES field_assignments (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_fed_assignment_id ON field_evidence_documents (assignment_id);
