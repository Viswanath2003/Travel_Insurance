-- =============================================================================
-- V05__underwriting_tables.sql
-- Schema: ins_underwriting
-- Service: underwriting-service
-- Description: Underwriting workflow for HIGH and VERY_HIGH risk policies.
--              Implements configurable state machine without external BPM.
-- =============================================================================

USE ins_underwriting;

-- =============================================================================
-- uw_cases
-- One UW case is created per policy that is routed for underwriting review.
-- version column for optimistic locking — prevents simultaneous UW actions.
-- is_locked / locked_by enforces single-underwriter access per case (US014).
-- =============================================================================
CREATE TABLE uw_cases (
    id                      VARCHAR(36)     NOT NULL,
    case_reference          VARCHAR(30)     NOT NULL,
    policy_id               VARCHAR(36)     NOT NULL,
    policy_number           VARCHAR(30)     NOT NULL,
    customer_id             VARCHAR(36)     NOT NULL,
    customer_name           VARCHAR(100)    NULL,
    risk_score              INT             NOT NULL,
    risk_level              VARCHAR(12)     NOT NULL,
                                            -- HIGH | VERY_HIGH
    risk_execution_batch_id VARCHAR(36)     NULL,
    uw_level                TINYINT         NOT NULL DEFAULT 1,
                                            -- 1 = L1, 2 = L2
    current_state           VARCHAR(30)     NOT NULL DEFAULT 'NEW',
                                            -- NEW | ASSIGNED | UNDER_REVIEW | INFO_REQUESTED
                                            -- INFO_RECEIVED | APPROVED | REJECTED
                                            -- REFERRED_TO_L2 | L2_UNDER_REVIEW | ESCALATED | CLOSED
    assigned_to_user_id     VARCHAR(36)     NULL,
    assigned_to_username    VARCHAR(50)     NULL,
    assigned_by_user_id     VARCHAR(36)     NULL,
    assigned_at             DATETIME        NULL,
    sla_hours               INT             NOT NULL,
    sla_due_at              DATETIME        NOT NULL,
    sla_breached            TINYINT(1)      NOT NULL DEFAULT 0,
    is_locked               TINYINT(1)      NOT NULL DEFAULT 0,
    locked_by               VARCHAR(36)     NULL,
    locked_at               DATETIME        NULL,
    premium_loading_percent DECIMAL(6,2)    NOT NULL DEFAULT 0.00,
    final_premium           DECIMAL(12,2)   NULL,
    created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version                 BIGINT          NOT NULL DEFAULT 0,

    CONSTRAINT pk_uw_cases PRIMARY KEY (id),
    CONSTRAINT uq_uw_case_reference UNIQUE (case_reference),
    CONSTRAINT uq_uw_policy UNIQUE (policy_id),
    CONSTRAINT chk_uw_state CHECK (current_state IN (
        'NEW','ASSIGNED','UNDER_REVIEW','INFO_REQUESTED','INFO_RECEIVED',
        'APPROVED','REJECTED','REFERRED_TO_L2','L2_UNDER_REVIEW','ESCALATED','CLOSED'
    )),
    CONSTRAINT chk_uw_risk_level CHECK (risk_level IN ('HIGH','VERY_HIGH'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_uw_state_assignee ON uw_cases (current_state, assigned_to_user_id);
CREATE INDEX idx_uw_sla ON uw_cases (sla_due_at, current_state, sla_breached);
CREATE INDEX idx_uw_policy_id ON uw_cases (policy_id);
CREATE INDEX idx_uw_risk_level ON uw_cases (risk_level, current_state);

-- =============================================================================
-- uw_case_history
-- Immutable audit of all state transitions on a UW case.
-- Every action by every underwriter is recorded here with comments.
-- Displayed in UI-021 Audit Trail.
-- =============================================================================
CREATE TABLE uw_case_history (
    id              VARCHAR(36)     NOT NULL,
    case_id         VARCHAR(36)     NOT NULL,
    from_state      VARCHAR(30)     NULL,
    to_state        VARCHAR(30)     NOT NULL,
    trigger_event   VARCHAR(100)    NOT NULL,
    actor_user_id   VARCHAR(36)     NULL,
    actor_username  VARCHAR(50)     NULL,
    actor_role      VARCHAR(50)     NULL,
    comments        TEXT            NULL,
    transitioned_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_uw_case_history PRIMARY KEY (id),
    CONSTRAINT fk_uch_case FOREIGN KEY (case_id) REFERENCES uw_cases (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_uch_case_id ON uw_case_history (case_id, transitioned_at);

-- =============================================================================
-- uw_notes
-- Underwriter notes attached to a case. note_type categorizes the note
-- for display filtering in the case detail view.
-- Mandatory comment rule enforced at service layer on every UW action.
-- =============================================================================
CREATE TABLE uw_notes (
    id          VARCHAR(36)     NOT NULL,
    case_id     VARCHAR(36)     NOT NULL,
    note_type   VARCHAR(30)     NOT NULL,
                                -- REVIEW_NOTE | INFO_REQUEST | INFO_RESPONSE
                                -- DECISION_NOTE | ESCALATION_NOTE
    note_text   TEXT            NOT NULL,
    created_by  VARCHAR(36)     NOT NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_uw_notes PRIMARY KEY (id),
    CONSTRAINT chk_note_type CHECK (note_type IN (
        'REVIEW_NOTE','INFO_REQUEST','INFO_RESPONSE','DECISION_NOTE','ESCALATION_NOTE'
    )),
    CONSTRAINT fk_un_case FOREIGN KEY (case_id) REFERENCES uw_cases (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_un_case_id ON uw_notes (case_id, created_at);

-- =============================================================================
-- uw_info_requests
-- Tracks requests for additional information sent to the customer.
-- Multiple info requests can exist per case (e.g., serial requests).
-- Case state transitions to INFO_REQUESTED when created,
-- and to INFO_RECEIVED when response_received_at is set.
-- =============================================================================
CREATE TABLE uw_info_requests (
    id                      VARCHAR(36)     NOT NULL,
    case_id                 VARCHAR(36)     NOT NULL,
    requested_by            VARCHAR(36)     NOT NULL,
    requested_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    request_details         TEXT            NOT NULL,
    response_received_at    DATETIME        NULL,
    response_details        TEXT            NULL,
    response_submitted_by   VARCHAR(36)     NULL,
    status                  VARCHAR(15)     NOT NULL DEFAULT 'PENDING',
                                            -- PENDING | RESPONDED | WAIVED

    CONSTRAINT pk_uw_info_requests PRIMARY KEY (id),
    CONSTRAINT chk_uir_status CHECK (status IN ('PENDING','RESPONDED','WAIVED')),
    CONSTRAINT fk_uir_case FOREIGN KEY (case_id) REFERENCES uw_cases (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_uir_case_id ON uw_info_requests (case_id, status);

-- =============================================================================
-- uw_escalations
-- Records escalation events: either manual L1→L2 referral or SLA breach.
-- Multiple escalations can exist per case if SLA is repeatedly breached.
-- =============================================================================
CREATE TABLE uw_escalations (
    id                      VARCHAR(36)     NOT NULL,
    case_id                 VARCHAR(36)     NOT NULL,
    escalation_type         VARCHAR(20)     NOT NULL,
                                            -- MANUAL_REFERRAL | SLA_BREACH
    escalated_by            VARCHAR(36)     NULL,
    escalated_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    escalation_reason       TEXT            NULL,
    assigned_to_l2_user_id  VARCHAR(36)     NULL,
    resolved_by             VARCHAR(36)     NULL,
    resolved_at             DATETIME        NULL,

    CONSTRAINT pk_uw_escalations PRIMARY KEY (id),
    CONSTRAINT chk_ue_type CHECK (escalation_type IN ('MANUAL_REFERRAL','SLA_BREACH')),
    CONSTRAINT fk_ue_case FOREIGN KEY (case_id) REFERENCES uw_cases (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_ue_case_id ON uw_escalations (case_id);

-- =============================================================================
-- uw_sla_config
-- Admin-configurable SLA thresholds per risk level and UW level.
-- Used by:
--   1. uw_cases creation (sets sla_due_at = NOW() + sla_hours)
--   2. @Scheduled SLA monitor (queries overdue cases)
-- =============================================================================
CREATE TABLE uw_sla_config (
    id                          VARCHAR(36)     NOT NULL,
    risk_level                  VARCHAR(12)     NOT NULL,
                                                -- HIGH | VERY_HIGH
    uw_level                    TINYINT         NOT NULL,
                                                -- 1 | 2
    sla_hours                   INT             NOT NULL,
    escalation_notify_roles     VARCHAR(300)    NULL,
                                                -- comma-separated roles notified on SLA breach
    is_active                   TINYINT(1)      NOT NULL DEFAULT 1,
    updated_by                  VARCHAR(36)     NULL,
    updated_at                  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_uw_sla_config PRIMARY KEY (id),
    CONSTRAINT uq_sla_risk_level UNIQUE (risk_level, uw_level),
    CONSTRAINT chk_sla_risk_level CHECK (risk_level IN ('HIGH','VERY_HIGH')),
    CONSTRAINT chk_sla_uw_level CHECK (uw_level IN (1, 2))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
