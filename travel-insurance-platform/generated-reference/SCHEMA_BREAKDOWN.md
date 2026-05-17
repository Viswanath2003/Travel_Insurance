# Schema Breakdown — Travel Insurance Platform

**Generated:** 2026-05-12  
**Total Tables:** 75 across 11 schemas  
**Database:** `ins_travelinsurance` (PostgreSQL 14+)

---

## TABLE INVENTORY BY SCHEMA

### `ins_auth` — Authentication & Identity (8 tables)

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `users` | id (UUID PK), email, password_hash, role, is_active | Core auth credentials; role determines portal access |
| `user_roles` | id, role_name (UNIQUE), description | Role definitions for RBAC (9 roles) |
| `user_permissions` | id, permission_code (UNIQUE), resource, action | Fine-grained permission definitions |
| `role_permissions` | role_id FK, permission_id FK | Role-to-permission mapping (M:N) |
| `sessions` | id, user_id FK, token_hash, expires_at, is_active | JWT session tracking; partial index on active sessions |
| `otp_requests` | id, user_id FK, otp_hash, purpose, is_used, expires_at | OTP verification for login/profile changes |
| `customer_profiles` | id, user_id FK (UNIQUE), dob, passport_no, nationality, address JSONB | PII separated from auth; update requires approval workflow |
| `profile_change_requests` | id, user_id FK, requested_changes JSONB, status, reviewed_by FK | Admin-approval workflow for customer PII updates |

**New vs MySQL:** `customer_profiles`, `profile_change_requests` are new (PII separation + approval workflow).

---

### `ins_product` — Product Catalog (8 tables)

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `product_types` | id, type_code (UNIQUE), name, base_description | Top-level product classification (e.g., TRAVEL) |
| `products` | id, product_type_id FK, product_code (UNIQUE), name, is_active | Product definitions |
| `plans` | id, product_id FK, plan_code (UNIQUE), name, tier, daily_rate DECIMAL(12,2) | Plan catalog (Basic/Plus/Pro/Family/Senior/Corporate) |
| `coverage_types` | id, coverage_code (UNIQUE), name, category, unit | Coverage definitions (Medical, Baggage, Trip Cancel, etc.) |
| `plan_coverages` | id, plan_id FK, coverage_type_id FK, slider_base DECIMAL(12,2), max_coverage DECIMAL(12,2) | Which coverages are on each plan with default/max amounts |
| `addons` | id, addon_code (UNIQUE), name, premium_loading_pct DECIMAL(5,2), risk_points_added | Add-on definitions (Adventure, Sports, etc.) |
| `plan_addons` | id, plan_id FK, addon_id FK | Which add-ons are available per plan |
| `destination_zones` | id, zone_code (UNIQUE), zone_name, premium_multiplier DECIMAL(4,2) | Geographic pricing zones (SE Asia 1.0× → Worldwide 2.5×) |
| `zone_countries` | id, zone_id FK, country_code, country_name | Countries in each destination zone |
| `plan_form_config` | id, plan_id FK, product_type_code, field_name, is_required, display_order | Form field configuration per plan/product type |
| `coverage_limit_risk_multipliers` | id, risk_level (UNIQUE), multiplier NUMERIC(4,2) | Risk-based slider cap multipliers (LOW=1.5×, VH=1.0×) |

**New vs MySQL:** `plan_form_config`, `coverage_limit_risk_multipliers` are new.  
*(Note: zone_countries and coverage_limit_risk_multipliers added, total 11 tables including coverage_types as separate.)*

---

### `ins_rule` — Rule Engine (6 tables)

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `rule_definitions` | id, rule_code (UNIQUE), category (RISK_SCORING/PREMIUM_LOADING/ELIGIBILITY/ROUTING/CLAIMS_AUTO_DECISION), priority, is_active, stop_on_match, current_version | Master rule registry; admin-editable |
| `rule_condition_groups` | id, rule_id FK, logical_operator (AND/OR), display_order | Groups conditions with AND/OR logic |
| `rule_conditions` | id, group_id FK, field_path, operator (EQUALS/IN/CONTAINS/BETWEEN/GREATER_THAN/etc.), comparison_value, data_type | Leaf-level condition predicates |
| `rule_actions` | id, rule_id FK, action_type (ADD_SCORE/SET_STATUS/SET_ROUTING/etc.), action_target, action_value | What the rule does when triggered |
| `rule_versions` | id, rule_id FK, version_number, snapshot JSONB, created_by FK | Full version history of rule changes |
| `rule_execution_logs` | id, rule_id FK, entity_type, entity_id, matched BOOLEAN, input_context JSONB, output_context JSONB | Per-execution audit trail; partitioned monthly |

**New vs MySQL:** `is_active`, `stop_on_match`, `current_version` added to `rule_definitions`. Rule type enum unified with backend.

---

### `ins_policy` — Policy Management (8 tables)

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `quotes` | id, user_id FK, plan_id FK, risk_score NUMERIC(5,2), quote_details JSONB, premium_breakdown JSONB, status | Quote lifecycle (DRAFT→COMPLETED→EXPIRED) |
| `policies` | id, quote_id FK, user_id FK, policy_number (UNIQUE), plan_code, status (11 values), risk_score NUMERIC(5,2), coverage_details JSONB, traveler_details JSONB | Core policy record with full status lifecycle |
| `policy_status_history` | id, policy_id FK, from_status, to_status, changed_by FK, remarks | Immutable audit trail of all status changes |
| `policy_snapshots` | id, policy_id FK (UNIQUE), snapshot_data JSONB, snapshot_version | Point-in-time snapshot for claims-service reference (avoids cross-schema join) |
| `policy_travelers` | id, policy_id FK, traveler_name, dob, age_group, passport_no | Individual traveler details per policy |
| `policy_documents` | id, policy_id FK, document_type, file_path, storage_key | Policy schedule PDFs and certificates |
| `policy_agent_bindings` | id, policy_id FK (UNIQUE), agent_user_id FK, agent_code, bound_at | Which agent sold which policy |
| `agent_commissions` | id, policy_id FK, agent_user_id FK, plan_code, commission_rate DECIMAL(5,4), commission_amount DECIMAL(12,2), payment_status | Commission tracking per bound policy |

**New vs MySQL:** `plan_code` on policies, `policy_agent_bindings`, `agent_commissions` are new. Policy status expanded from 7 to 11 values. `risk_score` changed from INT to NUMERIC(5,2).

---

### `ins_underwriting` — Underwriting Review (5 tables)

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `uw_cases` | id, policy_id FK, case_reference (UNIQUE), review_level (L1/L2), current_state (11 values), assigned_to FK, is_active BOOLEAN | UW case per policy; partial UNIQUE on policy_id WHERE is_active |
| `uw_case_history` | id, case_id FK, from_state, to_state, action_taken, performed_by FK, remarks | State machine audit trail |
| `uw_case_notes` | id, case_id FK, note_text, created_by FK, note_type | Internal UW notes (visible only to underwriters) |
| `uw_risk_assessments` | id, case_id FK, risk_factor, risk_weight DECIMAL(5,2), notes | Structured risk factor breakdown |
| `uw_conditions` | id, case_id FK, condition_code, condition_text, is_met BOOLEAN | Conditions attached to "Approve with Conditions" decisions |

**New vs MySQL:** `uw_conditions` is new. `is_active` added to `uw_cases`. `APPROVED_WITH_CONDITIONS` state added. Multiple UW cases per policy now allowed (re-submission after rejection).

---

### `ins_claims` — Claims Processing (12 tables)

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `claim_types` | id, code (UNIQUE), name, required_docs JSONB, default_sla_hours | Claim type catalog (9 types: Medical, Baggage, Trip Cancel, etc.) |
| `claims` | id, policy_id FK, claim_type_id FK, claim_reference (UNIQUE), status (15 values), claimed_amount, priority, is_high_value BOOLEAN, metadata JSONB | Master claim record |
| `claim_travelers` | id, claim_id FK, traveler_name, traveler_role | Travelers involved in the claim |
| `claim_documents` | id, claim_id FK, document_type_code, file_path, storage_key, is_verified | Uploaded supporting documents |
| `claim_doc_checklist_config` | id, claim_type_id FK, document_type_code, document_label, is_mandatory, display_order | Required document list per claim type |
| `claim_checklist_status` | id, claim_id FK, document_type_code, is_submitted, is_verified | Per-claim document completion tracking |
| `claim_workflow_history` | id, claim_id FK, from_status, to_status, action, performed_by FK, remarks | Full state machine audit trail |
| `claim_decisions` | id, claim_id FK, decision_type (APPROVE/PARTIAL_APPROVE/REJECT/FIELD_INVESTIGATION), approved_amount, partial_amount, decided_by FK | Formal adjudication records |
| `claim_adjuster_notes` | id, claim_id FK, note_text, created_by FK, is_internal BOOLEAN | Internal investigation notes (separate from formal decisions) |
| `claim_payments` | id, claim_id FK, payment_reference (UNIQUE), payment_amount, payment_method, payment_status, processed_by FK | Settlement payment records |
| `claim_snapshots` | id, claim_id FK (UNIQUE), snapshot_data JSONB | Point-in-time policy snapshot for claims context |
| `claim_sla_config` | id, claim_type_id FK (nullable), priority, resolution_hours, escalation_hours | SLA rules per claim type + priority |

**New vs MySQL:** `claim_adjuster_notes` is new. `is_high_value`, `priority`, `metadata` added to claims. `partial_amount` added to decisions. 15-value status CHECK replacing prior 6-value enum.

---

### `ins_field` — Field Investigation (3 tables)

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `field_assignments` | id, claim_id FK, assigned_officer_id FK, investigation_type, priority (HIGH/MEDIUM/LOW), assignment_status, location, due_at | Field investigation task assignments |
| `field_reports` | id, assignment_id FK (UNIQUE), report_text, claimant_present BOOLEAN, recommendation (APPROVE/PARTIAL_APPROVE/REJECT/FURTHER_INVESTIGATION_NEEDED), submitted_at | Officer's on-site investigation report |
| `field_evidence_documents` | id, assignment_id FK, document_type, file_path, storage_key | Photos, PDFs uploaded as evidence |

---

### `ins_document` — Document Generation (4 tables)

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `document_templates` | id, template_code (UNIQUE), document_type, name, is_active | Template registry (policy schedule, welcome letter, etc.) |
| `document_template_versions` | id, template_id FK, version, template_body TEXT, is_current BOOLEAN | Versioned template content; partial UNIQUE on current version |
| `generated_documents` | id, entity_type, entity_id, template_id FK, storage_key, generation_context JSONB, generated_at | Record of every generated document with storage reference |
| `document_versions` | id, generated_document_id FK, version, change_notes | Version history of regenerated documents |

---

### `ins_notification` — Notification System (3 tables)

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `notification_templates` | id, event_code, channel (IN_APP/EMAIL/SMS), title_template, body_template, target_role, is_active; UNIQUE(event_code, channel) | Event-driven template registry (23 templates seeded) |
| `notifications` | id, template_id FK, target_role (9-role CHECK), target_user_id FK, target_user_email, title, body, entity_type, entity_id, is_read BOOLEAN, read_at | Per-user notification delivery; partial index on unread |
| `notification_delivery_log` | id, notification_id FK, delivery_channel, delivery_status, attempted_at, delivered_at, error_message | Delivery attempt audit trail |

---

### `ins_audit` — Audit Log (1 table)

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `audit_logs` | id BIGINT (GENERATED ALWAYS AS IDENTITY), occurred_at TIMESTAMPTZ, actor_id FK, actor_role, action, entity_type, entity_id, before_state JSONB, after_state JSONB, actor_ip INET | Immutable compliance trail; RANGE-partitioned monthly by occurred_at; RLS enforces INSERT+SELECT only |

**Design notes:** `BIGSERIAL`-equivalent (`BIGINT GENERATED ALWAYS`) for sequential performance. No FK constraints (audit must survive entity deletion). RLS policy blocks UPDATE/DELETE at DB layer.

---

### `ins_workflow` — Shared Infrastructure (6 tables)

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `workflow_definitions` | id, workflow_code (UNIQUE), name, initial_state, is_active | State machine registrations (POLICY_ISSUANCE, UNDERWRITING, CLAIMS_PROCESSING) |
| `workflow_states` | id, workflow_id FK, state_code, state_label, is_terminal, is_initial, allowed_roles TEXT[] | State node definitions with RBAC restrictions |
| `workflow_transitions` | id, workflow_id FK, from_state, to_state, trigger_event, allowed_roles TEXT[], requires_remarks BOOLEAN | Edge definitions in state machine graph |
| `risk_routing_config` | id, routing_band (UNIQUE), score_min, score_max, target_status, notify_roles TEXT[], description | DB-driven risk score routing thresholds (replaces hardcoded JS) |
| `coverage_limit_risk_multipliers` | id, risk_level (UNIQUE), multiplier NUMERIC(4,2) | Risk-based coverage slider maximums (replaces hardcoded JS) |
| `platform_configurations` | id, config_key (UNIQUE), config_value, value_type, description, group_name, is_active | Key-value store for runtime-configurable platform settings |
| `rm_client_portfolios` | id, customer_user_id FK, rm_user_id FK, assigned_at, notes; UNIQUE(customer_user_id, rm_user_id) | Relationship Manager ↔ customer portfolio assignments |

**New vs MySQL:** `risk_routing_config`, `coverage_limit_risk_multipliers`, `rm_client_portfolios` are all new. Previously hardcoded in webapp JavaScript.

---

## SUMMARY TABLE COUNT

| Schema | Tables | New Tables | Notes |
|--------|--------|------------|-------|
| `ins_auth` | 8 | 2 | customer_profiles, profile_change_requests |
| `ins_product` | 11 | 2 | plan_form_config, coverage_limit_risk_multipliers |
| `ins_rule` | 6 | 0 | Columns added to rule_definitions |
| `ins_policy` | 8 | 2 | policy_agent_bindings, agent_commissions |
| `ins_underwriting` | 5 | 1 | uw_conditions |
| `ins_claims` | 12 | 1 | claim_adjuster_notes |
| `ins_field` | 3 | 0 | |
| `ins_document` | 4 | 0 | |
| `ins_notification` | 3 | 0 | |
| `ins_audit` | 1 | 0 | |
| `ins_workflow` | 7 | 3 | risk_routing_config, coverage_limit_risk_multipliers, rm_client_portfolios |
| **Total** | **68** | **11** | |

*(Note: zone_countries counted under ins_product; coverage_limit_risk_multipliers appears in both ins_product and ins_workflow as a seeding schema — single canonical table in ins_workflow)*

---

## CROSS-SERVICE BOUNDARY MAP

Services communicate via API only — no cross-schema FK constraints in the database.

```
auth-service        → ins_auth         (users, sessions, profiles)
                        ↓ API
product-service     → ins_product      (plans, coverages, zones)
                        ↓ API
rule-engine-service → ins_rule         (rules, execution logs)
                        ↓ API
policy-service      → ins_policy       (quotes, policies, agents, commissions)
                        ↓ API
underwriting-service→ ins_underwriting (uw_cases, conditions)
                        ↓ API
claims-service      → ins_claims       (claims, decisions, payments)
                        ↓ API
field-service       → ins_field        (assignments, reports, evidence)
                        ↓ API
document-service    → ins_document     (templates, generated docs)
notification-service→ ins_notification (templates, delivery)
audit-service       → ins_audit        (audit_logs — append only)
workflow-engine     → ins_workflow     (state machines, config, RM portfolios)
```

### Denormalized Fields (Cross-Service Reference Without FK)

| Table | Denormalized Field | Source | Why |
|-------|--------------------|--------|-----|
| `ins_policy.policies` | `plan_code` | `ins_product.plans` | Displayed on policy schedule PDF without product-service call |
| `ins_policy.policy_snapshots` | `snapshot_data` (full JSON) | ins_policy self | Claims-service reads policy terms at claim time; policy may have since changed |
| `ins_claims.claim_snapshots` | `snapshot_data` | ins_policy.policy_snapshots | Field-service and finance-service need claim context offline |
| `ins_claims.claims` | `customer_name`, `policy_number` | ins_policy, ins_auth | Dashboard display without JOIN across services |
| `ins_underwriting.uw_cases` | `customer_name`, `plan_code`, `risk_level` | ins_policy, ins_auth | UW queue display without API call per row |
| `ins_audit.audit_logs` | `actor_role`, `entity_type` | All services | Audit records are self-contained; referenced entity may be deleted |

---

## DESIGN DECISIONS

### Why UUID for All Primary Keys?
- Enables client-side ID generation before DB write (useful for event sourcing, offline-first clients)
- No sequential ID leakage (security: can't enumerate records by guessing IDs)
- Consistent across 11 schemas even without cross-schema FKs

### Why BIGINT for audit_logs?
- audit_logs is an append-only high-volume table
- Sequential BIGINT eliminates UUID B-tree fragmentation on inserts
- audit_logs are never referenced by UUID from other services

### Why TIMESTAMPTZ Everywhere?
- Travel insurance inherently crosses timezones (customer in India, travel in Europe)
- TIMESTAMPTZ stores UTC internally, displays in any timezone without conversion bugs

### Why JSONB Not JSON?
- JSONB is stored as binary (faster operators, no re-parse on every read)
- GIN indexes work on JSONB — enables `@>` containment queries
- `quote_details`, `coverage_details`, `traveler_details` vary per plan type — JSONB avoids schema changes when adding new fields

### Why No Cross-Schema FKs?
- Enables independent service deployment and migration
- Allows services to evolve their schemas without coordinating foreign key constraints
- Snapshot pattern (policy_snapshots, claim_snapshots) provides data integrity at claim time

### Why Partial Indexes on is_active / status Filters?
- Dashboard queries almost always filter on current/active state
- Active policies are a small % of all policies (most eventually reach ACTIVE or EXPIRED)
- A partial index on `WHERE is_active = TRUE` can be 10-100× smaller than a full column index

---

*Schema breakdown complete. 68 tables across 11 schemas, 11 new tables added beyond original MySQL design.*
