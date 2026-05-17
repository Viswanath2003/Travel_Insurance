# PolicyPilot — Entity Relationship Diagram (25 Tables)

> Render with: VS Code + Mermaid Preview extension | mermaid.live | GitHub native rendering

**Schema version:** V02–V12 (25-table design)  
**Database:** PostgreSQL 15  
**Schemas:** ins_auth · ins_product · ins_rule · ins_policy · ins_uw · ins_claims · ins_field · ins_document · ins_notification · ins_audit · ins_workflow

---

## Architecture Summary

| Schema | Tables | Purpose |
|--------|--------|---------|
| `ins_auth` | roles, users, user_sessions | Identity, 7-role RBAC, JWT sessions |
| `ins_product` | insurance_products, plans, plan_coverages, addons | Product & plan catalog |
| `ins_rule` | rule_definitions, rule_conditions | DB-driven risk/pricing rule engine |
| `ins_policy` | quotes, travelers, policies, policy_snapshots, policy_agent_bindings | Full quote-to-policy lifecycle |
| `ins_uw` | uw_cases, uw_events | Single-tier underwriting queue |
| `ins_claims` | claims, claim_documents, claim_events | Claims lifecycle |
| `ins_field` | field_investigations | Field investigation management |
| `ins_document` | document_templates, generated_documents | Policy/claim document generation |
| `ins_notification` | notifications | RBAC-routed in-app notifications |
| `ins_audit` | audit_logs | Immutable platform audit trail |
| `ins_workflow` | platform_configurations | Unified key-value config store |

---

## ER Diagram

```mermaid
erDiagram

  %% ─── ins_auth ────────────────────────────────────────────────────────────

  roles {
    UUID id PK
    VARCHAR role_code UK
    VARCHAR role_name
    VARCHAR portal_path
    BOOLEAN is_active
  }

  users {
    UUID id PK
    VARCHAR email UK
    VARCHAR full_name
    VARCHAR role FK
    VARCHAR status
    JSONB pending_profile_changes
    VARCHAR mobile
    DATE date_of_birth
    CHAR nationality
    TIMESTAMPTZ created_at
  }

  user_sessions {
    UUID id PK
    UUID user_id FK
    VARCHAR refresh_token_hash
    VARCHAR ip_address
    TIMESTAMPTZ expires_at
    BOOLEAN is_revoked
  }

  %% ─── ins_product ─────────────────────────────────────────────────────────

  insurance_products {
    UUID id PK
    VARCHAR product_code UK
    VARCHAR product_name
    VARCHAR type_code
    BOOLEAN is_active
    DATE launch_date
  }

  plans {
    UUID id PK
    VARCHAR plan_code UK
    VARCHAR plan_name
    UUID product_id FK
    DECIMAL base_premium
    DECIMAL daily_rate
    TEXT_ARRAY zone_codes
    JSONB premium_breakdown_config
    VARCHAR status
    INT min_trip_days
    INT max_trip_days
    INT max_travelers
  }

  plan_coverages {
    UUID id PK
    UUID plan_id FK
    VARCHAR coverage_code
    VARCHAR coverage_name
    VARCHAR coverage_category
    DECIMAL min_limit
    DECIMAL max_limit
    DECIMAL default_limit
    BOOLEAN is_mandatory
    BOOLEAN is_adjustable
    INT sort_order
  }

  addons {
    UUID id PK
    VARCHAR addon_code UK
    VARCHAR addon_name
    VARCHAR addon_category
    VARCHAR pricing_type
    DECIMAL pricing_value
    TEXT_ARRAY compatible_plan_codes
    BOOLEAN is_active
  }

  %% ─── ins_rule ────────────────────────────────────────────────────────────

  rule_definitions {
    UUID id PK
    VARCHAR rule_code
    VARCHAR rule_name
    VARCHAR rule_type
    INT priority
    VARCHAR status
    BOOLEAN is_active
    BOOLEAN stop_on_match
    VARCHAR logical_operator
    JSONB actions_config
    DATE effective_from
    DATE effective_to
  }

  rule_conditions {
    UUID id PK
    UUID rule_id FK
    INT group_number
    VARCHAR group_operator
    VARCHAR field_name
    VARCHAR operator
    VARCHAR field_value
    VARCHAR field_value2
    TEXT value_list
    INT sort_order
  }

  %% ─── ins_policy ──────────────────────────────────────────────────────────

  quotes {
    UUID id PK
    VARCHAR quote_reference UK
    UUID customer_id FK
    UUID plan_id FK
    CHAR destination_country_code
    DATE trip_start_date
    DATE trip_end_date
    INT trip_duration_days
    INT num_travelers
    VARCHAR trip_purpose
    DECIMAL total_premium
    NUMERIC risk_score
    JSONB premium_breakdown
    JSONB selections_json
    VARCHAR status
    TIMESTAMPTZ expires_at
  }

  travelers {
    UUID id PK
    VARCHAR context_type
    UUID context_id
    INT traveler_sequence
    VARCHAR full_name
    DATE date_of_birth
    INT age
    VARCHAR age_band
    BOOLEAN is_primary
    BOOLEAN has_preexisting_condition
    BOOLEAN has_adventure_activity
    NUMERIC individual_risk_score
  }

  policies {
    UUID id PK
    VARCHAR policy_number UK
    UUID quote_id FK
    UUID customer_id FK
    UUID plan_id FK
    CHAR destination_country_code
    DATE trip_start_date
    DATE trip_end_date
    INT trip_duration_days
    DECIMAL total_premium
    NUMERIC risk_score
    VARCHAR status
    JSONB coverage_details
    JSONB premium_breakdown
    TIMESTAMPTZ issue_date
    DATE expiry_date
    VARCHAR payment_reference
  }

  policy_snapshots {
    UUID id PK
    UUID policy_id FK
    INT snapshot_version
    VARCHAR snapshot_type
    JSONB snapshot_data
    TIMESTAMPTZ snapshotted_at
  }

  policy_agent_bindings {
    UUID id PK
    UUID policy_id FK_UK
    UUID agent_user_id FK
    VARCHAR agent_code
    NUMERIC commission_rate
    DECIMAL commission_amount
    VARCHAR commission_status
  }

  %% ─── ins_uw ──────────────────────────────────────────────────────────────

  uw_cases {
    UUID id PK
    VARCHAR case_reference UK
    UUID policy_id FK_UK
    UUID customer_id FK
    NUMERIC risk_score
    VARCHAR risk_level
    VARCHAR status
    UUID assigned_to
    VARCHAR decision
    TEXT forward_reason
    TIMESTAMPTZ sla_due_at
  }

  uw_events {
    BIGINT id PK
    UUID case_id FK
    VARCHAR event_type
    VARCHAR from_status
    VARCHAR to_status
    JSONB event_data
    UUID performed_by
    TIMESTAMPTZ performed_at
  }

  %% ─── ins_claims ──────────────────────────────────────────────────────────

  claims {
    UUID id PK
    VARCHAR claim_reference UK
    UUID policy_id FK
    UUID customer_id FK
    UUID policy_snapshot_id
    VARCHAR claim_type_code
    VARCHAR status
    DATE incident_date
    DECIMAL claimed_amount
    DECIMAL approved_amount
    BOOLEAN is_high_value
    BOOLEAN field_investigation_required
    VARCHAR priority
    TIMESTAMPTZ sla_due_at
  }

  claim_documents {
    UUID id PK
    UUID claim_id FK
    VARCHAR document_type_code
    VARCHAR document_name
    VARCHAR storage_key
    UUID uploaded_by
    BOOLEAN is_verified
  }

  claim_events {
    BIGINT id PK
    UUID claim_id FK
    VARCHAR event_type
    VARCHAR from_status
    VARCHAR to_status
    JSONB event_data
    UUID performed_by
    TIMESTAMPTZ performed_at
  }

  %% ─── ins_field ───────────────────────────────────────────────────────────

  field_investigations {
    UUID id PK
    VARCHAR investigation_reference UK
    UUID claim_id FK
    UUID assigned_officer_id
    UUID assigned_by
    VARCHAR status
    VARCHAR priority
    VARCHAR investigation_type
    TEXT findings
    VARCHAR recommendation
    JSONB evidence_docs
    TIMESTAMPTZ due_at
    BOOLEAN sla_breached
  }

  %% ─── ins_document ────────────────────────────────────────────────────────

  document_templates {
    UUID id PK
    VARCHAR template_code UK
    VARCHAR template_name
    VARCHAR document_category
    INT current_version_number
    TEXT current_content
    VARCHAR output_format
    JSONB version_history
    BOOLEAN is_active
  }

  generated_documents {
    UUID id PK
    VARCHAR document_reference UK
    UUID template_id FK
    INT template_version
    VARCHAR entity_type
    UUID entity_id
    UUID customer_id
    VARCHAR document_name
    VARCHAR storage_key
    BOOLEAN is_latest_version
  }

  %% ─── ins_notification ────────────────────────────────────────────────────

  notifications {
    UUID id PK
    VARCHAR notification_ref UK
    VARCHAR event_code
    VARCHAR title
    TEXT body
    VARCHAR target_role
    UUID target_user_id
    VARCHAR entity_type
    UUID entity_id
    VARCHAR priority
    VARCHAR delivery_channel
    VARCHAR delivery_status
    BOOLEAN is_read
    TIMESTAMPTZ created_at
  }

  %% ─── ins_audit ───────────────────────────────────────────────────────────

  audit_logs {
    BIGINT id PK
    TIMESTAMPTZ event_time
    VARCHAR service_name
    VARCHAR action
    UUID actor_user_id
    VARCHAR actor_role
    VARCHAR entity_type
    VARCHAR entity_id
    JSONB old_values
    JSONB new_values
    VARCHAR result
  }

  %% ─── ins_workflow ────────────────────────────────────────────────────────

  platform_configurations {
    UUID id PK
    VARCHAR config_key UK
    TEXT config_value
    VARCHAR value_type
    VARCHAR group_name
    VARCHAR description
    BOOLEAN is_active
    TIMESTAMPTZ updated_at
  }

  %% ─── Relationships ───────────────────────────────────────────────────────

  roles ||--o{ users : "role = role_code"
  users ||--o{ user_sessions : "user_id"

  insurance_products ||--o{ plans : "product_id"
  plans ||--o{ plan_coverages : "plan_id"

  rule_definitions ||--o{ rule_conditions : "rule_id"

  quotes ||--o{ policies : "quote_id"
  quotes ||--o{ travelers : "context_id (QUOTE)"
  policies ||--o{ travelers : "context_id (POLICY)"
  policies ||--o{ policy_snapshots : "policy_id"
  policies ||--o| policy_agent_bindings : "policy_id"
  policies ||--o| uw_cases : "policy_id"
  uw_cases ||--o{ uw_events : "case_id"
  policies ||--o{ claims : "policy_id"
  claims ||--o{ claim_documents : "claim_id"
  claims ||--o{ claim_events : "claim_id"
  claims ||--o{ field_investigations : "claim_id"
  document_templates ||--o{ generated_documents : "template_id"
```

---

## Key Design Decisions

### Removed Tables (vs. prior 45-table design)

| Removed Table | Absorbed Into |
|---|---|
| `product_types` | `insurance_products.type_code` (inline enum) |
| `coverage_types` | `plan_coverages.coverage_code/name` (inline) |
| `destination_zones` / `zone_countries` | `plans.zone_codes TEXT[]` + `platform_configurations` |
| `permissions` / `role_permissions` | `users.role` (single column FK to roles) |
| `otp_tokens` | Removed — email+password login only |
| `claim_types` | `claims.claim_type_code` (inline enum) |
| `claim_doc_checklist_config` | `platform_configurations` (group: CLAIMS) |
| `claim_sla_config` | `platform_configurations` (group: SLA) |
| `notification_templates` | Inline in `notifications`; config in `platform_configurations` |
| `workflow_definitions` / `workflow_states` / `workflow_transitions` | `platform_configurations` (group: WORKFLOW) |
| `risk_routing_config` | `platform_configurations` (group: RISK_ROUTING) |
| `coverage_limit_risk_multipliers` | `platform_configurations` (group: RISK_MULTIPLIER) |
| `rule_condition_groups` | `rule_conditions.group_number + group_operator` |
| `rule_actions` | `rule_definitions.actions_config JSONB` |
| `quote_travelers` / `policy_travelers` | Unified `travelers` table (context_type discriminator) |
| `agent_commissions` | `policy_agent_bindings` (1:1 with policy) |
| `uw_case_history` / `uw_notes` | `uw_events` (event_type discriminator) |
| `claim_workflow_history` / `claim_decisions` / `claim_payments` / `claim_adjuster_notes` | `claim_events` |
| `field_assignments` / `field_reports` / `field_evidence_documents` | `field_investigations` |
| `document_template_versions` | `document_templates.version_history JSONB` |
| `ROLE_ADMIN` portal | Absorbed into `ROLE_UNDERWRITER` (underwriter portal) |
| `ROLE_UNDERWRITER_L1` / `ROLE_UNDERWRITER_L2` | Single `ROLE_UNDERWRITER` |

### JSONB Strategy
Columns stored as JSONB (non-queryable, used for display/processing only):
- `policies.coverage_details` / `policies.premium_breakdown` — locked at issuance
- `policy_snapshots.snapshot_data` — full immutable policy state (claims read from here)
- `quotes.premium_breakdown` / `quotes.selections_json` — quote calculation detail
- `rule_definitions.actions_config` — rule action array (replaces rule_actions table)
- `field_investigations.evidence_docs` — photo/doc attachment list
- `platform_configurations.config_value` (type=JSON) — structured config entries

### Risk Score Visibility
`risk_score` and `risk_level` exist in `quotes`, `policies`, `uw_cases`, and `travelers` but **must not be exposed to ROLE_CUSTOMER**. The customer portal shows "Under Review" for all pending statuses.

### platform_configurations Groups
| group_name | Contents |
|---|---|
| `PRICING` | GST rate, online discount, traveler multipliers, commission rates |
| `RISK_ROUTING` | Score-to-status bands (0-30=ACTIVE, 31-50=PENDING_REVIEW, 51+=PENDING_UW) |
| `RISK_MULTIPLIER` | Coverage slider max caps per risk band |
| `SLA` | Claim and UW SLA hours by priority |
| `WORKFLOW` | Policy/UW/claims state machine definitions (JSON) |
| `ZONES` | Destination zone definitions + country lists |
| `PRODUCT_FORMS` | Per-product-type form field config |
| `CLAIMS` | Claim type definitions + doc checklists |
| `NOTIFICATIONS` | Event-to-role mappings, channel config, retention |
| `SECURITY` | Login lockout, session TTL, password policy |
| `GENERAL` | Misc platform settings |
