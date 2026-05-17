-- =============================================================================
-- V11__audit_schema.sql
-- Schema: ins_audit
-- Service: audit-service
-- Description: Immutable audit log for all platform actions.
--              The ins_audit_role has INSERT + SELECT only — no UPDATE/DELETE.
--              No triggers or updated_at column (intentionally append-only).
--
-- DESIGN (25-table target — 1 table here):
--   + audit_logs — unchanged design; action codes updated to reflect single UW,
--                  forward language (no "escalate"), and removal of admin actions.
--
-- Design decisions (unchanged from previous version):
--   + id: BIGINT GENERATED ALWAYS AS IDENTITY — sequential ordering for strict
--     temporal order without index fragmentation on a high-write table.
--   + No foreign keys — audit service writes across domain boundaries.
--   + new_values / old_values: JSONB — schema-independent change capture.
--   + request_id: distributed trace ID for cross-service correlation.
--   + RLS policy: belt-and-suspenders defence against UPDATE/DELETE.
-- =============================================================================

SET search_path = ins_audit, public;

CREATE TABLE ins_audit.audit_logs (
    id                  BIGINT          GENERATED ALWAYS AS IDENTITY,
    event_time          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    request_id          VARCHAR(64)     NULL,
                        -- Distributed trace/correlation ID
    service_name        VARCHAR(60)     NOT NULL,
                        -- auth-service | policy-service | claims-service
                        -- underwriting-service | field-service | document-service
                        -- notification-service | rule-engine-service
    action              VARCHAR(80)     NOT NULL,
                        -- USER_LOGIN | USER_LOGOUT | USER_CREATED | PASSWORD_CHANGED
                        -- POLICY_CREATED | POLICY_STATUS_CHANGED | POLICY_FORWARDED
                        -- POLICY_APPROVED | POLICY_REJECTED | POLICY_CANCELLED
                        -- CLAIM_SUBMITTED | CLAIM_APPROVED | CLAIM_SETTLED | CLAIM_DECLINED
                        -- UW_CASE_OPENED | UW_DECISION | UW_FORWARDED_TO_FIELD
                        -- FIELD_ASSIGNED | FIELD_REPORT_SUBMITTED
                        -- PAYMENT_PROCESSED | COMMISSION_PAID
                        -- RULE_PUBLISHED | PLAN_PUBLISHED | PRODUCT_ACTIVATED
                        -- PROFILE_UPDATE_REQUESTED | PROFILE_UPDATE_APPROVED
                        -- NOTIFICATION_SENT | DOCUMENT_GENERATED
                        -- RULE_EVALUATED  (replaces rule_execution_logs)
    actor_user_id       UUID            NULL,
    actor_username      VARCHAR(100)    NULL,
    actor_role          VARCHAR(60)     NULL,
    actor_ip            INET            NULL,
    entity_type         VARCHAR(60)     NULL,
                        -- USER | POLICY | CLAIM | UW_CASE | FIELD_INVESTIGATION
                        -- RULE | PAYMENT | PLAN | PRODUCT | DOCUMENT
    entity_id           VARCHAR(36)     NULL,
                        -- VARCHAR (not UUID): allows non-UUID legacy IDs
    entity_reference    VARCHAR(60)     NULL,
                        -- Human-readable: policy number, claim reference, etc.
    old_values          JSONB           NULL,
                        -- State before change (UPDATE/DELETE events)
    new_values          JSONB           NULL,
                        -- State after change (INSERT/UPDATE events)
    result              VARCHAR(10)     NOT NULL DEFAULT 'SUCCESS',
                        -- SUCCESS | FAILURE | PARTIAL
    failure_reason      TEXT            NULL,
    metadata            JSONB           NULL,
                        -- Additional context: HTTP method, endpoint, user-agent

    CONSTRAINT pk_audit_logs PRIMARY KEY (id),
    CONSTRAINT chk_audit_result CHECK (result IN ('SUCCESS','FAILURE','PARTIAL'))
);

-- Partial indexes for common query patterns
CREATE INDEX idx_audit_actor_user  ON ins_audit.audit_logs (actor_user_id)
    WHERE actor_user_id IS NOT NULL;
CREATE INDEX idx_audit_entity      ON ins_audit.audit_logs (entity_type, entity_id)
    WHERE entity_id IS NOT NULL;
CREATE INDEX idx_audit_action      ON ins_audit.audit_logs (action);
CREATE INDEX idx_audit_event_time  ON ins_audit.audit_logs (event_time DESC);
CREATE INDEX idx_audit_service     ON ins_audit.audit_logs (service_name);
CREATE INDEX idx_audit_request_id  ON ins_audit.audit_logs (request_id)
    WHERE request_id IS NOT NULL;

-- =============================================================================
-- Row-level security: prevent even the service role from deleting rows.
-- Only superuser can bypass RLS.
-- =============================================================================
ALTER TABLE ins_audit.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_insert_only ON ins_audit.audit_logs
    AS RESTRICTIVE
    FOR ALL
    TO ins_audit_role
    USING (TRUE)
    WITH CHECK (TRUE);
