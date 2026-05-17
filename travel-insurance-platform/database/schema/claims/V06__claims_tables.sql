-- =============================================================================
-- V06__claims_tables.sql
-- Schema: ins_claims
-- Service: claims-service
-- Description: End-to-end claims lifecycle. Coverage validation uses
--              policy_snapshot (never live policy data). Configurable
--              document checklists per claim type.
-- =============================================================================

USE ins_claims;

-- =============================================================================
-- claim_types
-- Admin-configurable claim type catalog.
-- auto_decision_threshold: claims below this amount eligible for auto-decision
-- requires_field_investigation_above: auto-assign field officer above this amount
-- =============================================================================
CREATE TABLE claim_types (
    id                                  VARCHAR(36)     NOT NULL,
    type_code                           VARCHAR(50)     NOT NULL,
                                                        -- MEDICAL_EXPENSES | TRIP_CANCELLATION
                                                        -- BAGGAGE_LOSS | BAGGAGE_DELAY | FLIGHT_DELAY
                                                        -- PERSONAL_ACCIDENT | EMERGENCY_EVACUATION
                                                        -- EQUIPMENT_LOSS | DENTAL
    type_name                           VARCHAR(100)    NOT NULL,
    coverage_type_code                  VARCHAR(50)     NOT NULL,
    description                         TEXT            NULL,
    auto_decision_threshold             DECIMAL(12,2)   NULL,
    max_auto_approval_amount            DECIMAL(12,2)   NULL,
    requires_field_investigation_above  DECIMAL(12,2)   NULL,
    is_active                           TINYINT(1)      NOT NULL DEFAULT 1,
    sort_order                          INT             NOT NULL DEFAULT 0,
    created_at                          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_claim_types PRIMARY KEY (id),
    CONSTRAINT uq_claim_type_code UNIQUE (type_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- claims
-- Core claim record. policy_snapshot_id links to the ISSUANCE snapshot
-- of the referenced policy — ensuring adjudication uses locked-in terms.
-- version for optimistic locking on high-contention state transitions.
-- =============================================================================
CREATE TABLE claims (
    id                          VARCHAR(36)     NOT NULL,
    claim_reference             VARCHAR(30)     NOT NULL,
    policy_id                   VARCHAR(36)     NOT NULL,
    policy_number               VARCHAR(30)     NOT NULL,
    customer_id                 VARCHAR(36)     NOT NULL,
    claim_type_id               VARCHAR(36)     NOT NULL,
    incident_date               DATE            NOT NULL,
    incident_description        TEXT            NOT NULL,
    incident_location           VARCHAR(300)    NULL,
    claimed_amount              DECIMAL(15,2)   NOT NULL,
    approved_amount             DECIMAL(15,2)   NULL,
    currency                    CHAR(3)         NOT NULL DEFAULT 'INR',
    current_state               VARCHAR(30)     NOT NULL DEFAULT 'SUBMITTED',
                                                -- SUBMITTED | DOCUMENT_REVIEW | DOCUMENT_PENDING
                                                -- UNDER_REVIEW | INVESTIGATION_ASSIGNED
                                                -- INVESTIGATION_COMPLETE | DECISION_PENDING
                                                -- AUTO_APPROVED | AUTO_DECLINED
                                                -- APPROVED | PARTIALLY_APPROVED | DECLINED
                                                -- PAYMENT_PENDING | SETTLED | CLOSED
    assigned_officer_id         VARCHAR(36)     NULL,
    assigned_officer_name       VARCHAR(100)    NULL,
    assigned_at                 DATETIME        NULL,
    auto_decision_score         DECIMAL(6,2)    NULL,
    auto_decision_batch_id      VARCHAR(36)     NULL,
    sla_due_at                  DATETIME        NULL,
    sla_breached                TINYINT(1)      NOT NULL DEFAULT 0,
    policy_snapshot_id          VARCHAR(36)     NULL,
    submitted_at                DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at                  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version                     BIGINT          NOT NULL DEFAULT 0,

    CONSTRAINT pk_claims PRIMARY KEY (id),
    CONSTRAINT uq_claim_reference UNIQUE (claim_reference),
    CONSTRAINT chk_claim_state CHECK (current_state IN (
        'SUBMITTED','DOCUMENT_REVIEW','DOCUMENT_PENDING','UNDER_REVIEW',
        'INVESTIGATION_ASSIGNED','INVESTIGATION_COMPLETE','DECISION_PENDING',
        'AUTO_APPROVED','AUTO_DECLINED','APPROVED','PARTIALLY_APPROVED','DECLINED',
        'PAYMENT_PENDING','SETTLED','CLOSED'
    )),
    CONSTRAINT fk_claims_type FOREIGN KEY (claim_type_id) REFERENCES claim_types (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_claims_customer ON claims (customer_id, current_state);
CREATE INDEX idx_claims_officer ON claims (assigned_officer_id, current_state);
CREATE INDEX idx_claims_policy ON claims (policy_id);
CREATE INDEX idx_claims_sla ON claims (sla_due_at, current_state, sla_breached);
CREATE INDEX idx_claims_state ON claims (current_state);

-- =============================================================================
-- claim_travelers
-- Travelers involved in this claim (subset of policy travelers).
-- =============================================================================
CREATE TABLE claim_travelers (
    id                  VARCHAR(36)     NOT NULL,
    claim_id            VARCHAR(36)     NOT NULL,
    policy_traveler_id  VARCHAR(36)     NULL,
    full_name           VARCHAR(100)    NOT NULL,
    is_primary_claimant TINYINT(1)      NOT NULL DEFAULT 0,

    CONSTRAINT pk_claim_travelers PRIMARY KEY (id),
    CONSTRAINT fk_clt_claim FOREIGN KEY (claim_id) REFERENCES claims (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_clt_claim_id ON claim_travelers (claim_id);

-- =============================================================================
-- claim_documents
-- Evidence documents uploaded by customer at claim submission.
-- File stored on local filesystem; path recorded here.
-- is_valid set by Claims Officer during document review.
-- =============================================================================
CREATE TABLE claim_documents (
    id              VARCHAR(36)     NOT NULL,
    claim_id        VARCHAR(36)     NOT NULL,
    document_name   VARCHAR(200)    NOT NULL,
    document_type   VARCHAR(100)    NOT NULL,
    file_path       VARCHAR(500)    NOT NULL,
    file_name       VARCHAR(200)    NOT NULL,
    file_size_bytes BIGINT          NULL,
    mime_type       VARCHAR(100)    NULL,
    uploaded_by     VARCHAR(36)     NOT NULL,
    uploaded_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_valid        TINYINT(1)      NULL,
    validation_notes TEXT           NULL,

    CONSTRAINT pk_claim_documents PRIMARY KEY (id),
    CONSTRAINT fk_cd_claim FOREIGN KEY (claim_id) REFERENCES claims (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_cd_claim_id ON claim_documents (claim_id);

-- =============================================================================
-- claim_doc_checklist_config
-- Admin-configurable per-claim-type document checklist.
-- Defines which documents are required/optional for each claim type.
-- Claims Officer views this checklist for each incoming claim (from wireframe).
-- =============================================================================
CREATE TABLE claim_doc_checklist_config (
    id                  VARCHAR(36)     NOT NULL,
    claim_type_id       VARCHAR(36)     NOT NULL,
    document_name       VARCHAR(200)    NOT NULL,
    document_description TEXT           NULL,
    is_mandatory        TINYINT(1)      NOT NULL DEFAULT 1,
    sort_order          INT             NOT NULL DEFAULT 0,
    is_active           TINYINT(1)      NOT NULL DEFAULT 1,

    CONSTRAINT pk_claim_doc_checklist_config PRIMARY KEY (id),
    CONSTRAINT fk_cdcc_type FOREIGN KEY (claim_type_id) REFERENCES claim_types (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_cdcc_type ON claim_doc_checklist_config (claim_type_id, is_active);

-- =============================================================================
-- claim_checklist_status
-- Per-claim tracking of which checklist items have been submitted.
-- Used to determine if state can transition from DOCUMENT_REVIEW → UNDER_REVIEW.
-- =============================================================================
CREATE TABLE claim_checklist_status (
    id                  VARCHAR(36)     NOT NULL,
    claim_id            VARCHAR(36)     NOT NULL,
    checklist_config_id VARCHAR(36)     NOT NULL,
    is_submitted        TINYINT(1)      NOT NULL DEFAULT 0,
    claim_document_id   VARCHAR(36)     NULL,
    reviewed_by         VARCHAR(36)     NULL,
    reviewed_at         DATETIME        NULL,
    notes               TEXT            NULL,

    CONSTRAINT pk_claim_checklist_status PRIMARY KEY (id),
    CONSTRAINT uq_ccs_claim_config UNIQUE (claim_id, checklist_config_id),
    CONSTRAINT fk_ccs_claim FOREIGN KEY (claim_id) REFERENCES claims (id),
    CONSTRAINT fk_ccs_config FOREIGN KEY (checklist_config_id) REFERENCES claim_doc_checklist_config (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_ccs_claim_id ON claim_checklist_status (claim_id);

-- =============================================================================
-- claim_workflow_history
-- Immutable record of all state transitions on a claim.
-- Displayed in UI-023 Claim Tracking timeline for customer.
-- =============================================================================
CREATE TABLE claim_workflow_history (
    id              VARCHAR(36)     NOT NULL,
    claim_id        VARCHAR(36)     NOT NULL,
    from_state      VARCHAR(30)     NULL,
    to_state        VARCHAR(30)     NOT NULL,
    trigger_event   VARCHAR(100)    NOT NULL,
    actor_user_id   VARCHAR(36)     NULL,
    actor_role      VARCHAR(50)     NULL,
    comments        TEXT            NULL,
    transitioned_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_claim_workflow_history PRIMARY KEY (id),
    CONSTRAINT fk_cwh_claim FOREIGN KEY (claim_id) REFERENCES claims (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_cwh_claim_id ON claim_workflow_history (claim_id, transitioned_at);

-- =============================================================================
-- claim_decisions
-- Final decision record. One decision per claim (enforced by UNIQUE on claim_id).
-- coverage_validated_against_snapshot confirms policy snapshot was used.
-- rule_execution_batch_id links to rule_execution_logs if auto-decided.
-- =============================================================================
CREATE TABLE claim_decisions (
    id                                      VARCHAR(36)     NOT NULL,
    claim_id                                VARCHAR(36)     NOT NULL,
    decision_type                           VARCHAR(25)     NOT NULL,
                                                            -- AUTO_APPROVED | AUTO_DECLINED
                                                            -- APPROVED | PARTIALLY_APPROVED | DECLINED
    decided_by                              VARCHAR(36)     NULL,
    decided_at                              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    claimed_amount                          DECIMAL(15,2)   NOT NULL,
    approved_amount                         DECIMAL(15,2)   NOT NULL DEFAULT 0.00,
    decision_reason                         TEXT            NOT NULL,
    coverage_validated_against_snapshot     TINYINT(1)      NOT NULL DEFAULT 1,
    coverage_validation_notes               TEXT            NULL,
    rule_execution_batch_id                 VARCHAR(36)     NULL,

    CONSTRAINT pk_claim_decisions PRIMARY KEY (id),
    CONSTRAINT uq_cd_claim UNIQUE (claim_id),
    CONSTRAINT chk_cd_type CHECK (decision_type IN (
        'AUTO_APPROVED','AUTO_DECLINED','APPROVED','PARTIALLY_APPROVED','DECLINED'
    )),
    CONSTRAINT fk_cdc_claim FOREIGN KEY (claim_id) REFERENCES claims (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- claim_payments
-- Mock payment recording. Real payment gateway is out of scope.
-- Finance Officer records payment details and updates status.
-- =============================================================================
CREATE TABLE claim_payments (
    id                  VARCHAR(36)     NOT NULL,
    claim_id            VARCHAR(36)     NOT NULL,
    claim_decision_id   VARCHAR(36)     NOT NULL,
    payment_reference   VARCHAR(100)    NOT NULL,
    payment_amount      DECIMAL(15,2)   NOT NULL,
    payment_method      VARCHAR(20)     NOT NULL DEFAULT 'MOCK',
                                        -- BANK_TRANSFER | CHEQUE | CASH | MOCK
    payment_status      VARCHAR(15)     NOT NULL DEFAULT 'PENDING',
                                        -- PENDING | PROCESSING | COMPLETED | FAILED
    processed_by        VARCHAR(36)     NULL,
    processed_at        DATETIME        NULL,
    beneficiary_name    VARCHAR(100)    NULL,
    beneficiary_account VARCHAR(100)    NULL,
    payment_notes       TEXT            NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_claim_payments PRIMARY KEY (id),
    CONSTRAINT chk_cp_method CHECK (payment_method IN ('BANK_TRANSFER','CHEQUE','CASH','MOCK')),
    CONSTRAINT chk_cp_status CHECK (payment_status IN ('PENDING','PROCESSING','COMPLETED','FAILED')),
    CONSTRAINT fk_cp_claim FOREIGN KEY (claim_id) REFERENCES claims (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_cp_claim_id ON claim_payments (claim_id);
CREATE INDEX idx_cp_status ON claim_payments (payment_status);

-- =============================================================================
-- claim_snapshots
-- Point-in-time immutable state of the claim at key lifecycle milestones.
-- Captures complete claim data + policy snapshot reference + decision details.
-- =============================================================================
CREATE TABLE claim_snapshots (
    id              VARCHAR(36)     NOT NULL,
    claim_id        VARCHAR(36)     NOT NULL,
    snapshot_type   VARCHAR(15)     NOT NULL,
                                    -- SUBMISSION | DECISION | SETTLEMENT
    snapshot_data   JSON            NOT NULL,
    snapshotted_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    snapshotted_by  VARCHAR(36)     NULL,

    CONSTRAINT pk_claim_snapshots PRIMARY KEY (id),
    CONSTRAINT chk_cs_type CHECK (snapshot_type IN ('SUBMISSION','DECISION','SETTLEMENT')),
    CONSTRAINT fk_cs_claim FOREIGN KEY (claim_id) REFERENCES claims (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_cs_claim_id ON claim_snapshots (claim_id, snapshot_type);

-- =============================================================================
-- claim_sla_config
-- Admin-configurable SLA hours per claim type.
-- =============================================================================
CREATE TABLE claim_sla_config (
    id                      VARCHAR(36)     NOT NULL,
    claim_type_code         VARCHAR(50)     NOT NULL,
    sla_hours               INT             NOT NULL,
    escalation_notify_roles VARCHAR(300)    NULL,
    is_active               TINYINT(1)      NOT NULL DEFAULT 1,
    updated_by              VARCHAR(36)     NULL,
    updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_claim_sla_config PRIMARY KEY (id),
    CONSTRAINT uq_claim_sla UNIQUE (claim_type_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
