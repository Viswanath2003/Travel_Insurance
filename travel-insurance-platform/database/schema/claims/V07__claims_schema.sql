-- =============================================================================
-- V07__claims_schema.sql
-- Schema: ins_claims
-- Service: claims-service
-- Description: Full claims lifecycle — submission through settlement/closure.
--              Claims officer reviews; field officer investigates if required.
--
-- DESIGN (25-table target — 3 tables here):
--   + claims         — core claim; claimant_info JSONB for involved travelers;
--                      claim_type_code inline (replaces claim_types table)
--   + claim_documents — documents uploaded against a claim
--   + claim_events   — append-only event log (replaces claim_workflow_history,
--                       claim_adjuster_notes, claim_decisions, claim_payments)
--
-- Removed vs previous schema:
--   - claim_types              → claim_type_code enum string in claims
--   - claim_travelers          → claims.claimant_info JSONB
--   - claim_doc_checklist_config → platform_configurations (V12)
--   - claim_checklist_status   → claim_documents.checklist_status JSONB
--   - claim_workflow_history   → claim_events (event_type='STATUS_CHANGED')
--   - claim_decisions          → claim_events (event_type='DECISION')
--   - claim_adjuster_notes     → claim_events (event_type='NOTE')
--   - claim_payments           → claim_events (event_type='PAYMENT')
--   - claim_snapshots          → audit_logs (V11)
--   - claim_sla_config         → platform_configurations (V12)
-- =============================================================================

SET search_path = ins_claims, public;

-- =============================================================================
-- claims
-- Core claim record. One row per claim submission.
-- claim_type_code: replaces FK to claim_types; checked against known types.
-- claimant_info: JSONB list of travelers involved in the incident.
--   [{traveler_name, age_group, is_primary_claimant}]
-- policy_snapshot_id: UUID ref to ins_policy.policy_snapshots — coverage terms
--   always read from snapshot, never from live policy.
-- approved_amount / payment_reference: populated when Finance processes payout.
-- is_high_value: TRUE when claimed_amount > threshold in platform_configurations.
-- =============================================================================
CREATE TABLE ins_claims.claims (
    id                          UUID            NOT NULL DEFAULT gen_random_uuid(),
    claim_reference             VARCHAR(30)     NOT NULL,
    policy_id                   UUID            NOT NULL,
    policy_number               VARCHAR(30)     NOT NULL,
                                -- Denormalized for display without join
    policy_snapshot_id          UUID            NOT NULL,
                                -- Ref to ins_policy.policy_snapshots (no FK — cross-schema)
    customer_id                 UUID            NOT NULL,
    claim_type_code             VARCHAR(80)     NOT NULL,
                                -- MEDICAL | BAGGAGE_LOSS | TRIP_CANCELLATION
                                -- FLIGHT_DELAY | PERSONAL_LIABILITY | PASSPORT_LOSS
                                -- EMERGENCY_EVACUATION | DENTAL | ACCIDENTAL_DEATH | OTHER
    status                      VARCHAR(40)     NOT NULL DEFAULT 'SUBMITTED',
                                -- SUBMITTED | DOCUMENT_REVIEW | DOCUMENT_PENDING
                                -- UNDER_REVIEW | INVESTIGATION_ASSIGNED
                                -- INVESTIGATION_COMPLETE | DECISION_PENDING
                                -- AUTO_APPROVED | AUTO_DECLINED
                                -- APPROVED | PARTIALLY_APPROVED | DECLINED
                                -- PAYMENT_PENDING | SETTLED | CLOSED
    incident_date               DATE            NOT NULL,
    incident_description        TEXT            NULL,
    claimed_amount              NUMERIC(12,2)   NOT NULL,
    approved_amount             NUMERIC(12,2)   NULL,
    currency                    CHAR(3)         NOT NULL DEFAULT 'INR',
    claimant_info               JSONB           NULL,
                                -- [{traveler_name, age_group, is_primary_claimant}]
    assigned_officer_id         UUID            NULL,
                                -- Claims officer assigned to this claim
    sla_due_at                  TIMESTAMPTZ     NULL,
    sla_breached                BOOLEAN         NOT NULL DEFAULT FALSE,
    decision_reason             TEXT            NULL,
    decided_at                  TIMESTAMPTZ     NULL,
    decided_by                  UUID            NULL,
    payment_reference           VARCHAR(60)     NULL,
    payment_method              VARCHAR(30)     NULL,
    paid_at                     TIMESTAMPTZ     NULL,
    is_high_value               BOOLEAN         NOT NULL DEFAULT FALSE,
    field_investigation_required BOOLEAN        NOT NULL DEFAULT FALSE,
    priority                    VARCHAR(10)     NOT NULL DEFAULT 'MEDIUM',
                                -- LOW | MEDIUM | HIGH | CRITICAL
    metadata                    JSONB           NULL,
                                -- Extensible context: destination, payment method, etc.
    created_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    version                     BIGINT          NOT NULL DEFAULT 0,

    CONSTRAINT pk_claims PRIMARY KEY (id),
    CONSTRAINT uq_claims_reference UNIQUE (claim_reference),
    CONSTRAINT chk_claims_status CHECK (status IN (
        'SUBMITTED','DOCUMENT_REVIEW','DOCUMENT_PENDING','UNDER_REVIEW',
        'INVESTIGATION_ASSIGNED','INVESTIGATION_COMPLETE','DECISION_PENDING',
        'AUTO_APPROVED','AUTO_DECLINED','APPROVED','PARTIALLY_APPROVED',
        'DECLINED','PAYMENT_PENDING','SETTLED','CLOSED'
    )),
    CONSTRAINT chk_claims_type CHECK (claim_type_code IN (
        'MEDICAL','BAGGAGE_LOSS','TRIP_CANCELLATION','FLIGHT_DELAY',
        'PERSONAL_LIABILITY','PASSPORT_LOSS','EMERGENCY_EVACUATION',
        'DENTAL','ACCIDENTAL_DEATH','OTHER'
    )),
    CONSTRAINT chk_claims_priority CHECK (priority IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    CONSTRAINT chk_claims_amounts CHECK (
        claimed_amount > 0 AND (approved_amount IS NULL OR approved_amount >= 0)
    )
);

CREATE INDEX idx_claims_policy_id   ON ins_claims.claims (policy_id);
CREATE INDEX idx_claims_customer_id ON ins_claims.claims (customer_id, status);
CREATE INDEX idx_claims_status      ON ins_claims.claims (status);
CREATE INDEX idx_claims_officer     ON ins_claims.claims (assigned_officer_id) WHERE assigned_officer_id IS NOT NULL;
CREATE INDEX idx_claims_high_value  ON ins_claims.claims (is_high_value) WHERE is_high_value = TRUE;
CREATE INDEX idx_claims_sla         ON ins_claims.claims (sla_due_at)
    WHERE status NOT IN ('SETTLED','CLOSED','DECLINED','AUTO_DECLINED');

CREATE TRIGGER trg_claims_updated_at
    BEFORE UPDATE ON ins_claims.claims
    FOR EACH ROW EXECUTE FUNCTION ins_common.set_updated_at();

-- =============================================================================
-- claim_documents
-- Documents uploaded against a claim (hospital bills, receipts, ID proofs, etc.).
-- document_type_code: standard codes defined in platform_configurations.
-- =============================================================================
CREATE TABLE ins_claims.claim_documents (
    id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
    claim_id            UUID            NOT NULL,
    document_type_code  VARCHAR(60)     NOT NULL,
                        -- HOSPITAL_BILL | POLICE_FIR | BOARDING_PASS | PASSPORT_COPY | etc.
    document_name       VARCHAR(200)    NOT NULL,
    storage_key         VARCHAR(500)    NOT NULL,
                        -- S3/MinIO object key
    file_size_bytes     BIGINT          NULL,
    mime_type           VARCHAR(100)    NULL,
    uploaded_by         UUID            NOT NULL,
    is_verified         BOOLEAN         NOT NULL DEFAULT FALSE,
    verified_by         UUID            NULL,
    verified_at         TIMESTAMPTZ     NULL,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_claim_documents PRIMARY KEY (id),
    CONSTRAINT fk_claim_docs_claim FOREIGN KEY (claim_id)
        REFERENCES ins_claims.claims (id) ON DELETE CASCADE
);

CREATE INDEX idx_claim_docs_claim    ON ins_claims.claim_documents (claim_id);
CREATE INDEX idx_claim_docs_verified ON ins_claims.claim_documents (claim_id, is_verified);

-- =============================================================================
-- claim_events
-- Append-only event log for all claim lifecycle activity.
-- Replaces: claim_workflow_history, claim_adjuster_notes,
--           claim_decisions, claim_payments.
--
-- event_type and their event_data shape:
--   STATUS_CHANGED  → {from, to}
--   NOTE            → {note: "...", is_internal: true}
--   DECISION        → {decision: APPROVED|PARTIALLY_APPROVED|DECLINED,
--                       amount: 50000, reason: "..."}
--   PAYMENT         → {amount: 50000, payment_reference: "PAY...",
--                       method: "BANK_TRANSFER", bank_masked: "****1234"}
--   DOCUMENT_REVIEW → {doc_id: UUID, action: VERIFIED|REJECTED, note: "..."}
--   FIELD_FORWARDED → {field_investigation_id: UUID, reason: "..."}
--   ASSIGNED        → {officer_id: UUID, officer_name: "..."}
-- =============================================================================
CREATE TABLE ins_claims.claim_events (
    id              BIGINT          GENERATED ALWAYS AS IDENTITY,
    claim_id        UUID            NOT NULL,
    event_type      VARCHAR(20)     NOT NULL,
                    -- STATUS_CHANGED | NOTE | DECISION | PAYMENT
                    -- DOCUMENT_REVIEW | FIELD_FORWARDED | ASSIGNED
    from_status     VARCHAR(40)     NULL,
    to_status       VARCHAR(40)     NULL,
    event_data      JSONB           NULL,
    performed_by    UUID            NULL,
    performed_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_claim_events PRIMARY KEY (id),
    CONSTRAINT fk_claim_events_claim FOREIGN KEY (claim_id)
        REFERENCES ins_claims.claims (id),
    CONSTRAINT chk_claim_event_type CHECK (event_type IN (
        'STATUS_CHANGED','NOTE','DECISION','PAYMENT',
        'DOCUMENT_REVIEW','FIELD_FORWARDED','ASSIGNED'
    ))
);

CREATE INDEX idx_claim_events_claim ON ins_claims.claim_events (claim_id, performed_at DESC);
CREATE INDEX idx_claim_events_type  ON ins_claims.claim_events (event_type);
