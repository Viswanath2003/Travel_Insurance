# Phase 1 Analysis — Travel Insurance Platform
## PostgreSQL Database Architecture

**Generated:** 2026-05-12  
**Source of Truth:** `webapp/` portal files (all 9 portals analyzed)

---

## 1. UPDATED DOMAIN UNDERSTANDING

### Business Domain Summary
The Travel Insurance Administration Platform is a multi-portal, microservices-based system enabling:
- **Customers** to get quotes, purchase travel insurance policies, and file claims online
- **Agents/Brokers** to bind policies on behalf of customers and earn commissions
- **Underwriters (L1/L2)** to review and decide on higher-risk policies
- **Claims Officers** to process and adjudicate claims
- **Field Officers** to investigate claims requiring on-site verification
- **Finance Officers** to process approved claim payments
- **Relationship Managers** to manage corporate/group client portfolios
- **Administrators** to configure plans, rules, RBAC, SLA, and system settings

### Core Business Flows
1. **Quote → Payment → Policy**: Customer configures a policy using the Adaptive Policy Builder
2. **Risk Scoring → Routing**: A DB-driven rule engine scores every quote (0–100+) and routes to appropriate review queue
3. **Underwriting Review**: HIGH-risk policies reviewed by L1; VERY_HIGH by L2 + Field Officer
4. **Claims Lifecycle**: SUBMITTED → DOCUMENT_REVIEW → UNDER_REVIEW → INVESTIGATION → DECISION → PAYMENT → CLOSED
5. **Agent Commission**: Agents earn % commission on bound policies (Basic=10%, Plus=12%, Pro=15%)

---

## 2. DETECTED CHANGES FROM WEBAPP FOLDER ANALYSIS

### 2.1 Policy Status Gaps
**Problem:** The MySQL `policies` table only contains:
```
'PENDING_UNDERWRITING','UNDER_REVIEW','ACTIVE','EXPIRED','CANCELLED','REJECTED','CANCELLATION_REQUESTED'
```
**Webapp JavaScript routing logic requires:**
- `PENDING_PAYMENT` — policy created but awaiting payment confirmation
- `PENDING_CO_REVIEW` — risk score 31–50, routed to Claims Officer queue
- `PENDING_UW_L1` — risk score 51–70, Underwriter L1 queue
- `PENDING_UW_L2` — risk score 71+, Underwriter L2 + Field Officer queue
- `LAPSED` — missed renewal payment

**Fix:** Updated policy status CHECK constraint to include all 11 statuses.

### 2.2 Risk Score Type Inconsistency
**Problem:** `risk_score INT` in policies/quotes vs `DECIMAL(6,2)` in claims.auto_decision_score.
**Webapp analysis:** Risk scores use decimal scoring (e.g., 42.75) from weighted rules.
**Fix:** Use `NUMERIC(5,2)` (max 999.99) everywhere risk_score appears.

### 2.3 Missing plan_code on Policy
**Problem:** `policies` table has no `plan_code` VARCHAR column.
**Webapp analysis:** plan_code is displayed on the policy schedule PDF and used in commission calculation logic.
**Fix:** Added `plan_code VARCHAR(50)` to policies table.

### 2.4 RuleDefinition Missing Columns
**Problem:** `rule_definitions` is missing `is_active`, `stop_on_match`, `current_version` columns visible in backend entity annotations.
**Fix:** Added all three columns.

### 2.5 Rule Type Naming Inconsistency
**Problem:** Backend entity uses `RISK_SCORING`, `PREMIUM_LOADING`, `ELIGIBILITY`, `ROUTING`, `CLAIMS_AUTO_DECISION` but MySQL schema uses `RISK`, `PREMIUM`, `DISCOUNT`, `ELIGIBILITY`, `CLAIM_AUTO_DECISION`.
**Fix:** Unified to backend entity enum values: `RISK_SCORING`, `PREMIUM_LOADING`, `DISCOUNT`, `ELIGIBILITY`, `ROUTING`, `CLAIMS_AUTO_DECISION`.

### 2.6 UW Case Missing APPROVED_WITH_CONDITIONS State
**Problem:** Webapp UW portal has "Approve with Conditions" action; MySQL uw_cases.current_state CHECK does not include `APPROVED_WITH_CONDITIONS`.
**Fix:** Added `APPROVED_WITH_CONDITIONS` to CHECK constraint.

### 2.7 Missing Claims Officer Queue
**Problem:** Risk score 31–50 routes to Claims Officer (`PENDING_CO_REVIEW`) but there is no dedicated UW case concept for CO review — the policy sits in the claims officer's queue directly.
**Decision:** CO review is policy-level (no uw_cases row), tracked via policy_status_history. Claims officer sees policies in `PENDING_CO_REVIEW` state on their dashboard.

### 2.8 No Agent Commission Tracking
**Problem:** No tables exist for tracking which agent bound a policy or calculating commissions.
**Webapp evidence:** Agent portal shows commission dashboard with per-policy breakdowns.
**Fix:** Added `policy_agent_bindings` and `agent_commissions` tables.

### 2.9 No Relationship Manager Portfolio
**Problem:** Webapp RM portal shows client portfolio assignments but no DB table exists.
**Fix:** Added `rm_client_portfolios` in ins_workflow schema.

### 2.10 No PII Separation
**Problem:** Customer PII (DOB, passport, address, nationality) was stored directly in the users table.
**Webapp evidence:** Profile edit page submits to a separate profile endpoint with an approval workflow.
**Fix:** Added `customer_profiles` table (PII separated) and `profile_change_requests` (approval workflow).

### 2.11 Coverage Slider Risk Multipliers Not Persisted
**Problem:** Multipliers (LOW=1.5x, MEDIUM=1.25x, HIGH=1.1x, VERY_HIGH=1.0x) are hardcoded in JavaScript.
**Fix:** Added `coverage_limit_risk_multipliers` table in ins_product.

### 2.12 Risk Routing Config Not Persisted
**Problem:** Score thresholds (0–30/31–50/51–70/71+) are hardcoded in webapp.
**Fix:** Added `risk_routing_config` table in ins_rule schema.

### 2.13 No Product Form Configuration
**Problem:** Different product types (STUDENT, SENIOR, CORPORATE) require different form fields.
**Webapp evidence:** Form fields vary by product type in the customer portal.
**Fix:** Added `plan_form_config` table.

### 2.14 No UW Conditions Table
**Problem:** "Approve with Conditions" UW decisions have no associated conditions storage.
**Fix:** Added `uw_conditions` table.

### 2.15 No Claim Adjuster Notes
**Problem:** Claims adjuster internal notes (separate from decisions) have no storage.
**Fix:** Added `claim_adjuster_notes` table.

---

## 3. UPDATED ARCHITECTURE ASSUMPTIONS

### Database Architecture
- **Single PostgreSQL 14+ instance**, single database `ins_travelinsurance`
- **11 schemas** (+ `ins_common` for shared functions): each owned by a dedicated service role
- **Flyway** manages migrations in version-ordered files
- **No cross-schema FK constraints** — services communicate via API, not DB joins
- **Denormalized reference data** in child tables (e.g., policy_number, customer_name) reduces cross-service queries

### PostgreSQL-Specific Decisions
- `UUID NOT NULL DEFAULT gen_random_uuid()` for all primary keys (except audit_logs)
- `BIGSERIAL` for audit_logs.id (high-volume append-only)
- `TIMESTAMPTZ` for all timestamps (timezone-aware)
- `JSONB` for all JSON columns (binary indexed, faster operators)
- `BOOLEAN` for all boolean flags
- `NUMERIC(5,2)` for risk scores, `DECIMAL(12,2)` for monetary amounts
- Trigger function `ins_common.set_updated_at()` handles all `updated_at` automation
- Table partitioning by RANGE (monthly) on `audit_logs.occurred_at`
- GIN indexes on all JSONB columns
- Partial indexes for high-cardinality filtered queries

### Security Architecture
- PostgreSQL roles (not users) with LEAST PRIVILEGE
- `NOLOGIN` roles attached to service accounts
- Row-level security (RLS) planned but not enforced at DB layer — enforced at service layer
- `ins_audit_role` has INSERT + SELECT only (immutability)
- `ins_report_role` has SELECT only across all schemas

---

## 4. SERVICE/DOMAIN MAPPING

| Schema | Service | Owns | Reads From |
|--------|---------|------|-----------|
| `ins_auth` | auth-service | users, roles, sessions, OTP, profiles | — |
| `ins_product` | product-service | plans, coverages, addons, zones | ins_auth (via API) |
| `ins_rule` | rule-engine-service | rules, conditions, actions, execution logs | ins_product (via API) |
| `ins_policy` | policy-service | quotes, policies, snapshots, agent bindings | ins_rule, ins_product, ins_auth (via API) |
| `ins_underwriting` | underwriting-service | uw_cases, history, notes, conditions | ins_policy (via API) |
| `ins_claims` | claims-service | claims, documents, decisions, payments | ins_policy snapshot (via API) |
| `ins_field` | field-service | field_assignments, reports, evidence | ins_claims (via API) |
| `ins_document` | document-service | templates, generated_documents | All services (via API) |
| `ins_notification` | notification-service | templates, notifications, delivery | All services (via API) |
| `ins_audit` | audit-service | audit_logs (append only) | — |
| `ins_workflow` | shared infrastructure | workflow definitions, platform configs, RM portfolios | All services |

---

## 5. IDENTIFIED MISSING ENTITIES WITH JUSTIFICATION

### 5.1 `customer_profiles` (ins_auth)
**Justification:** Webapp customer portal has a dedicated "My Profile" page with PII fields (DOB, passport, nationality, address, profile photo). These fields require GDPR-style separation from auth data and need admin approval for changes. The users table should contain only auth credentials.

### 5.2 `profile_change_requests` (ins_auth)
**Justification:** Webapp profile edit page routes changes through an admin approval workflow before updating PII. Evidence: "Profile Update Request" notification template in V15 seed.

### 5.3 `policy_agent_bindings` (ins_policy)
**Justification:** Agent portal shows a list of policies bound by the agent. Agent code and binding timestamp must be recorded. Commission calculation requires knowing which agent bound which policy.

### 5.4 `agent_commissions` (ins_policy)
**Justification:** Webapp agent portal shows commission dashboard broken down by policy and plan. Commission rates differ per plan (Basic=10%, Plus=12%, Pro=15%). Payment status tracking needed.

### 5.5 `risk_routing_config` (ins_rule)
**Justification:** Score thresholds for routing (0–30/31–50/51–70/71+) are currently hardcoded in webapp JavaScript. These should be DB-driven for Admin reconfiguration without code deployment.

### 5.6 `coverage_limit_risk_multipliers` (ins_product)
**Justification:** Risk-based max coverage multipliers (LOW=1.5x, MEDIUM=1.25x, etc.) hardcoded in webapp. Must be Admin-configurable.

### 5.7 `uw_conditions` (ins_underwriting)
**Justification:** "Approve with Conditions" is an explicit UW action in the webapp portal. Conditions must be stored with condition code, text, and tracking of whether condition was met.

### 5.8 `claim_adjuster_notes` (ins_claims)
**Justification:** Claims officers need to record internal investigation notes separate from formal decisions. Webapp shows a notes section in the claim detail view.

### 5.9 `rm_client_portfolios` (ins_workflow)
**Justification:** Relationship Manager portal shows client portfolio with assigned RM. No DB table existed. Multiple RMs can be assigned to a customer portfolio.

### 5.10 `plan_form_config` (ins_product)
**Justification:** Different product types require different form fields. STUDENT type needs university details; CORPORATE needs company info. Form configuration must be DB-driven.

---

## 6. IDENTIFIED RISKS/CONFLICTS

### 6.1 Cross-Schema FK Risk
**Risk:** Several tables store denormalized foreign data (customer_name, policy_number, plan_code) to avoid cross-schema joins. If source data changes, these denormalized fields can drift.
**Mitigation:** Document denormalized fields clearly; use event-driven updates via notification service for critical changes.

### 6.2 Policy Snapshot Integrity
**Risk:** claims-service reads from `ins_policy.policy_snapshots`. If the snapshot is not created atomically with policy activation, claims may reference stale data.
**Mitigation:** Policy service creates the snapshot in the same transaction as status transition to ACTIVE.

### 6.3 Rule Engine Execution Log Volume
**Risk:** `rule_execution_logs` records EVERY rule evaluation (matched and unmatched). At scale, this can accumulate millions of rows rapidly.
**Mitigation:** Table partitioned monthly. Partition-level DROP enables efficient retention management. GIN indexes on JSONB columns prevent full-table scans.

### 6.4 Audit Log Immutability
**Risk:** accidental UPDATE/DELETE on audit_logs would destroy compliance trail.
**Mitigation:** PostgreSQL role `ins_audit_role` has INSERT + SELECT ONLY. No UPDATE/DELETE privileges. Row-level triggers can add further protection.

### 6.5 UUID Key Performance
**Risk:** Random UUID v4 (`gen_random_uuid()`) causes B-tree index fragmentation on high-insert tables.
**Mitigation:** For audit_logs (highest volume), BIGSERIAL is used. For UUID tables, consider `uuid_generate_v7()` (sequential UUID) if available in PostgreSQL 17+ environment. Current choice: `gen_random_uuid()` is standard and acceptable.

### 6.6 UW Case Uniqueness Constraint
**Risk:** The existing MySQL schema has `UNIQUE (policy_id)` on uw_cases, meaning one UW case per policy. If a policy is re-submitted after rejection and approved, a new UW case cannot be created.
**Mitigation:** Changed to allow multiple UW cases per policy; added `is_active BOOLEAN` to track which case is current. Added partial unique index `WHERE is_active = TRUE`.

---

## 7. POSTGRESQL MIGRATION DECISIONS

| MySQL Construct | PostgreSQL Replacement | Notes |
|----------------|----------------------|-------|
| `CREATE DATABASE ... CHARACTER SET utf8mb4` | `CREATE SCHEMA IF NOT EXISTS` | Single DB, 11 schemas |
| `USE database` | `SET search_path = schema` or schema-qualified names | Schema-qualified preferred |
| `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci` | Removed | PostgreSQL default is UTF-8 |
| `VARCHAR(36)` PK | `UUID NOT NULL DEFAULT gen_random_uuid()` | Native UUID type |
| `TINYINT(1) NOT NULL DEFAULT 1` | `BOOLEAN NOT NULL DEFAULT TRUE` | |
| `TINYINT(1) NOT NULL DEFAULT 0` | `BOOLEAN NOT NULL DEFAULT FALSE` | |
| `TINYINT` | `SMALLINT` | |
| `DATETIME` / `DATETIME(6)` | `TIMESTAMPTZ` | Always timezone-aware |
| `DEFAULT CURRENT_TIMESTAMP` | `DEFAULT NOW()` | |
| `ON UPDATE CURRENT_TIMESTAMP` | Trigger `ins_common.set_updated_at()` | DDL trigger per table |
| `BIGINT NOT NULL AUTO_INCREMENT` | `BIGSERIAL NOT NULL` | Sequences, not AUTO_INCREMENT |
| `JSON` | `JSONB` | Binary JSON, GIN-indexable |
| `LONGTEXT` | `TEXT` | No length limit needed |
| `UUID()` function | `gen_random_uuid()` | Built-in pg_crypto function |
| `ON DELETE CASCADE` | Retained | Standard SQL, same in PG |
| MySQL-specific CHECK | PostgreSQL native CHECK | No change needed |

### PostgreSQL Enhancements Added
1. **Shared trigger function** `ins_common.set_updated_at()` — eliminates per-table trigger function duplication
2. **GIN indexes** on all JSONB columns — enables fast `@>`, `?`, `?|` operators
3. **Partial indexes** — WHERE clause reduces index size and speeds up common queries
4. **Monthly range partitioning** on `ins_audit.audit_logs` — enables efficient retention management
5. **CONCURRENTLY index creation** — recommended in migration notes (non-blocking)
6. **DEFAULT PRIVILEGES** for roles — future tables automatically get correct permissions
7. **BIGSERIAL** for high-volume append-only tables (audit_logs)

---

## 8. FLYWAY MIGRATION ORDER

```
V00__init_postgresql.sql           — Schemas, roles, grants
V01__common_functions.sql          — Shared trigger functions
V02__auth_schema.sql               — ins_auth tables
V03__product_schema.sql            — ins_product tables
V04__rule_engine_schema.sql        — ins_rule tables
V05__policy_schema.sql             — ins_policy tables (depends on product + rule)
V06__underwriting_schema.sql       — ins_underwriting tables (depends on policy)
V07__claims_schema.sql             — ins_claims tables (depends on policy)
V08__field_schema.sql              — ins_field tables (depends on claims)
V09__document_schema.sql           — ins_document tables (standalone)
V10__notification_schema.sql       — ins_notification tables (standalone)
V11__audit_schema.sql              — ins_audit tables (standalone, partitioned)
V12__workflow_schema.sql           — ins_workflow tables (shared)
V20__seed_roles_permissions.sql    — Seed auth data
V21__seed_product_catalog.sql      — Seed product + rule config
V22__seed_claim_types_sla.sql      — Seed claim types and SLAs
V23__seed_notification_templates.sql — Seed notification templates
V24__seed_workflow_definitions.sql — Seed workflow state machines
V25__seed_platform_config.sql      — Seed platform configuration
```

---

*Analysis complete. Proceed to PHASE 2 DDL generation.*
