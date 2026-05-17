-- =============================================================================
-- V08__field_schema.sql
-- Schema: ins_field
-- Service: field-service (co-located with claims-service in smaller deployments)
-- Description: Field investigation management — assignment, report, and evidence
--              in a single unified table. Claims Officer creates the investigation;
--              Field Officer submits findings and uploads evidence.
--
-- DESIGN (25-table target — 1 table here):
--   + field_investigations — unified: assignment + report + evidence JSONB
--
-- Removed vs previous schema:
--   - field_assignments         → columns in field_investigations
--   - field_reports             → columns in field_investigations
--   - field_evidence_documents  → evidence_docs JSONB array in field_investigations
--
-- evidence_docs JSONB shape:
--   [{document_type, document_name, storage_key, caption, mime_type,
--     file_size_bytes, uploaded_by, created_at}]
-- =============================================================================

SET search_path = ins_field, public;

-- =============================================================================
-- field_investigations
-- One row per field investigation. Created by Claims Officer; completed by
-- Field Officer. Report fields (findings, inspection_date, etc.) start NULL
-- and are populated when the Field Officer submits their report.
-- evidence_docs: JSONB array of uploaded photos and supporting documents;
--   treated as a non-queryable attachment list for the investigation.
-- =============================================================================
CREATE TABLE ins_field.field_investigations (
    id                          UUID            NOT NULL DEFAULT gen_random_uuid(),
    investigation_reference     VARCHAR(30)     NOT NULL,
                                -- e.g. FI20250520001
    claim_id                    UUID            NOT NULL,
    claim_reference             VARCHAR(30)     NOT NULL,
                                -- Denormalized for display without join
    assigned_officer_id         UUID            NOT NULL,
    assigned_officer_name       VARCHAR(120)    NULL,
    assigned_by                 UUID            NOT NULL,
                                -- Claims officer who created the investigation
    status                      VARCHAR(30)     NOT NULL DEFAULT 'ASSIGNED',
                                -- ASSIGNED | IN_PROGRESS | REPORT_SUBMITTED
                                -- COMPLETED | CANCELLED
    priority                    VARCHAR(10)     NOT NULL DEFAULT 'MEDIUM',
                                -- LOW | MEDIUM | HIGH
    investigation_type          VARCHAR(60)     NULL,
                                -- MEDICAL_VERIFICATION | BAGGAGE_LOSS | PROPERTY_DAMAGE
                                -- ACCIDENT_VERIFICATION | OTHER
    investigation_location      VARCHAR(300)    NULL,
                                -- Physical address / location to visit
    notes_for_officer           TEXT            NULL,
    due_at                      TIMESTAMPTZ     NOT NULL,
    sla_breached                BOOLEAN         NOT NULL DEFAULT FALSE,

    -- Report fields (populated by Field Officer on submission) --
    inspection_date             DATE            NULL,
    location_visited            VARCHAR(300)    NULL,
    claimant_present            BOOLEAN         NULL,
    findings                    TEXT            NULL,
    recommendation              VARCHAR(40)     NULL,
                                -- APPROVE | PARTIAL_APPROVE | REJECT
                                -- FURTHER_INVESTIGATION_NEEDED
    recommendation_notes        TEXT            NULL,
    report_submitted_at         TIMESTAMPTZ     NULL,

    -- Review fields (populated by Claims Officer after report submission) --
    review_outcome              VARCHAR(20)     NULL,
                                -- ACCEPTED | REJECTED | NEEDS_REWORK
    reviewed_by                 UUID            NULL,
    reviewed_at                 TIMESTAMPTZ     NULL,

    -- Evidence docs (uploaded by Field Officer during investigation) --
    evidence_docs               JSONB           NOT NULL DEFAULT '[]',
                                -- [{document_type, document_name, storage_key,
                                --   caption, mime_type, file_size_bytes,
                                --   uploaded_by, created_at}]

    created_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_field_investigations PRIMARY KEY (id),
    CONSTRAINT uq_fi_reference UNIQUE (investigation_reference),
    CONSTRAINT chk_fi_status CHECK (status IN (
        'ASSIGNED','IN_PROGRESS','REPORT_SUBMITTED','COMPLETED','CANCELLED'
    )),
    CONSTRAINT chk_fi_priority CHECK (priority IN ('LOW','MEDIUM','HIGH')),
    CONSTRAINT chk_fi_recommendation CHECK (
        recommendation IN ('APPROVE','PARTIAL_APPROVE','REJECT','FURTHER_INVESTIGATION_NEEDED')
        OR recommendation IS NULL
    ),
    CONSTRAINT chk_fi_review_outcome CHECK (
        review_outcome IN ('ACCEPTED','REJECTED','NEEDS_REWORK') OR review_outcome IS NULL
    )
);

CREATE INDEX idx_fi_claim     ON ins_field.field_investigations (claim_id);
CREATE INDEX idx_fi_officer   ON ins_field.field_investigations (assigned_officer_id);
CREATE INDEX idx_fi_status    ON ins_field.field_investigations (status);
CREATE INDEX idx_fi_due       ON ins_field.field_investigations (due_at)
    WHERE status NOT IN ('COMPLETED','CANCELLED');

CREATE TRIGGER trg_field_investigations_updated_at
    BEFORE UPDATE ON ins_field.field_investigations
    FOR EACH ROW EXECUTE FUNCTION ins_common.set_updated_at();
