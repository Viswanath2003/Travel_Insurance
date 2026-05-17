-- =============================================================================
-- V00__init_postgresql.sql
-- PostgreSQL initialization for Travel Insurance Platform
-- Single database: ins_travelinsurance
-- 11 domain schemas + 1 shared common schema
--
-- Run as PostgreSQL superuser (postgres) before Flyway migrations.
-- Flyway itself connects as ins_flyway_role (DDL-capable service account).
--
-- Architecture: One PostgreSQL database, 11 schemas, one role per service.
-- Cross-service data access is via REST API, never via direct DB join.
-- =============================================================================

-- =============================================================================
-- EXTENSIONS (must be run as superuser)
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";     -- gen_random_uuid(), pgp_sym_encrypt
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";  -- query performance monitoring

-- =============================================================================
-- SCHEMAS
-- Each schema is owned by its service role (set after role creation).
-- =============================================================================
CREATE SCHEMA IF NOT EXISTS ins_common;         -- Shared functions and utilities
CREATE SCHEMA IF NOT EXISTS ins_auth;           -- Authentication & authorization
CREATE SCHEMA IF NOT EXISTS ins_product;        -- Product catalog & configuration
CREATE SCHEMA IF NOT EXISTS ins_rule;           -- Rule engine
CREATE SCHEMA IF NOT EXISTS ins_policy;         -- Quote & policy lifecycle
CREATE SCHEMA IF NOT EXISTS ins_underwriting;   -- Underwriting workflow
CREATE SCHEMA IF NOT EXISTS ins_claims;         -- Claims lifecycle
CREATE SCHEMA IF NOT EXISTS ins_field;          -- Field investigation
CREATE SCHEMA IF NOT EXISTS ins_document;       -- Document templates & generation
CREATE SCHEMA IF NOT EXISTS ins_notification;   -- Notification system
CREATE SCHEMA IF NOT EXISTS ins_audit;          -- Immutable audit log
CREATE SCHEMA IF NOT EXISTS ins_workflow;       -- Workflow definitions & platform config

-- =============================================================================
-- ROLES (NOLOGIN — principle of least privilege)
-- Applications connect with login roles that inherit from these NOLOGIN roles.
-- This separation allows role reassignment without changing connection strings.
-- =============================================================================

-- Common / shared role
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ins_common_role') THEN
        CREATE ROLE ins_common_role NOLOGIN;
    END IF;
END$$;

-- Auth service role
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ins_auth_role') THEN
        CREATE ROLE ins_auth_role NOLOGIN;
    END IF;
END$$;

-- Product service role
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ins_product_role') THEN
        CREATE ROLE ins_product_role NOLOGIN;
    END IF;
END$$;

-- Rule engine service role
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ins_rule_role') THEN
        CREATE ROLE ins_rule_role NOLOGIN;
    END IF;
END$$;

-- Policy service role
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ins_policy_role') THEN
        CREATE ROLE ins_policy_role NOLOGIN;
    END IF;
END$$;

-- Underwriting service role
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ins_uw_role') THEN
        CREATE ROLE ins_uw_role NOLOGIN;
    END IF;
END$$;

-- Claims service role
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ins_claims_role') THEN
        CREATE ROLE ins_claims_role NOLOGIN;
    END IF;
END$$;

-- Field service role
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ins_field_role') THEN
        CREATE ROLE ins_field_role NOLOGIN;
    END IF;
END$$;

-- Document service role
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ins_doc_role') THEN
        CREATE ROLE ins_doc_role NOLOGIN;
    END IF;
END$$;

-- Notification service role
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ins_notif_role') THEN
        CREATE ROLE ins_notif_role NOLOGIN;
    END IF;
END$$;

-- Audit service role — INSERT + SELECT only (immutability enforcement)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ins_audit_role') THEN
        CREATE ROLE ins_audit_role NOLOGIN;
    END IF;
END$$;

-- Workflow / shared infrastructure role
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ins_workflow_role') THEN
        CREATE ROLE ins_workflow_role NOLOGIN;
    END IF;
END$$;

-- Reporting role — SELECT only across all schemas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ins_report_role') THEN
        CREATE ROLE ins_report_role NOLOGIN;
    END IF;
END$$;

-- Flyway migration role — DDL capable, used by Flyway runner only
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ins_flyway_role') THEN
        CREATE ROLE ins_flyway_role NOLOGIN;
    END IF;
END$$;

-- =============================================================================
-- SERVICE LOGIN ACCOUNTS
-- In production: replace 'CHANGE_IN_PROD' with secrets-managed credentials
-- In local dev: use environment variables injected by Spring Boot
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ins_auth_svc') THEN
        CREATE ROLE ins_auth_svc LOGIN PASSWORD 'CHANGE_IN_PROD';
    END IF;
END$$;
GRANT ins_auth_role TO ins_auth_svc;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ins_product_svc') THEN
        CREATE ROLE ins_product_svc LOGIN PASSWORD 'CHANGE_IN_PROD';
    END IF;
END$$;
GRANT ins_product_role TO ins_product_svc;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ins_rule_svc') THEN
        CREATE ROLE ins_rule_svc LOGIN PASSWORD 'CHANGE_IN_PROD';
    END IF;
END$$;
GRANT ins_rule_role TO ins_rule_svc;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ins_policy_svc') THEN
        CREATE ROLE ins_policy_svc LOGIN PASSWORD 'CHANGE_IN_PROD';
    END IF;
END$$;
GRANT ins_policy_role TO ins_policy_svc;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ins_uw_svc') THEN
        CREATE ROLE ins_uw_svc LOGIN PASSWORD 'CHANGE_IN_PROD';
    END IF;
END$$;
GRANT ins_uw_role TO ins_uw_svc;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ins_claims_svc') THEN
        CREATE ROLE ins_claims_svc LOGIN PASSWORD 'CHANGE_IN_PROD';
    END IF;
END$$;
GRANT ins_claims_role TO ins_claims_svc;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ins_field_svc') THEN
        CREATE ROLE ins_field_svc LOGIN PASSWORD 'CHANGE_IN_PROD';
    END IF;
END$$;
GRANT ins_field_role TO ins_field_svc;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ins_doc_svc') THEN
        CREATE ROLE ins_doc_svc LOGIN PASSWORD 'CHANGE_IN_PROD';
    END IF;
END$$;
GRANT ins_doc_role TO ins_doc_svc;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ins_notif_svc') THEN
        CREATE ROLE ins_notif_svc LOGIN PASSWORD 'CHANGE_IN_PROD';
    END IF;
END$$;
GRANT ins_notif_role TO ins_notif_svc;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ins_audit_svc') THEN
        CREATE ROLE ins_audit_svc LOGIN PASSWORD 'CHANGE_IN_PROD';
    END IF;
END$$;
GRANT ins_audit_role TO ins_audit_svc;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ins_workflow_svc') THEN
        CREATE ROLE ins_workflow_svc LOGIN PASSWORD 'CHANGE_IN_PROD';
    END IF;
END$$;
GRANT ins_workflow_role TO ins_workflow_svc;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ins_report_svc') THEN
        CREATE ROLE ins_report_svc LOGIN PASSWORD 'CHANGE_IN_PROD';
    END IF;
END$$;
GRANT ins_report_role TO ins_report_svc;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ins_flyway_svc') THEN
        CREATE ROLE ins_flyway_svc LOGIN PASSWORD 'CHANGE_IN_PROD';
    END IF;
END$$;
GRANT ins_flyway_role TO ins_flyway_svc;

-- =============================================================================
-- SCHEMA OWNERSHIP
-- Each schema is owned by its service role so it can create tables within it.
-- =============================================================================
ALTER SCHEMA ins_common        OWNER TO ins_flyway_role;
ALTER SCHEMA ins_auth          OWNER TO ins_flyway_role;
ALTER SCHEMA ins_product       OWNER TO ins_flyway_role;
ALTER SCHEMA ins_rule          OWNER TO ins_flyway_role;
ALTER SCHEMA ins_policy        OWNER TO ins_flyway_role;
ALTER SCHEMA ins_underwriting  OWNER TO ins_flyway_role;
ALTER SCHEMA ins_claims        OWNER TO ins_flyway_role;
ALTER SCHEMA ins_field         OWNER TO ins_flyway_role;
ALTER SCHEMA ins_document      OWNER TO ins_flyway_role;
ALTER SCHEMA ins_notification  OWNER TO ins_flyway_role;
ALTER SCHEMA ins_audit         OWNER TO ins_flyway_role;
ALTER SCHEMA ins_workflow      OWNER TO ins_flyway_role;

-- Grant Flyway role USAGE + CREATE on all schemas
GRANT USAGE, CREATE ON SCHEMA ins_common        TO ins_flyway_role;
GRANT USAGE, CREATE ON SCHEMA ins_auth          TO ins_flyway_role;
GRANT USAGE, CREATE ON SCHEMA ins_product       TO ins_flyway_role;
GRANT USAGE, CREATE ON SCHEMA ins_rule          TO ins_flyway_role;
GRANT USAGE, CREATE ON SCHEMA ins_policy        TO ins_flyway_role;
GRANT USAGE, CREATE ON SCHEMA ins_underwriting  TO ins_flyway_role;
GRANT USAGE, CREATE ON SCHEMA ins_claims        TO ins_flyway_role;
GRANT USAGE, CREATE ON SCHEMA ins_field         TO ins_flyway_role;
GRANT USAGE, CREATE ON SCHEMA ins_document      TO ins_flyway_role;
GRANT USAGE, CREATE ON SCHEMA ins_notification  TO ins_flyway_role;
GRANT USAGE, CREATE ON SCHEMA ins_audit         TO ins_flyway_role;
GRANT USAGE, CREATE ON SCHEMA ins_workflow      TO ins_flyway_role;

-- =============================================================================
-- SCHEMA USAGE GRANTS (per service role)
-- =============================================================================
GRANT USAGE ON SCHEMA ins_common        TO ins_auth_role, ins_product_role, ins_rule_role,
                                            ins_policy_role, ins_uw_role, ins_claims_role,
                                            ins_field_role, ins_doc_role, ins_notif_role,
                                            ins_audit_role, ins_workflow_role, ins_report_role;

GRANT USAGE ON SCHEMA ins_auth          TO ins_auth_role, ins_report_role;
GRANT USAGE ON SCHEMA ins_product       TO ins_product_role, ins_report_role;
GRANT USAGE ON SCHEMA ins_rule          TO ins_rule_role, ins_report_role;
GRANT USAGE ON SCHEMA ins_policy        TO ins_policy_role, ins_report_role;
GRANT USAGE ON SCHEMA ins_underwriting  TO ins_uw_role, ins_report_role;
GRANT USAGE ON SCHEMA ins_claims        TO ins_claims_role, ins_report_role;
GRANT USAGE ON SCHEMA ins_field         TO ins_field_role, ins_report_role;
GRANT USAGE ON SCHEMA ins_document      TO ins_doc_role, ins_report_role;
GRANT USAGE ON SCHEMA ins_notification  TO ins_notif_role, ins_report_role;
GRANT USAGE ON SCHEMA ins_audit         TO ins_audit_role, ins_report_role;
GRANT USAGE ON SCHEMA ins_workflow      TO ins_workflow_role, ins_report_role;

-- =============================================================================
-- DEFAULT PRIVILEGES
-- Automatically grant correct privileges on future tables created by Flyway role.
-- This means any new table added by a migration inherits the correct grants.
-- =============================================================================

-- ins_auth tables → ins_auth_role: SELECT, INSERT, UPDATE, DELETE
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_auth
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ins_auth_role;
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_auth
    GRANT SELECT ON TABLES TO ins_report_role;
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_auth
    GRANT USAGE, SELECT ON SEQUENCES TO ins_auth_role;

-- ins_product tables → ins_product_role
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_product
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ins_product_role;
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_product
    GRANT SELECT ON TABLES TO ins_report_role;
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_product
    GRANT USAGE, SELECT ON SEQUENCES TO ins_product_role;

-- ins_rule tables → ins_rule_role
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_rule
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ins_rule_role;
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_rule
    GRANT SELECT ON TABLES TO ins_report_role;
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_rule
    GRANT USAGE, SELECT ON SEQUENCES TO ins_rule_role;

-- ins_policy tables → ins_policy_role
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_policy
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ins_policy_role;
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_policy
    GRANT SELECT ON TABLES TO ins_report_role;
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_policy
    GRANT USAGE, SELECT ON SEQUENCES TO ins_policy_role;

-- ins_underwriting tables → ins_uw_role
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_underwriting
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ins_uw_role;
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_underwriting
    GRANT SELECT ON TABLES TO ins_report_role;
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_underwriting
    GRANT USAGE, SELECT ON SEQUENCES TO ins_uw_role;

-- ins_claims tables → ins_claims_role
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_claims
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ins_claims_role;
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_claims
    GRANT SELECT ON TABLES TO ins_report_role;
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_claims
    GRANT USAGE, SELECT ON SEQUENCES TO ins_claims_role;

-- ins_field tables → ins_field_role
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_field
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ins_field_role;
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_field
    GRANT SELECT ON TABLES TO ins_report_role;
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_field
    GRANT USAGE, SELECT ON SEQUENCES TO ins_field_role;

-- ins_document tables → ins_doc_role
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_document
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ins_doc_role;
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_document
    GRANT SELECT ON TABLES TO ins_report_role;
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_document
    GRANT USAGE, SELECT ON SEQUENCES TO ins_doc_role;

-- ins_notification tables → ins_notif_role
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_notification
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ins_notif_role;
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_notification
    GRANT SELECT ON TABLES TO ins_report_role;
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_notification
    GRANT USAGE, SELECT ON SEQUENCES TO ins_notif_role;

-- ins_audit tables → ins_audit_role: INSERT + SELECT ONLY (immutability)
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_audit
    GRANT SELECT, INSERT ON TABLES TO ins_audit_role;
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_audit
    GRANT SELECT ON TABLES TO ins_report_role;
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_audit
    GRANT USAGE, SELECT ON SEQUENCES TO ins_audit_role;

-- ins_workflow tables → ins_workflow_role
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_workflow
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ins_workflow_role;
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_workflow
    GRANT SELECT ON TABLES TO ins_report_role;
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_workflow
    GRANT USAGE, SELECT ON SEQUENCES TO ins_workflow_role;

-- ins_common → all service roles (read shared functions)
ALTER DEFAULT PRIVILEGES FOR ROLE ins_flyway_role IN SCHEMA ins_common
    GRANT EXECUTE ON FUNCTIONS TO PUBLIC;

-- =============================================================================
-- NOTE ON CONCURRENTLY INDEXES
-- After Flyway completes initial migration, run the following pattern
-- for any large production table to create indexes without table lock:
--
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_name ON schema.table (col);
--
-- This cannot be done inside a transaction (Flyway runs in transactions),
-- so a separate post-migration script should be run for CONCURRENTLY indexes.
-- See generated-reference/POSTGRESQL_OPTIMIZATION.md for the full list.
-- =============================================================================
