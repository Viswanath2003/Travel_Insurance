-- =============================================================================
-- V06__underwriting_schema.sql
-- Schema: ins_uw
-- Service: underwriting-service
-- Description: Underwriting case management with single ROLE_UNDERWRITER
--              (PENDING_UW_L1 / PENDING_UW_L2 collapsed to PENDING_UW).
--              "Forward" language replaces "escalate" throughout.
--
-- DESIGN (25-table target — 2 tables here):
--   + uw_cases   — one case per policy requiring underwriter review
--   + uw_events  — append-only event log (replaces uw_case_history + uw_notes)
--
-- Removed vs previous schema:
--   - uw_case_history    → uw_events (event_type='STATUS_CHANGED')
--   - uw_notes           → uw_events (event_type='NOTE')
--   - uw_documents       → field_investigations.evidence_docs JSONB (V08)
-- =============================================================================

SET search_path = ins_uw, public;

-- =============================================================================
-- uw_cases
-- Created when a policy is forwarded to underwriting (risk_score > threshold).
-- One active case per policy (unique on policy_id).
-- decision vocabulary: APPROVED | REJECTED | FORWARDED_TO_FIELD
--   ("escalate" replaced with "forward" throughout)
-- =============================================================================
CREATE TABLE ins_uw.uw_cases (
    id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
    case_reference      VARCHAR(30)     NOT NULL,
    policy_id           UUID            NOT NULL,
    policy_number       VARCHAR(30)     NOT NULL,
                        -- Denormalized for display without join
    customer_id         UUID            NOT NULL,
    risk_score          NUMERIC(5,2)    NULL,
    risk_level          VARCHAR(12)     NULL,
                        -- LOW | MEDIUM | HIGH | VERY_HIGH (internal — not shown to customer)
    forward_reason      TEXT            NULL,
                        -- Why policy was forwarded to UW review
    status              VARCHAR(30)     NOT NULL DEFAULT 'OPEN',
                        -- OPEN | IN_REVIEW | APPROVED | REJECTED
                        -- FORWARDED_TO_FIELD | CLOSED
    assigned_to         UUID            NULL,
                        -- ins_auth.users.id of assigned underwriter
    assigned_at         TIMESTAMPTZ     NULL,
    decision            VARCHAR(30)     NULL,
                        -- APPROVED | REJECTED | FORWARDED_TO_FIELD
    decision_reason     TEXT            NULL,
    decided_at          TIMESTAMPTZ     NULL,
    decided_by          UUID            NULL,
    sla_due_at          TIMESTAMPTZ     NULL,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_uw_cases PRIMARY KEY (id),
    CONSTRAINT uq_uw_case_reference UNIQUE (case_reference),
    CONSTRAINT uq_uw_policy UNIQUE (policy_id),
    CONSTRAINT chk_uw_status CHECK (status IN (
        'OPEN','IN_REVIEW','APPROVED','REJECTED','FORWARDED_TO_FIELD','CLOSED'
    )),
    CONSTRAINT chk_uw_decision CHECK (
        decision IN ('APPROVED','REJECTED','FORWARDED_TO_FIELD') OR decision IS NULL
    ),
    CONSTRAINT chk_uw_risk_level CHECK (
        risk_level IN ('LOW','MEDIUM','HIGH','VERY_HIGH') OR risk_level IS NULL
    )
);

CREATE INDEX idx_uw_cases_status   ON ins_uw.uw_cases (status);
CREATE INDEX idx_uw_cases_assigned ON ins_uw.uw_cases (assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_uw_cases_customer ON ins_uw.uw_cases (customer_id);
CREATE INDEX idx_uw_cases_open_sla ON ins_uw.uw_cases (sla_due_at) WHERE status IN ('OPEN','IN_REVIEW');

CREATE TRIGGER trg_uw_cases_updated_at
    BEFORE UPDATE ON ins_uw.uw_cases
    FOR EACH ROW EXECUTE FUNCTION ins_common.set_updated_at();

-- =============================================================================
-- uw_events
-- Append-only log of all activity on a UW case.
-- Replaces uw_case_history (status transitions) and uw_notes (free text).
-- event_type discriminates activity; event_data holds type-specific payload.
--
-- event_type values and their event_data shape:
--   STATUS_CHANGED → {from: "OPEN", to: "IN_REVIEW"}
--   NOTE           → {note: "Checked passport validity..."}
--   DOCUMENT_REQ   → {documents: ["Passport copy", "Medical certificate"]}
--   DECISION       → {decision: "APPROVED", reason: "All docs verified"}
--   FORWARDED      → {field_officer_id: UUID, reason: "Physical visit needed"}
--   ASSIGNED       → {assigned_to_id: UUID, assigned_to_name: "..."}
-- =============================================================================
CREATE TABLE ins_uw.uw_events (
    id              BIGINT          GENERATED ALWAYS AS IDENTITY,
    case_id         UUID            NOT NULL,
    event_type      VARCHAR(20)     NOT NULL,
                    -- STATUS_CHANGED | NOTE | DOCUMENT_REQ
                    -- DECISION | FORWARDED | ASSIGNED
    from_status     VARCHAR(30)     NULL,
    to_status       VARCHAR(30)     NULL,
    event_data      JSONB           NULL,
    performed_by    UUID            NULL,
    performed_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_uw_events PRIMARY KEY (id),
    CONSTRAINT fk_uw_events_case FOREIGN KEY (case_id)
        REFERENCES ins_uw.uw_cases (id),
    CONSTRAINT chk_uw_event_type CHECK (event_type IN (
        'STATUS_CHANGED','NOTE','DOCUMENT_REQ','DECISION','FORWARDED','ASSIGNED'
    ))
);

CREATE INDEX idx_uw_events_case ON ins_uw.uw_events (case_id, performed_at DESC);
CREATE INDEX idx_uw_events_type ON ins_uw.uw_events (event_type);
