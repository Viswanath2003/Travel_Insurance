-- =============================================================================
-- V00__create_schemas.sql
-- Creates all database schemas for the Travel Insurance Platform
-- Run once as a MySQL root / admin user before Flyway migrations
-- =============================================================================

CREATE DATABASE IF NOT EXISTS ins_auth
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS ins_product
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS ins_rule
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS ins_policy
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS ins_underwriting
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS ins_claims
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS ins_field
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS ins_document
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS ins_notification
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS ins_audit
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS ins_workflow
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- =============================================================================
-- Service-specific DB users
-- Each service connects with least-privilege credentials
-- =============================================================================

-- Auth Service user
CREATE USER IF NOT EXISTS 'ins_auth_svc'@'localhost' IDENTIFIED BY 'CHANGE_IN_PROD';
GRANT SELECT, INSERT, UPDATE, DELETE ON ins_auth.* TO 'ins_auth_svc'@'localhost';

-- Product Service user
CREATE USER IF NOT EXISTS 'ins_product_svc'@'localhost' IDENTIFIED BY 'CHANGE_IN_PROD';
GRANT SELECT, INSERT, UPDATE, DELETE ON ins_product.* TO 'ins_product_svc'@'localhost';

-- Rule Engine Service user
CREATE USER IF NOT EXISTS 'ins_rule_svc'@'localhost' IDENTIFIED BY 'CHANGE_IN_PROD';
GRANT SELECT, INSERT, UPDATE, DELETE ON ins_rule.* TO 'ins_rule_svc'@'localhost';

-- Policy Service user
CREATE USER IF NOT EXISTS 'ins_policy_svc'@'localhost' IDENTIFIED BY 'CHANGE_IN_PROD';
GRANT SELECT, INSERT, UPDATE, DELETE ON ins_policy.* TO 'ins_policy_svc'@'localhost';

-- Underwriting Service user
CREATE USER IF NOT EXISTS 'ins_uw_svc'@'localhost' IDENTIFIED BY 'CHANGE_IN_PROD';
GRANT SELECT, INSERT, UPDATE, DELETE ON ins_underwriting.* TO 'ins_uw_svc'@'localhost';

-- Claims Service user
CREATE USER IF NOT EXISTS 'ins_claims_svc'@'localhost' IDENTIFIED BY 'CHANGE_IN_PROD';
GRANT SELECT, INSERT, UPDATE, DELETE ON ins_claims.* TO 'ins_claims_svc'@'localhost';

-- Field Service user
CREATE USER IF NOT EXISTS 'ins_field_svc'@'localhost' IDENTIFIED BY 'CHANGE_IN_PROD';
GRANT SELECT, INSERT, UPDATE, DELETE ON ins_field.* TO 'ins_field_svc'@'localhost';

-- Document Service user
CREATE USER IF NOT EXISTS 'ins_doc_svc'@'localhost' IDENTIFIED BY 'CHANGE_IN_PROD';
GRANT SELECT, INSERT, UPDATE, DELETE ON ins_document.* TO 'ins_doc_svc'@'localhost';

-- Notification Service user
CREATE USER IF NOT EXISTS 'ins_notif_svc'@'localhost' IDENTIFIED BY 'CHANGE_IN_PROD';
GRANT SELECT, INSERT, UPDATE, DELETE ON ins_notification.* TO 'ins_notif_svc'@'localhost';

-- Audit Service user — INSERT + SELECT ONLY (immutability enforcement)
CREATE USER IF NOT EXISTS 'ins_audit_svc'@'localhost' IDENTIFIED BY 'CHANGE_IN_PROD';
GRANT SELECT, INSERT ON ins_audit.* TO 'ins_audit_svc'@'localhost';

-- Workflow (shared infrastructure)
CREATE USER IF NOT EXISTS 'ins_workflow_svc'@'localhost' IDENTIFIED BY 'CHANGE_IN_PROD';
GRANT SELECT, INSERT, UPDATE, DELETE ON ins_workflow.* TO 'ins_workflow_svc'@'localhost';

-- Reporting Service user — READ ONLY across all schemas
CREATE USER IF NOT EXISTS 'ins_report_svc'@'localhost' IDENTIFIED BY 'CHANGE_IN_PROD';
GRANT SELECT ON ins_auth.*          TO 'ins_report_svc'@'localhost';
GRANT SELECT ON ins_product.*       TO 'ins_report_svc'@'localhost';
GRANT SELECT ON ins_rule.*          TO 'ins_report_svc'@'localhost';
GRANT SELECT ON ins_policy.*        TO 'ins_report_svc'@'localhost';
GRANT SELECT ON ins_underwriting.*  TO 'ins_report_svc'@'localhost';
GRANT SELECT ON ins_claims.*        TO 'ins_report_svc'@'localhost';
GRANT SELECT ON ins_field.*         TO 'ins_report_svc'@'localhost';
GRANT SELECT ON ins_document.*      TO 'ins_report_svc'@'localhost';
GRANT SELECT ON ins_notification.*  TO 'ins_report_svc'@'localhost';
GRANT SELECT ON ins_audit.*         TO 'ins_report_svc'@'localhost';
GRANT SELECT ON ins_workflow.*      TO 'ins_report_svc'@'localhost';

FLUSH PRIVILEGES;
