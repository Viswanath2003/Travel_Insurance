-- =============================================================================
-- V10__audit_tables.sql
-- Schema: ins_audit
-- Service: audit-service
-- Description: Immutable append-only audit log.
--              CRITICAL: DB user ins_audit_svc has INSERT+SELECT only.
--              No UPDATE, DELETE, DROP, ALTER privileges granted.
--              Table has NO updated_at, NO deleted_at, NO is_active columns.
-- =============================================================================

USE ins_audit;

-- =============================================================================
-- audit_logs
-- The central immutable audit trail for the entire platform.
--
-- Design decisions:
--   - BIGINT AUTO_INCREMENT PK for performance on high-volume inserts
--   - audit_id VARCHAR(36) for external reference by other services
--   - occurred_at DATETIME(6) for microsecond-precision ordering
--   - old_state + new_state as JSON for flexible entity representation
--   - actor_user_id = NULL for SYSTEM-triggered events (SLA breach, expiry, etc.)
--   - correlation_id from X-Correlation-ID header for request tracing
--
-- What is NEVER stored here:
--   - Passwords, OTP values, raw JWT tokens
--   - Full document content (only references)
--   - PII in old_state/new_state beyond what is necessary for audit
-- =============================================================================
CREATE TABLE audit_logs (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    audit_id        VARCHAR(36)     NOT NULL,
    correlation_id  VARCHAR(36)     NULL,
    event_type      VARCHAR(100)    NOT NULL,
                                    -- LOGIN | LOGIN_FAILED | LOGOUT | ACCOUNT_LOCKED
                                    -- PASSWORD_RESET | ROLE_ASSIGNED | ROLE_REMOVED
                                    -- QUOTE_CREATED | QUOTE_EXPIRED
                                    -- POLICY_CREATED | POLICY_ACTIVATED | POLICY_CANCELLED | POLICY_REJECTED
                                    -- UW_CASE_CREATED | UW_ASSIGNED | UW_APPROVED | UW_DECLINED
                                    -- UW_REFERRED | UW_ESCALATED | UW_SLA_BREACHED
                                    -- CLAIM_SUBMITTED | CLAIM_REVIEWED | CLAIM_DECIDED | CLAIM_SETTLED
                                    -- FIELD_ASSIGNED | FIELD_REPORT_SUBMITTED
                                    -- PLAN_PUBLISHED | RULE_PUBLISHED | TEMPLATE_PUBLISHED
                                    -- RBAC_CHANGED | USER_DEACTIVATED | USER_ACTIVATED
                                    -- DOCUMENT_GENERATED | DOCUMENT_DOWNLOADED
                                    -- PERMISSION_DENIED
    entity_type     VARCHAR(50)     NOT NULL,
                                    -- USER | ROLE | POLICY | QUOTE | CLAIM | UW_CASE
                                    -- FIELD_ASSIGNMENT | PLAN | RULE | DOCUMENT | TEMPLATE
    entity_id       VARCHAR(50)     NOT NULL,
    actor_user_id   VARCHAR(36)     NULL,
    actor_username  VARCHAR(50)     NULL,
    actor_role      VARCHAR(50)     NULL,
    actor_ip        VARCHAR(45)     NULL,
    old_state       JSON            NULL,
    new_state       JSON            NULL,
    details         TEXT            NULL,
    service_name    VARCHAR(50)     NOT NULL,
    occurred_at     DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_audit_logs PRIMARY KEY (id),
    CONSTRAINT uq_audit_id UNIQUE (audit_id)
    -- NO updated_at — immutable
    -- NO deleted_at — records are never deleted
    -- NO is_active — records are never deactivated
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_al_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_al_actor ON audit_logs (actor_user_id);
CREATE INDEX idx_al_occurred ON audit_logs (occurred_at);
CREATE INDEX idx_al_event_type ON audit_logs (event_type);
CREATE INDEX idx_al_correlation ON audit_logs (correlation_id);
CREATE INDEX idx_al_service ON audit_logs (service_name, occurred_at);
