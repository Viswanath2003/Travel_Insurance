# CURRENT STATE

**Last Updated:** 2026-05-13

---

## Completed

### Phase A — Frontend Improvements (Customer + Admin Portals)
- Add-ons dialog modal with category grouping and per-plan filtering
- Rule engine localStorage editing with live preview in Admin portal
- Customer profile edit with admin-approval flow and OTP verification
- All 13 items in the admin/customer portal improvement list

### Phase B — PostgreSQL Database Architecture

#### DDL Schema Files (`database/schema/`)
| File | Schema | Tables | Status |
|------|--------|--------|--------|
| `V00__init_postgresql.sql` | All | Schemas, roles, service accounts, DEFAULT PRIVILEGES | Done |
| `V01__common_functions.sql` | ins_common | Trigger functions (set_updated_at) | Done |
| `auth/V02__auth_schema.sql` | ins_auth | users, roles, permissions, sessions, OTP, customer_profiles, profile_change_requests | Done |
| `product/V03__product_schema.sql` | ins_product | product_types, products, plans, coverage_types, plan_coverages, addons, plan_addons, destination_zones, zone_countries, plan_form_config, coverage_limit_risk_multipliers | Done |
| `rule_engine/V04__rule_engine_schema.sql` | ins_rule | rule_definitions, rule_condition_groups, rule_conditions, rule_actions, rule_versions, rule_execution_logs | Done |
| `policy/V05__policy_schema.sql` | ins_policy | quotes, policies, policy_status_history, policy_snapshots, policy_travelers, policy_documents, policy_agent_bindings, agent_commissions | Done |
| `underwriting/V06__underwriting_schema.sql` | ins_underwriting | uw_cases, uw_case_history, uw_case_notes, uw_risk_assessments, uw_conditions | Done |
| `claims/V07__claims_schema.sql` | ins_claims | claim_types, claims, claim_travelers, claim_documents, claim_doc_checklist_config, claim_checklist_status, claim_workflow_history, claim_decisions, claim_adjuster_notes, claim_payments, claim_snapshots, claim_sla_config | Done |
| `field/V08__field_schema.sql` | ins_field | field_assignments, field_reports, field_evidence_documents | Done |
| `document/V09__document_schema.sql` | ins_document | document_templates, document_template_versions, generated_documents, document_versions | Done |
| `notification/V10__notification_schema.sql` | ins_notification | notification_templates, notifications, notification_delivery_log | Done |
| `audit/V11__audit_schema.sql` | ins_audit | audit_logs (partitioned, RLS enforced) | Done |
| `workflow/V12__workflow_schema.sql` | ins_workflow | workflow_definitions, workflow_states, workflow_transitions, risk_routing_config, coverage_limit_risk_multipliers, platform_configurations, rm_client_portfolios | Done |

#### Seed Data Files (`database/seed/`)
| File | Contents | Status |
|------|----------|--------|
| `V20__seed_roles_permissions.sql` | 9 roles, 39 permissions, all role-permission mappings | Done |
| `V21__seed_product_catalog.sql` | 1 product type, 1 product, 6 plans, 15 coverage types, 7 add-ons, 8 destination zones | Done |
| `V22__seed_rules.sql` | 7 rule definitions, condition groups, conditions, actions; risk routing config; coverage multipliers; 14 platform configurations | Done |
| `V23__seed_workflow_definitions.sql` | 3 workflow state machines (Policy Issuance 11 states, Underwriting 11 states, Claims 15 states) | Done |
| `V24__seed_claim_types_and_sla.sql` | 9 claim types, document checklist configs, SLA configurations | Done |
| `V25__seed_notification_templates.sql` | 23 notification templates covering all portal events | Done |

#### Reference Documentation (`generated-reference/`)
| File | Contents | Status |
|------|----------|--------|
| `PHASE1_ANALYSIS.md` | Gap analysis, MySQL→PostgreSQL conversion decisions, entity mapping, identified risks | Done |
| `POSTGRESQL_OPTIMIZATION.md` | Index strategy, GIN/partial indexes, partitioning, VACUUM tuning, PgBouncer config, query patterns | Done |
| `SCHEMA_BREAKDOWN.md` | 68-table inventory, new-vs-MySQL comparison, cross-service boundary map, design decisions | Done |

---

## Pending

### Phase C — Backend Services (Java Spring Boot)
- auth-service (JWT, OTP, profile approval workflow)
- product-service (plan/coverage catalog API)
- rule-engine-service (rule evaluation, execution log)
- policy-service (quote → payment → policy lifecycle)
- underwriting-service (UW case state machine)
- claims-service (claim lifecycle, SLA tracking)
- field-service (assignment and report management)
- document-service (PDF generation from templates)
- notification-service (role-based in-app delivery)
- audit-service (append-only audit log writer)

### Phase D — API Gateway & Service Mesh
- Spring Cloud Gateway configuration
- Inter-service authentication (service accounts)
- Rate limiting and circuit breakers

### Phase E — DevOps & Deployment
- Docker Compose for local development
- Flyway migration pipeline
- CI/CD configuration
