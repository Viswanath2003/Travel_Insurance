# Enterprise Architecture
## Travel Insurance Administration Platform

**Version:** 1.0  
**Date:** 2026-05-07  
**Status:** Approved for Implementation  
**Source of Truth:** UI Sprint Document + Wireframes

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Service Responsibilities](#2-service-responsibilities)
3. [Inter-Service Communication](#3-inter-service-communication)
4. [Module Ownership](#4-module-ownership)
5. [Shared Libraries Strategy](#5-shared-libraries-strategy)
6. [Authentication Architecture](#6-authentication-architecture)
7. [Authorization Architecture](#7-authorization-architecture)
8. [Document Generation Flow](#8-document-generation-flow)
9. [Rule Engine Flow](#9-rule-engine-flow)
10. [Claims Workflow](#10-claims-workflow)
11. [Underwriting Workflow](#11-underwriting-workflow)
12. [Notification Workflow](#12-notification-workflow)
13. [Audit Architecture](#13-audit-architecture)
14. [Configuration Management Strategy](#14-configuration-management-strategy)
15. [Deployment Strategy](#15-deployment-strategy)

---

## 1. System Overview

### 1.1 High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          TRAVEL INSURANCE PLATFORM                              │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        ANGULAR SPA (Single Page Application)            │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │   │
│  │  │ Customer │ │  Admin   │ │  Under-  │ │  Claims  │ │    Field /   │ │   │
│  │  │  Portal  │ │  Portal  │ │  writer  │ │  Officer │ │   Finance    │ │   │
│  │  │          │ │          │ │  Portal  │ │  Portal  │ │   Portals    │ │   │
│  └──┴──────────┴─┴──────────┴─┴──────────┴─┴──────────┴─┴──────────────┴─┘   │
│                                      │                                          │
│                              HTTPS / REST                                       │
│                                      │                                          │
│  ┌───────────────────────────────────▼─────────────────────────────────────┐   │
│  │                         API GATEWAY SERVICE                             │   │
│  │          JWT Validation  ·  Route Dispatch  ·  CORS  ·  Logging        │   │
│  └──────┬──────────┬──────────┬───────────┬────────────┬────────────┬─────┘   │
│         │          │          │           │            │            │          │
│    ┌────▼───┐ ┌────▼───┐ ┌───▼────┐ ┌───▼────┐ ┌────▼───┐ ┌──────▼────┐    │
│    │  Auth  │ │Product │ │Pricing │ │ Rule   │ │ Policy │ │Underwrite │    │
│    │Service │ │Service │ │Service │ │Engine  │ │Service │ │  Service  │    │
│    └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └───────────┘    │
│                                                                               │
│    ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌───────────┐    │
│    │ Claims │ │ Field  │ │Document│ │Notifi- │ │ Audit  │ │ Reporting │    │
│    │Service │ │Service │ │Service │ │cation  │ │Service │ │  Service  │    │
│    └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └───────────┘    │
│                                      │                                          │
│  ┌───────────────────────────────────▼─────────────────────────────────────┐   │
│  │                    MYSQL DATABASE CLUSTER (Local)                       │   │
│  │    auth_db  │  product_db  │  policy_db  │  claims_db  │  reporting_db │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│  ┌───────────────────────────────────▼─────────────────────────────────────┐   │
│  │               LOCAL FILESYSTEM  /storage/documents/                    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Stakeholder-to-Portal Mapping

```
┌─────────────────────────────────────────────────────────────────────┐
│                    STAKEHOLDER → PORTAL → ROLE MAP                  │
├──────────────────┬──────────────────────┬───────────────────────────┤
│ Stakeholder      │ Portal Module        │ Spring Role               │
├──────────────────┼──────────────────────┼───────────────────────────┤
│ Customer         │ /customer            │ ROLE_CUSTOMER             │
│ Agent / Broker   │ /agent               │ ROLE_AGENT                │
│ Underwriter L1   │ /underwriting        │ ROLE_UNDERWRITER_L1       │
│ Underwriter L2   │ /underwriting        │ ROLE_UNDERWRITER_L2       │
│ Claims Officer   │ /claims-officer      │ ROLE_CLAIMS_OFFICER       │
│ Field Officer    │ /field               │ ROLE_FIELD_OFFICER        │
│ Finance Officer  │ /finance             │ ROLE_FINANCE              │
│ Admin            │ /admin               │ ROLE_ADMIN                │
│ Super Admin      │ /admin               │ ROLE_SUPERADMIN           │
└──────────────────┴──────────────────────┴───────────────────────────┘
```

### 1.3 Service Port Allocation

```
┌──────────────────────────┬────────┬──────────────────────────────┐
│ Service                  │ Port   │ Context Path                 │
├──────────────────────────┼────────┼──────────────────────────────┤
│ api-gateway-service      │ 8080   │ /api                         │
│ auth-service             │ 8081   │ /api/auth                    │
│ product-service          │ 8082   │ /api/products                │
│ pricing-service          │ 8083   │ /api/pricing                 │
│ rule-engine-service      │ 8084   │ /api/rules                   │
│ policy-service           │ 8085   │ /api/policies                │
│ underwriting-service     │ 8086   │ /api/underwriting            │
│ claims-service           │ 8087   │ /api/claims                  │
│ field-service            │ 8088   │ /api/field                   │
│ document-service         │ 8089   │ /api/documents               │
│ notification-service     │ 8090   │ /api/notifications           │
│ audit-service            │ 8091   │ /api/audit                   │
│ reporting-service        │ 8092   │ /api/reports                 │
│ Angular SPA (dev)        │ 4200   │ /                            │
└──────────────────────────┴────────┴──────────────────────────────┘
```

---

## 2. Service Responsibilities

### 2.1 api-gateway-service

**Purpose:** Single entry point for all Angular SPA traffic. Provides cross-cutting concerns without duplicating them in every downstream service.

**Responsibilities:**
- Route incoming HTTP requests to the appropriate microservice
- Validate JWT tokens centrally (forward userId + roles as internal headers)
- Enforce CORS policy for Angular SPA origin
- Apply rate limiting per IP / per user
- Attach `X-Correlation-ID` to every request for distributed tracing
- Return standardized error responses for gateway-level failures (401, 403, 429, 503)

**Does NOT own:**
- Business logic of any kind
- Persistence — stateless
- Authorization decisions beyond token validity (permission checks remain in downstream services)

**Database:** None

---

### 2.2 auth-service

**Purpose:** Identity provider for the platform. Issues and validates JWTs, manages user lifecycle.

**Responsibilities:**
- User registration with validation (unique email, username, password complexity)
- Login with account lockout after 5 failed attempts
- JWT access token issuance (15-minute expiry) and refresh token management (7-day expiry)
- OTP generation, dispatch (via notification-service), and validation for forgot-password and profile-update flows
- Password reset with history enforcement (no reuse of last 5 passwords)
- Session management — tracking active sessions, force logout
- User CRUD for Admin (activate/deactivate accounts)
- Role assignment to users (Admin function)

**Database tables owned:** `users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `user_sessions`, `otp_tokens`, `password_history`

**Exposes:**
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/verify-otp`
- `POST /auth/reset-password`
- `GET /auth/me`
- `PUT /auth/profile` (triggers OTP if email/mobile changes)
- `GET /auth/users` (Admin)
- `POST /auth/users/{id}/assign-role` (Admin)
- `POST /auth/users/{id}/deactivate` (Admin)
- `GET /auth/validate-token` (internal — called by gateway)

---

### 2.3 product-service

**Purpose:** Master configuration registry for all insurance products, plans, coverages, add-ons, and destination zones. This is the product catalog — every other domain references it.

**Responsibilities:**
- CRUD for product types (Student, Family, Corporate, etc.) — fully configurable, never hardcoded
- CRUD for plans (name, code, base premium, zone mappings, status)
- Coverage configuration per plan (coverage type, min/max/default limits, mandatory flag)
- Add-on catalog management (name, code, category, pricing type, value, status)
- Plan-to-addon mapping management
- Destination zones and country-to-zone assignment
- Plan-to-zone mapping
- Plan versioning — each configuration change creates a new version; old versions remain for historical policy references
- Plan availability filtering (active plans by zone, product type, date)

**Database tables owned:** `product_types`, `insurance_products`, `plans`, `plan_versions`, `coverage_types`, `plan_coverages`, `addons`, `plan_addon_mappings`, `destination_zones`, `zone_countries`, `plan_zone_mappings`

**Exposes:**
- `GET /products` (marketplace listing)
- `GET /products/{id}/plans`
- `GET /plans/{id}` (plan detail with coverages)
- `GET /plans/{id}/addons`
- `GET /zones`
- `GET /zones/country/{countryCode}` (resolve zone for a country)
- Admin CRUD endpoints for all entities above

---

### 2.4 pricing-service

**Purpose:** Calculate the premium for a given quote context. Orchestrates calls to rule-engine-service and returns an itemized breakdown.

**Responsibilities:**
- Receive a PricingRequest (plan, zone, travelers, selected coverages, add-ons, trip dates)
- Call rule-engine-service to evaluate applicable PREMIUM rules
- Call rule-engine-service to evaluate applicable DISCOUNT rules
- Assemble itemized PricingBreakdown: base premium, risk surcharge per traveler, add-on costs, seasonal discounts, subtotals, total
- Return pricing result with full line-item detail AND rule execution trace (for display in UI-012 Dynamic Pricing)
- Never stores state — purely stateless calculation service

**Database tables owned:** None (stateless)

**Exposes:**
- `POST /pricing/calculate` (synchronous, returns breakdown immediately)
- `POST /pricing/recalculate` (used by policy-service on renewal)

---

### 2.5 rule-engine-service

**Purpose:** The DB-driven, custom rule evaluation engine. Evaluates any set of rules against a provided context and returns matched actions with full execution trace.

**Responsibilities:**
- CRUD for rule definitions (Admin-managed)
- CRUD for rule condition groups, conditions, and actions
- Rule versioning — immutable versions on publish; Admin creates draft → publishes
- Evaluate a context against all active rules of a given type (RISK / PREMIUM / DISCOUNT / ELIGIBILITY / CLAIM_AUTO_DECISION)
- Return: result value + list of all rule evaluations (matched and unmatched, with contribution of each matched rule) — this powers the explainability UI (UI-018, UI-035)
- Store execution log: every evaluation recorded with rule version used, input context snapshot, matched flag, contribution applied
- Configuration warning: if a new rule set would result in all policies routing to VERY_HIGH, flag it before save

**Database tables owned:** `rule_definitions`, `rule_condition_groups`, `rule_conditions`, `rule_actions`, `rule_versions`, `rule_execution_logs`

**Exposes:**
- `POST /rules/evaluate` (core evaluation endpoint — internal use by pricing-service, policy-service, claims-service)
- `GET /rules/execution-log/{contextId}` (fetch trace for a quote/policy/claim)
- Admin CRUD endpoints for rule management
- `POST /rules/preview` (test a rule against a sample context without persisting)

---

### 2.6 policy-service

**Purpose:** Owns the complete quote-to-policy lifecycle. The central domain service of the platform.

**Responsibilities:**
- Quote creation from user inputs (travel dates, travelers, destination, plan, coverages, add-ons)
- Quote expiry enforcement (48-hour validity)
- Immutable quote snapshot storage at creation time
- Risk evaluation: calls rule-engine-service for risk scoring, determines routing (auto-approve vs. UW)
- Premium calculation: calls pricing-service, stores breakdown on quote
- Policy issuance from confirmed quote: generates policy number, creates immutable policy snapshot
- Sets policy status: ACTIVE (low/medium risk) or PENDING_UNDERWRITING (high/very high risk)
- Triggers underwriting-service to create UW case for flagged policies
- Triggers document-service to generate policy schedule and wording PDFs on activation
- Policy renewal: re-runs pricing and risk, links to parent policy
- Policy cancellation request: transitions status, forwards to Admin/Officer workflow
- My Policies queries: paginated list with status filters
- Endorsement tracking (future)

**Database tables owned:** `quotes`, `quote_travelers`, `quote_addon_selections`, `quote_snapshots`, `policies`, `policy_travelers`, `policy_addon_selections`, `policy_coverage_details`, `policy_snapshots`, `policy_wordings`, `policy_status_history`

**Exposes:**
- `POST /quotes`
- `GET /quotes/{id}`
- `POST /policies` (from confirmed quote)
- `GET /policies/{id}`
- `GET /policies/my` (customer's own policies)
- `POST /policies/{id}/renew`
- `POST /policies/{id}/cancel-request`
- `GET /policies/{id}/documents`
- Internal: `GET /policies/{id}/snapshot` (used by claims-service for coverage validation)

---

### 2.7 underwriting-service

**Purpose:** Manages the underwriting workflow for high-risk and very-high-risk policies. Implements the configurable state machine for the UW process.

**Responsibilities:**
- Receive routing from policy-service when a policy requires underwriting
- Create and manage UW workflow instances (the "box queue")
- Assign cases to Underwriter L1 (auto-assign by queue load or manual Admin assignment)
- SLA tracking per case — escalate on breach via scheduled task
- Concurrent access locking — prevent two underwriters from acting on the same case simultaneously
- Decision processing: Approve / Approve with Premium Loading / Refer to L2 / Reject
- Escalation to L2: creates escalation record, reassigns case
- UW notes management (mandatory comments on every action)
- Notify policy-service of final decision (activates or rejects policy)
- Trigger notification-service on each state change
- Expose audit trail of all UW actions per case (UI-021)
- Configure SLA hours per risk level (Admin-managed)

**Database tables owned:** `uw_workflow_instances`, `uw_workflow_history`, `uw_notes`, `uw_escalations`, `uw_sla_configurations`, `uw_assignment_rules`

**Exposes:**
- `GET /underwriting/queue` (paginated, filtered — Underwriter view)
- `GET /underwriting/cases/{caseId}`
- `GET /underwriting/cases/{caseId}/risk-details` (includes rule trace)
- `POST /underwriting/cases/{caseId}/assign`
- `POST /underwriting/cases/{caseId}/approve`
- `POST /underwriting/cases/{caseId}/approve-with-loading`
- `POST /underwriting/cases/{caseId}/refer-l2`
- `POST /underwriting/cases/{caseId}/reject`
- `POST /underwriting/cases/{caseId}/request-info`
- `GET /underwriting/cases/{caseId}/audit-trail`
- Admin: `PUT /underwriting/sla-config`

---

### 2.8 claims-service

**Purpose:** End-to-end claims lifecycle management, from customer submission to settlement.

**Responsibilities:**
- Claim submission: validate active policy, create claim record, accept document uploads
- Retrieve and validate coverage against policy snapshot (calls policy-service)
- Document checklist validation per claim type (configurable by Admin)
- Auto-decision engine: calls rule-engine-service (CLAIM_AUTO_DECISION type) for low-value claims
- Route to Claims Officer queue for manual review
- Coverage validation report generation (UI-044)
- Claims Officer queue management with priority flagging for high-value claims
- Claim review: document viewer, coverage display
- Claim decision: Approve / Partially Approve / Decline with mandatory reason
- Field investigation trigger: calls field-service to assign investigation
- SLA tracking on claims
- Payment recording (mock) on approved/partially-approved claims
- Trigger document-service to generate assessment report PDF
- Claim status history for customer tracking (UI-023 timeline)

**Database tables owned:** `claims`, `claim_travelers`, `claim_documents`, `claim_document_checklists`, `claim_checklist_types`, `claim_workflow_instances`, `claim_workflow_history`, `claim_decisions`, `claim_payments`, `claim_auto_decision_log`

**Exposes:**
- `POST /claims` (submit)
- `POST /claims/{id}/documents` (upload evidence)
- `GET /claims/{id}` (customer tracking)
- `GET /claims/my` (customer's claims list)
- `GET /claims/queue` (Claims Officer queue)
- `GET /claims/{id}/coverage-validation`
- `GET /claims/{id}/document-checklist`
- `POST /claims/{id}/assign-officer`
- `POST /claims/{id}/approve`
- `POST /claims/{id}/partially-approve`
- `POST /claims/{id}/decline`
- `POST /claims/{id}/request-field-investigation`
- `POST /claims/{id}/record-payment`
- `GET /claims/overview` (funnel stats for Claims Officer dashboard)

---

### 2.9 field-service

**Purpose:** Manages field investigation assignments, field officer task management, and evidence report submission.

**Responsibilities:**
- Receive investigation assignment request from claims-service
- Assign to available field officer (manual or rule-based on claim type/location)
- Field Officer task queue — today's assignments, in-progress, completed
- Field report submission: structured report + evidence document uploads
- Report forwarding to claims-service on completion
- Field officer workload dashboard

**Database tables owned:** `field_assignments`, `field_reports`, `field_evidence_documents`, `field_assignment_history`

**Exposes:**
- `POST /field/assignments` (from claims-service)
- `GET /field/assignments/my` (Field Officer's queue)
- `GET /field/assignments/{id}`
- `POST /field/assignments/{id}/accept`
- `POST /field/assignments/{id}/complete` (submits field report)
- `POST /field/assignments/{id}/documents` (evidence upload)
- `GET /field/dashboard` (Field Officer summary)

---

### 2.10 document-service

**Purpose:** Template management and PDF document generation. Responsible for all generated documents and their versioned storage on the local filesystem.

**Responsibilities:**
- Document template CRUD (Admin-managed) with version history
- Template content stored as HTML with `${variable.path}` placeholders
- Accept generation requests with reference ID (policy, claim, quote) and document type
- Fetch required data from appropriate snapshot (via policy-service or claims-service internal calls)
- Resolve all template variables from snapshot data
- Convert resolved HTML to PDF using iText 7 Community
- Store generated PDF on local filesystem at deterministic path
- Persist document metadata (path, version, generation timestamp) in DB
- Serve document download (stream from filesystem)
- Track document versions (re-generation creates a new version, e.g., post-endorsement)

**Database tables owned:** `document_templates`, `document_template_versions`, `generated_documents`, `document_versions`

**Exposes:**
- `POST /documents/generate` (generate a document for a reference)
- `GET /documents/{id}/download` (stream PDF)
- `GET /documents/reference/{type}/{referenceId}` (list documents for a policy/claim)
- Admin: `GET/POST/PUT /documents/templates`

---

### 2.11 notification-service

**Purpose:** Centralized event-driven notification dispatch. In-app notification store and template-based message composition.

**Responsibilities:**
- Receive notification trigger requests from other services (via REST)
- Look up notification template by event type
- Resolve template variables from the event payload
- Persist in-app notification to DB
- Dispatch email (mock SMTP or log-to-file in local deployment)
- Mark notifications as read when user fetches them
- Notification center data for customer/officer portals (UI-042)

**Database tables owned:** `notification_templates`, `notifications`, `notification_delivery_log`

**Exposes:**
- `POST /notifications/trigger` (internal — called by all services)
- `GET /notifications/my` (authenticated user's inbox)
- `PUT /notifications/{id}/read`
- `PUT /notifications/read-all`
- `GET /notifications/unread-count`

---

### 2.12 audit-service

**Purpose:** Immutable, append-only audit trail for all significant platform events. Provides governance and compliance reporting.

**Responsibilities:**
- Accept audit event records from all services (via REST)
- Store events in append-only table (no updates, no deletes allowed, enforced at DB + service level)
- Provide query interface: filter by entity type, entity ID, user, date range, action type
- Power the Audit Viewer (UI-040) and Audit Trail in underwriting (UI-021)
- Support compliance exports

**Database tables owned:** `audit_logs`

**Exposes:**
- `POST /audit/events` (internal — all services call this)
- `GET /audit/events` (Admin query with filters)
- `GET /audit/events/entity/{type}/{id}` (all events for a specific policy/claim)
- `GET /audit/events/user/{userId}`

---

### 2.13 reporting-service

**Purpose:** Aggregated dashboards, business metrics, and governance reports. Read-optimized; does not own transactional data but queries across other services' databases.

**Responsibilities:**
- Policy dashboard metrics (UI-036): total policies, active, pending UW, revenue
- Claims dashboard metrics (UI-037): submitted, under review, approved, declined, settlement amounts
- Finance dashboard: premium collection, claim payouts, fund balance, loss ratio
- Fund management report: period-wise revenue vs. payout
- Governance dashboard: RBAC summary, audit event counts, SLA compliance
- User management reports
- Decision explanation report (UI-035): fetch rule execution trace for a given policy/claim
- Travel flag monitor (regulatory flagging)

**Database access:** Read-only queries across policy_db, claims_db, auth_db, rule_engine_db (shared MySQL instance, separate schemas)

**Exposes:**
- `GET /reports/policy-dashboard`
- `GET /reports/claims-dashboard`
- `GET /reports/finance-dashboard`
- `GET /reports/fund-management`
- `GET /reports/governance`
- `GET /reports/decision-explanation/{contextId}`
- `GET /reports/user-management`

---

## 3. Inter-Service Communication

### 3.1 Service Dependency Graph

```
                         ┌──────────────┐
                         │  API GATEWAY │
                         └──────┬───────┘
                                │ routes to all services
          ┌─────────────────────┼─────────────────────────────────┐
          │                     │                                  │
   ┌──────▼──────┐      ┌───────▼──────┐              ┌──────────▼────────┐
   │    Auth     │      │   Product    │              │     Reporting     │
   │   Service   │      │   Service    │              │     Service       │
   └─────────────┘      └──────────────┘              └───────────────────┘
                                                       reads: policy_db
                                                       reads: claims_db
                                                       reads: rule_db
                                                       reads: auth_db

   ┌─────────────┐      ┌──────────────┐
   │    Rule     │◄─────│   Pricing    │
   │   Engine    │      │   Service    │
   │   Service   │◄─────┤              │
   └──────┬──────┘      └──────────────┘
          │                     ▲
          │ evaluate rules       │ calculate premium
          │                     │
   ┌──────▼──────────────────────┐
   │        Policy Service       │
   │  (Quote → Policy lifecycle) │
   └──────┬──────────────────────┘
          │                            
          ├──────────────► underwriting-service  (route high-risk)
          ├──────────────► document-service      (generate policy docs on activation)
          ├──────────────► audit-service         (log policy events)
          └──────────────► notification-service  (notify on status changes)

   ┌───────────────────────────────────────┐
   │          Underwriting Service         │
   └──────────┬────────────────────────────┘
              ├──► policy-service          (notify final decision)
              ├──► rule-engine-service     (fetch risk trace for UI-018)
              ├──► audit-service           (log UW actions)
              └──► notification-service    (notify on UW decisions)

   ┌───────────────────────────────────────┐
   │            Claims Service             │
   └──────────┬────────────────────────────┘
              ├──► policy-service          (fetch policy snapshot for coverage validation)
              ├──► rule-engine-service     (auto-decision evaluation)
              ├──► field-service           (trigger investigation)
              ├──► document-service        (generate assessment report)
              ├──► audit-service           (log claim events)
              └──► notification-service    (notify on claim status changes)

   ┌───────────────────────────────────────┐
   │             Field Service             │
   └──────────┬────────────────────────────┘
              ├──► claims-service          (report completion callback)
              ├──► document-service        (generate field report PDF)
              ├──► audit-service           (log field actions)
              └──► notification-service    (notify assignment/completion)

   ┌───────────────────────────────────────┐
   │          Document Service             │
   └──────────┬────────────────────────────┘
              ├──► policy-service          (fetch policy snapshot for template variables)
              └──► claims-service          (fetch claim snapshot for template variables)
```

### 3.2 Communication Patterns

```
┌───────────────────────────────────────────────────────────────────┐
│                    COMMUNICATION PATTERNS                         │
├─────────────────────────────┬─────────────────────────────────────┤
│ Pattern                     │ Used By                             │
├─────────────────────────────┼─────────────────────────────────────┤
│ Synchronous REST (blocking) │ pricing-service → rule-engine       │
│                             │ policy-service → pricing-service    │
│                             │ policy-service → rule-engine        │
│                             │ claims-service → rule-engine        │
│                             │ claims-service → policy-service     │
│                             │ document-service → policy-service   │
├─────────────────────────────┼─────────────────────────────────────┤
│ Fire-and-forget REST        │ * → audit-service                   │
│ (async, non-blocking)       │ * → notification-service            │
│ Spring @Async + RestClient  │ policy-service → underwriting       │
│                             │ claims-service → field-service      │
├─────────────────────────────┼─────────────────────────────────────┤
│ Internal header forwarding  │ gateway → downstream services       │
│ X-User-ID, X-User-Roles     │ (eliminates re-validation of JWT)   │
│ X-Correlation-ID            │ (distributed tracing)               │
└─────────────────────────────┴─────────────────────────────────────┘
```

### 3.3 Inter-Service Authentication

```
All inter-service calls include:
  Header: X-Service-Token: <shared-secret from application.properties>
  Header: X-Correlation-ID: <uuid propagated from gateway>

The gateway adds:
  Header: X-User-ID: <userId from JWT>
  Header: X-User-Roles: <comma-separated roles>
  Header: X-User-Permissions: <comma-separated permissions>

Downstream services trust these headers ONLY if X-Service-Token is valid.
Direct calls to downstream services without X-Service-Token are rejected (401).
```

---

## 4. Module Ownership

### 4.1 Domain Concept → Owning Service

```
┌───────────────────────────────────┬─────────────────────────┬─────────────────────────────┐
│ Domain Concept                    │ Owning Service           │ Consumers                   │
├───────────────────────────────────┼─────────────────────────┼─────────────────────────────┤
│ User / Identity                   │ auth-service            │ all (via JWT)               │
│ Roles & Permissions               │ auth-service            │ gateway, all services       │
│ Product Types                     │ product-service         │ policy-service              │
│ Plans                             │ product-service         │ policy-service, pricing     │
│ Coverages (types + limits)        │ product-service         │ policy-service, claims      │
│ Add-ons                           │ product-service         │ policy-service, pricing     │
│ Destination Zones                 │ product-service         │ pricing-service, rules      │
│ Risk Rules                        │ rule-engine-service     │ policy-service              │
│ Premium Rules                     │ rule-engine-service     │ pricing-service             │
│ Discount Rules                    │ rule-engine-service     │ pricing-service             │
│ Eligibility Rules                 │ rule-engine-service     │ policy-service              │
│ Claim Auto-Decision Rules         │ rule-engine-service     │ claims-service              │
│ Rule Execution Logs               │ rule-engine-service     │ reporting-service           │
│ Premium Calculation               │ pricing-service         │ policy-service              │
│ Quotes                            │ policy-service          │ pricing-service             │
│ Policies                          │ policy-service          │ claims-service, reporting   │
│ Policy Snapshots                  │ policy-service          │ claims-service, document    │
│ Underwriting Cases                │ underwriting-service    │ reporting-service           │
│ UW Decisions                      │ underwriting-service    │ policy-service              │
│ Claims                            │ claims-service          │ field-service, reporting    │
│ Claim Documents                   │ claims-service          │ document-service            │
│ Claim Decisions                   │ claims-service          │ notification, reporting     │
│ Field Assignments                 │ field-service           │ claims-service              │
│ Field Reports                     │ field-service           │ claims-service              │
│ Document Templates                │ document-service        │ admin portal                │
│ Generated Documents               │ document-service        │ policy, claims, customer    │
│ Notifications                     │ notification-service    │ all portals                 │
│ Audit Logs                        │ audit-service           │ reporting-service           │
│ Dashboards / Reports              │ reporting-service       │ admin, finance portals      │
└───────────────────────────────────┴─────────────────────────┴─────────────────────────────┘
```

### 4.2 Angular Feature Module → Backend Service Map

```
┌────────────────────────────┬─────────────────────────────────────────────┐
│ Angular Module             │ Backend Services Called                     │
├────────────────────────────┼─────────────────────────────────────────────┤
│ auth/                      │ auth-service                                │
│ customer/dashboard         │ policy-service, claims-service              │
│ customer/profile           │ auth-service                                │
│ customer/policies          │ policy-service, document-service            │
│ customer/notifications     │ notification-service                        │
│ customer/claims            │ claims-service, policy-service              │
│ marketplace/               │ product-service                             │
│ marketplace/quote          │ product-service, pricing-service,           │
│                            │ policy-service                              │
│ policy-builder/            │ product-service, pricing-service,           │
│                            │ rule-engine-service, policy-service         │
│ underwriting/              │ underwriting-service, rule-engine-service   │
│ claims-officer/            │ claims-service, field-service,              │
│                            │ document-service                            │
│ field/                     │ field-service                               │
│ admin/plans                │ product-service                             │
│ admin/rules                │ rule-engine-service                         │
│ admin/users                │ auth-service                                │
│ admin/rbac                 │ auth-service                                │
│ reporting/                 │ reporting-service, audit-service            │
└────────────────────────────┴─────────────────────────────────────────────┘
```

---

## 5. Shared Libraries Strategy

All shared libraries are Java Maven modules included as local dependencies. No shared library contains Spring Boot auto-configuration — they are plain Java/Spring libraries.

### 5.1 Library Map

```
travel-insurance-platform/
  shared-libs/
    ├── common-dto/          - API request/response envelopes, pagination models
    ├── common-security/     - JWT utility, permission constants, annotation
    ├── common-audit/        - AuditEvent model, AuditPublisher interface
    ├── common-exception/    - Exception hierarchy, GlobalExceptionHandler base
    ├── common-util/         - Date utilities, string formatting, validators
    └── common-workflow/     - WorkflowState interface, WorkflowTransition model
```

### 5.2 common-dto

```
Contents:
  ApiResponse<T>          - { status, message, data, errors, correlationId, timestamp }
  PagedResponse<T>        - { content[], page, size, totalElements, totalPages }
  ErrorResponse           - { code, message, field, rejectedValue }
  SortRequest             - { sortBy, direction }
  PageRequest             - { page, size, sort }

Rule: Every REST endpoint returns ApiResponse<T>. Never return a raw object.
```

### 5.3 common-security

```
Contents:
  JwtTokenProvider        - token generation, validation, claims extraction
  JwtProperties           - secret, expiry configuration (loaded from application.properties)
  UserPrincipal           - authenticated user object (userId, roles, permissions)
  @CurrentUser            - annotation to inject UserPrincipal into controllers
  PermissionConstants     - all permission string constants (POLICY_READ, UW_APPROVE, etc.)
  ServiceTokenValidator   - validates X-Service-Token header for inter-service calls

Rule: JwtTokenProvider is used ONLY by auth-service for token issuance.
      All other services use X-User-ID / X-User-Roles headers forwarded by gateway.
```

### 5.4 common-audit

```
Contents:
  AuditEvent              - { correlationId, entityType, entityId, action, actorId,
                              actorRole, oldState, newState, details, timestamp }
  AuditPublisher          - interface: publish(AuditEvent)
  RestAuditPublisher      - implementation: POST to audit-service (async)

Rule: Every service includes common-audit. On every meaningful state change, the
      owning service constructs an AuditEvent and calls AuditPublisher.publish().
      This is the ONLY way audit records are created.
```

### 5.5 common-exception

```
Contents:
  PlatformException       - base checked exception { errorCode, message }
  ResourceNotFoundException
  ValidationException
  AuthorizationException
  WorkflowTransitionException
  DocumentGenerationException
  RuleEvaluationException
  GlobalExceptionHandlerBase - @ControllerAdvice base that maps exceptions to ApiResponse<Void>

Rule: Every service extends GlobalExceptionHandlerBase. Custom exceptions extend PlatformException.
      No service returns stack traces to clients.
```

### 5.6 common-util

```
Contents:
  DateUtils               - travel date calculations, duration in days, expiry checks
  PolicyNumberGenerator   - generate POL-YYYYMMDD-XXXXXX format
  QuoteReferenceGenerator - generate QT-YYYYMMDD-XXXXXX format
  ClaimReferenceGenerator - generate CLM-YYYYMMDD-XXXXXX format
  PaginationHelper        - Spring Pageable construction from PageRequest DTO
  FileValidationUtil      - extension check, MIME type check, size check for uploads
```

### 5.7 Library Dependency Rules

```
Services CAN depend on:       common-dto, common-security, common-audit,
                               common-exception, common-util

Services CANNOT depend on:    Each other's source code
                               (only REST calls — never shared Java classes across services)

common-* libraries CANNOT depend on: Spring Boot, any service-specific code
```

---

## 6. Authentication Architecture

### 6.1 Login Flow

```
┌──────────┐        ┌─────────┐        ┌──────────────┐      ┌──────────┐
│ Angular  │        │ Gateway │        │ auth-service │      │  MySQL   │
│  Client  │        │         │        │              │      │          │
└────┬─────┘        └────┬────┘        └──────┬───────┘      └────┬─────┘
     │                   │                    │                    │
     │  POST /auth/login  │                    │                    │
     │──────────────────►│                    │                    │
     │                   │  forward (no JWT   │                    │
     │                   │  check on /auth/*) │                    │
     │                   │───────────────────►│                    │
     │                   │                    │ SELECT user by     │
     │                   │                    │ username           │
     │                   │                    │───────────────────►│
     │                   │                    │◄───────────────────│
     │                   │                    │ verify BCrypt hash  │
     │                   │                    │ check lock status  │
     │                   │                    │ load roles+perms   │
     │                   │                    │───────────────────►│
     │                   │                    │◄───────────────────│
     │                   │                    │ generate JWT       │
     │                   │                    │ (access + refresh) │
     │                   │                    │ store refresh token│
     │                   │◄───────────────────│                    │
     │◄──────────────────│                    │                    │
     │  { accessToken,   │                    │                    │
     │    refreshToken,  │                    │                    │
     │    expiresIn }    │                    │                    │
```

### 6.2 JWT Token Structure

```
Header:  { alg: HS256, typ: JWT }

Payload: {
  sub:         "userId-uuid",
  username:    "john.doe",
  roles:       ["ROLE_CUSTOMER"],
  permissions: ["POLICY_READ", "CLAIM_SUBMIT", "CLAIM_TRACK"],
  iat:         <issued-at unix timestamp>,
  exp:         <expiry unix timestamp — 15 minutes from iat>,
  jti:         "<unique token id — for revocation>"
}

Signature: HMACSHA256(base64(header) + "." + base64(payload), secret)
```

### 6.3 Authenticated Request Flow

```
┌──────────┐    ┌───────────────────────────┐    ┌──────────────────────┐
│ Angular  │    │       API GATEWAY         │    │  Downstream Service  │
│  Client  │    │                           │    │                      │
└────┬─────┘    └─────────────┬─────────────┘    └──────────┬───────────┘
     │                        │                             │
     │  GET /policies/my      │                             │
     │  Authorization: Bearer <jwt>                         │
     │───────────────────────►│                             │
     │                        │ Validate JWT signature       │
     │                        │ Check exp not exceeded       │
     │                        │ Extract userId, roles, perms │
     │                        │                             │
     │                        │  GET /api/policies/my       │
     │                        │  X-User-ID: uuid            │
     │                        │  X-User-Roles: ROLE_CUSTOMER│
     │                        │  X-User-Permissions: ...    │
     │                        │  X-Correlation-ID: uuid     │
     │                        │  X-Service-Token: secret    │
     │                        │────────────────────────────►│
     │                        │                             │ @PreAuthorize check
     │                        │                             │ Execute business logic
     │                        │◄────────────────────────────│
     │◄───────────────────────│                             │
```

### 6.4 Token Refresh Flow

```
Angular:
  - Store accessToken in memory (NOT localStorage — XSS protection)
  - Store refreshToken in HttpOnly cookie
  - Attach accessToken as Bearer header on every API call
  - If API returns 401:
      → POST /auth/refresh (sends refreshToken cookie automatically)
      → Store new accessToken in memory
      → Retry original request
  - If refresh also returns 401 → redirect to login

auth-service on POST /auth/refresh:
  - Read refreshToken from HttpOnly cookie
  - Look up refresh token in DB (check not revoked, not expired)
  - Issue new accessToken (15 min) + new refreshToken (7 day, rotation)
  - Invalidate old refreshToken record in DB
  - Return new tokens
```

### 6.5 OTP Flow (Forgot Password)

```
Customer                auth-service           notification-service      MySQL
    │                        │                         │                   │
    │  POST /auth/forgot-pw  │                         │                   │
    │  { email }             │                         │                   │
    │───────────────────────►│                         │                   │
    │                        │ lookup user by email    │                   │
    │                        │────────────────────────────────────────────►│
    │                        │◄────────────────────────────────────────────│
    │                        │ generate 6-digit OTP    │                   │
    │                        │ store OTP (hashed) +    │                   │
    │                        │ 10-min expiry           │                   │
    │                        │────────────────────────────────────────────►│
    │                        │ POST /notifications/trigger                  │
    │                        │ { event: OTP_REQUESTED, email, otp }        │
    │                        │────────────────────────►│                   │
    │◄───────────────────────│  { message: "OTP sent" }│                   │
    │                        │                         │                   │
    │  POST /auth/verify-otp │                         │                   │
    │  { email, otp }        │                         │                   │
    │───────────────────────►│                         │                   │
    │                        │ load stored OTP hash    │                   │
    │                        │ validate: match + not expired               │
    │                        │ issue reset-token (one-time use, 15 min)    │
    │◄───────────────────────│  { resetToken }         │                   │
    │                        │                         │                   │
    │  POST /auth/reset-pw   │                         │                   │
    │  { resetToken, newPw } │                         │                   │
    │───────────────────────►│                         │                   │
    │                        │ validate reset-token    │                   │
    │                        │ check password history  │                   │
    │                        │ hash + store new pw     │                   │
    │                        │ invalidate reset-token  │                   │
    │◄───────────────────────│  { success }            │                   │
```

---

## 7. Authorization Architecture

### 7.1 Permission Catalog

```
┌─────────────────────┬──────────────────────────────────────────────────────┐
│ Domain              │ Permissions                                          │
├─────────────────────┼──────────────────────────────────────────────────────┤
│ Policy              │ POLICY_READ, POLICY_WRITE, POLICY_CANCEL,           │
│                     │ POLICY_RENEW, POLICY_VIEW_ALL                       │
│ Quote               │ QUOTE_CREATE, QUOTE_VIEW                            │
│ Underwriting        │ UW_VIEW, UW_APPROVE, UW_DECLINE, UW_REFER,         │
│                     │ UW_REQUEST_INFO, UW_ESCALATE_RESOLVE               │
│ Claims              │ CLAIM_SUBMIT, CLAIM_TRACK, CLAIM_VIEW_ALL,         │
│                     │ CLAIM_DECIDE, CLAIM_ASSIGN_FIELD                   │
│ Field               │ FIELD_VIEW_OWN, FIELD_REPORT_SUBMIT,               │
│                     │ FIELD_ASSIGN                                        │
│ Finance             │ FINANCE_VIEW, PAYMENT_PROCESS                      │
│ Documents           │ DOCUMENT_VIEW, DOCUMENT_DOWNLOAD                   │
│ Plans               │ PLAN_READ, PLAN_WRITE, PLAN_PUBLISH                │
│ Add-ons             │ ADDON_READ, ADDON_WRITE                            │
│ Rules               │ RULE_READ, RULE_WRITE, RULE_PUBLISH               │
│ Users               │ USER_READ, USER_WRITE, USER_DEACTIVATE             │
│ RBAC                │ RBAC_MANAGE                                        │
│ Reports             │ REPORT_VIEW, AUDIT_VIEW                            │
│ Notifications       │ NOTIFICATION_VIEW_OWN                              │
└─────────────────────┴──────────────────────────────────────────────────────┘
```

### 7.2 Role-to-Permission Matrix

```
┌──────────────────────┬───────────┬────────┬──────┬─────────┬───────────┬───────────┬──────────┬────────┐
│ Permission           │ CUSTOMER  │ AGENT  │ UW_L1│  UW_L2  │ CLAIMS_OF │ FIELD_OFF │ FINANCE  │ ADMIN  │
├──────────────────────┼───────────┼────────┼──────┼─────────┼───────────┼───────────┼──────────┼────────┤
│ POLICY_READ (own)    │     ✓     │   ✓    │  ✓   │    ✓    │     ✓     │           │    ✓     │   ✓    │
│ POLICY_VIEW_ALL      │           │   ✓    │  ✓   │    ✓    │     ✓     │           │    ✓     │   ✓    │
│ POLICY_WRITE         │           │   ✓    │      │         │           │           │          │   ✓    │
│ POLICY_CANCEL        │     ✓     │   ✓    │      │         │           │           │          │   ✓    │
│ POLICY_RENEW         │     ✓     │   ✓    │      │         │           │           │          │   ✓    │
│ QUOTE_CREATE         │     ✓     │   ✓    │      │         │           │           │          │   ✓    │
│ UW_VIEW              │           │        │  ✓   │    ✓    │           │           │          │   ✓    │
│ UW_APPROVE           │           │        │  ✓   │    ✓    │           │           │          │        │
│ UW_DECLINE           │           │        │  ✓   │    ✓    │           │           │          │        │
│ UW_REFER             │           │        │  ✓   │         │           │           │          │        │
│ UW_ESCALATE_RESOLVE  │           │        │      │    ✓    │           │           │          │        │
│ CLAIM_SUBMIT         │     ✓     │        │      │         │           │           │          │        │
│ CLAIM_TRACK          │     ✓     │        │      │         │           │           │          │        │
│ CLAIM_VIEW_ALL       │           │        │      │         │     ✓     │           │    ✓     │   ✓    │
│ CLAIM_DECIDE         │           │        │      │         │     ✓     │           │          │        │
│ CLAIM_ASSIGN_FIELD   │           │        │      │         │     ✓     │           │          │   ✓    │
│ FIELD_VIEW_OWN       │           │        │      │         │           │     ✓     │          │        │
│ FIELD_REPORT_SUBMIT  │           │        │      │         │           │     ✓     │          │        │
│ FIELD_ASSIGN         │           │        │      │         │     ✓     │           │          │   ✓    │
│ FINANCE_VIEW         │           │        │      │         │           │           │    ✓     │   ✓    │
│ PAYMENT_PROCESS      │           │        │      │         │           │           │    ✓     │        │
│ PLAN_WRITE           │           │        │      │         │           │           │          │   ✓    │
│ RULE_WRITE           │           │        │      │         │           │           │          │   ✓    │
│ USER_WRITE           │           │        │      │         │           │           │          │   ✓    │
│ RBAC_MANAGE          │           │        │      │         │           │           │          │   ✓    │
│ AUDIT_VIEW           │           │        │      │         │           │           │          │   ✓    │
│ REPORT_VIEW          │           │        │      │         │           │           │    ✓     │   ✓    │
└──────────────────────┴───────────┴────────┴──────┴─────────┴───────────┴───────────┴──────────┴────────┘
```

### 7.3 Spring Security Filter Chain

```
Incoming Request
       │
       ▼
┌─────────────────────────────────────────────────────┐
│              SecurityFilterChain                    │
│                                                     │
│  1. ServiceTokenFilter                              │
│     - Checks X-Service-Token header                 │
│     - Rejects if service token invalid              │
│                                                     │
│  2. JwtAuthenticationFilter                         │
│     - Reads X-User-ID, X-User-Roles headers         │
│       (pre-validated by gateway)                    │
│     - Constructs UserPrincipal                      │
│     - Sets SecurityContextHolder                    │
│                                                     │
│  3. Spring Method Security                          │
│     @PreAuthorize("hasAuthority('UW_APPROVE')")     │
│     - Checks UserPrincipal.permissions              │
│     - Throws AccessDeniedException → 403            │
│                                                     │
│  4. Resource Ownership Filter                       │
│     - For POLICY_READ: verify policy.customerId     │
│       matches X-User-ID (for ROLE_CUSTOMER)         │
│     - Applied at service layer, not filter layer    │
└─────────────────────────────────────────────────────┘
```

### 7.4 Angular Authorization Strategy

```
Route Guard Chain:
  AuthGuard         → checks: token exists + not expired
  RoleGuard         → checks: user has at least one required role
  PermissionGuard   → checks: user has specific permission

Example route config:
  /underwriting/**  → guards: [AuthGuard, RoleGuard]
                        data: { roles: ['ROLE_UNDERWRITER_L1', 'ROLE_UNDERWRITER_L2'] }

  /admin/rules/**   → guards: [AuthGuard, PermissionGuard]
                        data: { permission: 'RULE_WRITE' }

Template directives:
  *appHasPermission="'CLAIM_DECIDE'"   → shows/hides DOM element
  *appHasRole="'ROLE_ADMIN'"           → shows/hides DOM element

Sidebar menu:
  MenuItems[] loaded from AuthService.currentUser$
  Each item has: requiredPermission
  MenuBuilder filters items by currentUser permissions
  No hardcoded menu — permission-driven rendering
```

---

## 8. Document Generation Flow

### 8.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DOCUMENT SERVICE                                │
│                                                                     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │  Template Store  │    │  Variable       │    │  PDF Generator  │ │
│  │  (MySQL CLOB)    │    │  Resolver       │    │  (iText 7)      │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
│                                  │                        │         │
│  ┌─────────────────┐    ┌────────▼────────┐    ┌─────────▼───────┐ │
│  │  Snapshot       │    │  HTML Template  │    │  Local          │ │
│  │  Fetcher        │────►  Renderer       │────►  Filesystem     │ │
│  │  (REST calls)   │    │                 │    │  Writer         │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 Generation Pipeline

```
Trigger (from any service)
  POST /documents/generate
  Body: { documentType, referenceId, requestedBy }
         │
         ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │ Step 1: Template Resolution                                      │
  │   SELECT template WHERE type = documentType AND is_active = true │
  │   AND effective_date <= NOW ORDER BY version DESC LIMIT 1        │
  └────────────────────────────┬─────────────────────────────────────┘
                               │
                               ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │ Step 2: Snapshot Fetch (based on documentType)                  │
  │                                                                  │
  │  POLICY_SCHEDULE / POLICY_WORDING:                              │
  │    GET policy-service/policies/{id}/snapshot                     │
  │    Returns: { policy, traveler[], coverages[], premium,          │
  │               planDetails, addons[], wording, issuedAt }        │
  │                                                                  │
  │  CLAIM_ASSESSMENT:                                               │
  │    GET claims-service/claims/{id}/snapshot                       │
  │    Returns: { claim, policy snapshot, documents[],               │
  │               decision, decisionReason, assessedBy }            │
  │                                                                  │
  │  QUOTE_SUMMARY:                                                  │
  │    GET policy-service/quotes/{id}/snapshot                       │
  └────────────────────────────┬─────────────────────────────────────┘
                               │
                               ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │ Step 3: Variable Resolution                                      │
  │   Walk HTML template body                                        │
  │   Replace ${policy.number} → "POL-20260501-000123"              │
  │   Replace ${customer.fullName} → "John Smith"                    │
  │   Replace ${coverage.medical.limit} → "€100,000"                │
  │   Replace ${premium.total} → "€382.45"                          │
  │   Replace ${table.travelers} → generate HTML table rows          │
  │   All variables sourced from snapshot — never live DB            │
  └────────────────────────────┬─────────────────────────────────────┘
                               │
                               ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │ Step 4: HTML → PDF Conversion                                    │
  │   HtmlConverter.convertToPdf(resolvedHtml, pdfOutputStream)      │
  │   Apply: A4 page size, header/footer, page numbers               │
  │   Embed: company logo (from /storage/assets/logo.png)           │
  └────────────────────────────┬─────────────────────────────────────┘
                               │
                               ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │ Step 5: Filesystem Storage                                       │
  │   Path: /storage/documents/{entityType}/{id}/v{n}/{filename}.pdf │
  │   Examples:                                                      │
  │     /storage/documents/policies/POL-001/v1/policy_schedule.pdf  │
  │     /storage/documents/claims/CLM-001/assessment_report.pdf     │
  │   Atomic write: temp file → rename on success                    │
  └────────────────────────────┬─────────────────────────────────────┘
                               │
                               ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │ Step 6: Metadata Persistence                                     │
  │   INSERT generated_documents (type, referenceId, filePath,      │
  │   fileName, templateVersionUsed, generatedAt, generatedBy)      │
  └────────────────────────────┬─────────────────────────────────────┘
                               │
                               ▼
  Return DocumentReference { documentId, downloadUrl }
```

### 8.3 Document Types and Trigger Points

```
┌──────────────────────────┬─────────────────────────────────────────────────────┐
│ Document Type            │ Triggered By                                        │
├──────────────────────────┼─────────────────────────────────────────────────────┤
│ POLICY_SCHEDULE          │ policy-service: on policy status → ACTIVE           │
│ POLICY_WORDING           │ policy-service: on policy status → ACTIVE           │
│ QUOTE_SUMMARY            │ policy-service: on quote creation (optional)        │
│ CLAIM_ASSESSMENT_REPORT  │ claims-service: on claim decision (Approve/Decline) │
│ FIELD_INVESTIGATION_RPT  │ field-service: on field report submission            │
│ RENEWAL_SCHEDULE         │ policy-service: on policy renewal activation        │
└──────────────────────────┴─────────────────────────────────────────────────────┘
```

### 8.4 Document Versioning Strategy

```
Scenario: Policy endorsement after issuance
  Original policy → v1: policy_schedule.pdf (immutable)
  Endorsement applied → document-service generates v2: policy_schedule.pdf
  Both v1 and v2 preserved in generated_documents + document_versions
  Customer can download "current" version (latest) or "original" (v1)
  Claims processing always uses the version active at claim submission date
```

---

## 9. Rule Engine Flow

### 9.1 Rule Engine Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       RULE ENGINE SERVICE                           │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Rule Repository                          │   │
│  │   DB: rule_definitions, rule_condition_groups,             │   │
│  │       rule_conditions, rule_actions                        │   │
│  │   In-memory cache (refreshed on rule publish)              │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │                                       │
│  ┌──────────────────────────▼──────────────────────────────────┐   │
│  │                  Rule Evaluator                             │   │
│  │   1. Load rules by type + active version                    │   │
│  │   2. Order by priority ASC                                  │   │
│  │   3. For each rule:                                         │   │
│  │      - Evaluate condition groups (AND/OR tree)              │   │
│  │      - Field accessor: context.get("traveler.age")          │   │
│  │      - Operator: GT, LT, EQ, IN, BETWEEN, NOT_IN            │   │
│  │      - Collect matched actions                              │   │
│  │   4. Apply actions in priority order                        │   │
│  │   5. Build RuleExecutionResult                              │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │                                       │
│  ┌──────────────────────────▼──────────────────────────────────┐   │
│  │                 Execution Logger                            │   │
│  │   Async: INSERT rule_execution_logs for every rule          │   │
│  │   (matched AND unmatched — for full explainability)         │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.2 Risk Scoring Flow

```
Input Context (from policy-service):
{
  "traveler.age": 67,
  "destination.risk_tier": "TIER_4",
  "trip.duration_days": 45,
  "traveler.has_preexisting_condition": true,
  "traveler.has_adventure_activity": false
}

Rule Evaluation:

  Rule R001 (priority 10): Age >= 60 AND age < 70
    → Condition: MATCHED
    → Action: ADD_SCORE +20
    → Explanation: "Senior traveler age band (60-70)"

  Rule R002 (priority 20): destination.risk_tier IN [TIER_3, TIER_4, TIER_5]
    → Condition: MATCHED
    → Action: ADD_SCORE +30
    → Explanation: "High-risk destination tier"

  Rule R003 (priority 30): trip.duration_days > 30
    → Condition: MATCHED
    → Action: ADD_SCORE +10
    → Explanation: "Extended trip duration surcharge"

  Rule R004 (priority 40): has_preexisting_condition = true
    → Condition: MATCHED
    → Action: ADD_SCORE +25
    → Explanation: "Pre-existing medical condition loading"

  Rule R005 (priority 50): has_adventure_activity = true
    → Condition: NOT MATCHED
    → Action: (not applied)

Total Risk Score: 0 + 20 + 30 + 10 + 25 = 85

Risk Level Mapping:
  0-25   → LOW
  26-50  → MEDIUM
  51-75  → HIGH
  76-100 → VERY_HIGH

Result: VERY_HIGH → Route to Underwriting L2

RuleExecutionResult {
  score: 85,
  riskLevel: "VERY_HIGH",
  routingDecision: "UNDERWRITING_L2",
  executionTrace: [
    { ruleId: R001, matched: true, contribution: +20, reason: "Senior traveler..." },
    { ruleId: R002, matched: true, contribution: +30, reason: "High-risk destination..." },
    { ruleId: R003, matched: true, contribution: +10, reason: "Extended trip..." },
    { ruleId: R004, matched: true, contribution: +25, reason: "Pre-existing condition..." },
    { ruleId: R005, matched: false, contribution: 0, reason: "Adventure activity: N/A" }
  ]
}
```

### 9.3 Premium Rule Flow

```
Input Context (from pricing-service):
{
  "plan.base_premium": 200.00,
  "risk_score": 85,
  "destination.zone": "ZONE_B",
  "trip.duration_days": 45,
  "traveler.age_band": "SENIOR_60_70",
  "addons": ["OPD", "BAGGAGE_DELAY"],
  "group_size": 1
}

Rule Evaluation:

  PR001: base_premium foundation
    → Action: SET_BASE 200.00

  PR002: destination zone ZONE_B surcharge
    → Action: MULTIPLY 1.15 (+15%)
    → Running total: 230.00

  PR003: risk_score > 75
    → Action: ADD_PERCENT +12%
    → Running total: 257.60

  PR004: duration > 30 days
    → Action: ADD_PERCENT +8%
    → Running total: 278.21

  PR005: age_band = SENIOR_60_70
    → Action: ADD_PERCENT +10%
    → Running total: 306.03

  PR006: addon OPD
    → Action: ADD_FLAT +45.00
    → Running total: 351.03

  PR007: addon BAGGAGE_DELAY
    → Action: ADD_FLAT +31.42
    → Running total: 382.45

PricingBreakdown {
  basePremium: 200.00,
  zoneLoading: 30.00,
  riskLoading: 27.60,
  durationLoading: 20.61,
  ageLoading: 28.22,
  addonOPD: 45.00,
  addonBaggageDelay: 31.42,
  totalPremium: 382.45,
  currency: "EUR",
  executionTrace: [ ... ]
}
```

### 9.4 Rule Versioning Strategy

```
Admin creates rule → status: DRAFT
Admin tests rule (POST /rules/preview with sample context) → validates output
Admin publishes rule → status: PUBLISHED, version incremented
  → Old version: status SUPERSEDED (preserved in DB)
  → In-memory rule cache refreshed

Policy issued at time T uses rule_version active at T → stored in quote_snapshot
If rule changes at T+1, existing policies are unaffected
Re-evaluation (e.g., renewal) uses current active rules
```

---

## 10. Claims Workflow

### 10.1 Claims State Machine

```
                    ┌──────────────────────────────────────────────────────┐
                    │              CLAIMS WORKFLOW STATE MACHINE            │
                    └──────────────────────────────────────────────────────┘

Customer submits claim
         │
         ▼
  ┌─────────────┐
  │  SUBMITTED  │  claim created, documents accepted
  └──────┬──────┘
         │ system validates policy active
         │ system checks document completeness
         ▼
  ┌─────────────────┐     docs missing     ┌────────────────────┐
  │ DOCUMENT_REVIEW │────────────────────► │ DOCUMENT_PENDING   │
  └──────┬──────────┘                      └─────────┬──────────┘
         │ all required docs present                 │ customer uploads missing docs
         │                                           │
         │◄──────────────────────────────────────────┘
         │
         ▼ Rule Engine: CLAIM_AUTO_DECISION
  ┌──────────────────────────────────────────────────────┐
  │           Auto-Decision Evaluation                   │
  │  Inputs: claim.amount, claim.type, policy.risk_level │
  │          fraud_indicators, coverage_match            │
  └─────────────────────────────────────────────────────┬┘
               │                                        │
     score < threshold                          score >= threshold
     low-risk / routine                         high-value / complex
               │                                        │
               ▼                                        ▼
  ┌──────────────────────┐                ┌─────────────────────────┐
  │   AUTO_APPROVED      │                │      UNDER_REVIEW        │
  │   AUTO_DECLINED      │                │  (Claims Officer Queue)  │
  └──────────────────────┘                └──────────────┬──────────┘
                                                         │
                                              Officer reviews docs,
                                              validates coverage
                                                         │
                                          ┌──────────────▼──────────────┐
                                          │  needs field investigation? │
                                          └──────┬───────────────┬──────┘
                                                 │ NO            │ YES
                                                 │               ▼
                                                 │  ┌──────────────────────────┐
                                                 │  │  INVESTIGATION_ASSIGNED  │
                                                 │  └──────────────┬───────────┘
                                                 │                 │
                                                 │  Field Officer accepts +
                                                 │  visits + submits report
                                                 │                 │
                                                 │  ┌──────────────▼───────────┐
                                                 │  │  INVESTIGATION_COMPLETE  │
                                                 │  └──────────────┬───────────┘
                                                 │                 │
                                                 └────────►────────┘
                                                                   │
                                                                   ▼
                                                         ┌─────────────────┐
                                                         │ DECISION_PENDING │
                                                         └────────┬────────┘
                                                                  │
                                     ┌────────────────────────────┤
                                     │            │               │
                                     ▼            ▼               ▼
                               ┌──────────┐ ┌─────────┐ ┌─────────────────┐
                               │ APPROVED │ │DECLINED │ │PARTIALLY_APPROVED│
                               └────┬─────┘ └────┬────┘ └────────┬─────────┘
                                    │             │               │
                                    │      ┌──────▼──────┐       │
                                    │      │   CLOSED    │       │
                                    │      └─────────────┘       │
                                    │                             │
                                    └──────────┬──────────────────┘
                                               │
                                               ▼
                                    ┌──────────────────┐
                                    │  PAYMENT_PENDING  │
                                    └────────┬──────────┘
                                             │ Finance processes payment
                                             ▼
                                    ┌──────────────────┐
                                    │    SETTLED       │
                                    └────────┬──────────┘
                                             │
                                             ▼
                                    ┌──────────────────┐
                                    │     CLOSED       │
                                    └──────────────────┘
```

### 10.2 Claims Transition Table

```
┌────────────────────────┬──────────────────────────────┬──────────────────────────┬────────────────────────────┐
│ From State             │ To State                     │ Trigger Event            │ Required Role              │
├────────────────────────┼──────────────────────────────┼──────────────────────────┼────────────────────────────┤
│ —                      │ SUBMITTED                    │ CLAIM_SUBMIT             │ ROLE_CUSTOMER              │
│ SUBMITTED              │ DOCUMENT_REVIEW              │ SYSTEM_VALIDATE_DOCS     │ SYSTEM                     │
│ DOCUMENT_REVIEW        │ DOCUMENT_PENDING             │ DOCS_INCOMPLETE          │ SYSTEM                     │
│ DOCUMENT_PENDING       │ DOCUMENT_REVIEW              │ CUSTOMER_UPLOAD_DOCS     │ ROLE_CUSTOMER              │
│ DOCUMENT_REVIEW        │ UNDER_REVIEW                 │ DOCS_COMPLETE            │ SYSTEM                     │
│ UNDER_REVIEW           │ AUTO_APPROVED                │ AUTO_DECISION_APPROVE    │ SYSTEM (rule engine)       │
│ UNDER_REVIEW           │ AUTO_DECLINED                │ AUTO_DECISION_DECLINE    │ SYSTEM (rule engine)       │
│ UNDER_REVIEW           │ INVESTIGATION_ASSIGNED       │ ASSIGN_FIELD_OFFICER     │ ROLE_CLAIMS_OFFICER        │
│ INVESTIGATION_ASSIGNED │ INVESTIGATION_COMPLETE       │ FIELD_REPORT_SUBMITTED   │ ROLE_FIELD_OFFICER         │
│ INVESTIGATION_COMPLETE │ DECISION_PENDING             │ REVIEW_COMPLETE          │ ROLE_CLAIMS_OFFICER        │
│ UNDER_REVIEW           │ DECISION_PENDING             │ REVIEW_COMPLETE          │ ROLE_CLAIMS_OFFICER        │
│ DECISION_PENDING       │ APPROVED                     │ CLAIM_APPROVE            │ ROLE_CLAIMS_OFFICER        │
│ DECISION_PENDING       │ PARTIALLY_APPROVED           │ CLAIM_PARTIAL_APPROVE    │ ROLE_CLAIMS_OFFICER        │
│ DECISION_PENDING       │ DECLINED                     │ CLAIM_DECLINE            │ ROLE_CLAIMS_OFFICER        │
│ APPROVED               │ PAYMENT_PENDING              │ DECISION_FINALIZED       │ SYSTEM                     │
│ PARTIALLY_APPROVED     │ PAYMENT_PENDING              │ DECISION_FINALIZED       │ SYSTEM                     │
│ PAYMENT_PENDING        │ SETTLED                      │ PAYMENT_PROCESSED        │ ROLE_FINANCE               │
│ SETTLED                │ CLOSED                       │ CLOSE_CLAIM              │ SYSTEM / ROLE_CLAIMS_OFFICER│
│ DECLINED               │ CLOSED                       │ CLOSE_CLAIM              │ SYSTEM                     │
│ AUTO_APPROVED          │ PAYMENT_PENDING              │ DECISION_FINALIZED       │ SYSTEM                     │
│ AUTO_DECLINED          │ CLOSED                       │ CLOSE_CLAIM              │ SYSTEM                     │
└────────────────────────┴──────────────────────────────┴──────────────────────────┴────────────────────────────┘
```

---

## 11. Underwriting Workflow

### 11.1 Underwriting State Machine

```
                    ┌──────────────────────────────────────────────────────┐
                    │          UNDERWRITING WORKFLOW STATE MACHINE         │
                    └──────────────────────────────────────────────────────┘

Policy flagged as HIGH or VERY_HIGH risk by rule engine
         │
         ▼
  ┌─────────────┐
  │     NEW     │  UW case created, policy status = PENDING_UNDERWRITING
  └──────┬──────┘
         │ auto-assign based on queue load
         │ OR manual assign by Admin
         ▼
  ┌──────────────────┐
  │    ASSIGNED      │  underwriter receives notification + SLA starts
  └──────┬───────────┘
         │ underwriter opens case
         ▼
  ┌──────────────────┐
  │   UNDER_REVIEW   │  case locked to this underwriter (concurrent access)
  └───────┬──────────┘
          │
          │──────────────────────────────────────────────────────────┐
          │                                                          │
          │ needs more info                                          │
          ▼                                                          │
  ┌────────────────────┐                                             │
  │  INFO_REQUESTED    │  customer notified                          │
  └────────┬───────────┘                                             │
           │ customer provides info                                  │
           ▼                                                          │
  ┌────────────────────┐                                             │
  │  INFO_RECEIVED     │  back to underwriter review                 │
  └────────┬───────────┘                                             │
           │                                                         │
           └─────────────────────────────────────────────────────────┘
                                     │
                      ┌──────────────┼───────────────────┐
                      │              │                   │
                      ▼              ▼                   ▼
             ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
             │   APPROVED   │ │   REJECTED   │ │  REFERRED_TO_L2  │
             └──────┬───────┘ └──────┬───────┘ └────────┬─────────┘
                    │                │                  │
                    │                │         L2 Underwriter reviews
                    │                │                  │
                    │                │         ┌────────▼─────────┐
                    │                │         │   L2_UNDER_REVIEW │
                    │                │         └────────┬──────────┘
                    │                │                  │
                    │                │      ┌───────────┼──────────┐
                    │                │      │           │          │
                    │                │      ▼           ▼          ▼
                    │                │  APPROVED    REJECTED  ESCALATED
                    │                │      │           │          │
                    │                │      │           │   ┌──────▼──────┐
                    │                │      │           │   │  ESCALATED  │
                    │                │      │           │   └──────┬──────┘
                    │                │      │           │          │ Sr. UW resolves
                    │                │      │           │          ▼
                    │                │      │           │    APPROVED / REJECTED
                    │                │      │           │
                    └──────────┬─────┘──────┴─────┬─────┘
                               │                  │
                               ▼                  ▼
                      policy → ACTIVE    policy → REJECTED
                      notify customer    notify customer
                               │
                               ▼
                          ┌─────────┐
                          │  CLOSED │
                          └─────────┘
```

### 11.2 Underwriting Transition Table

```
┌──────────────────┬───────────────────┬──────────────────────────┬────────────────────────┐
│ From State       │ To State          │ Trigger Event            │ Required Role          │
├──────────────────┼───────────────────┼──────────────────────────┼────────────────────────┤
│ —                │ NEW               │ POLICY_FLAGGED_HIGH_RISK  │ SYSTEM (policy-service)│
│ NEW              │ ASSIGNED          │ ASSIGN_UNDERWRITER        │ SYSTEM / ROLE_ADMIN    │
│ ASSIGNED         │ UNDER_REVIEW      │ CASE_OPENED              │ ROLE_UNDERWRITER_L1    │
│ UNDER_REVIEW     │ INFO_REQUESTED    │ REQUEST_MORE_INFO        │ ROLE_UNDERWRITER_L1    │
│ INFO_REQUESTED   │ INFO_RECEIVED     │ CUSTOMER_PROVIDED_INFO   │ ROLE_CUSTOMER          │
│ INFO_RECEIVED    │ UNDER_REVIEW      │ RESUME_REVIEW            │ ROLE_UNDERWRITER_L1    │
│ UNDER_REVIEW     │ APPROVED          │ UW_APPROVE               │ ROLE_UNDERWRITER_L1    │
│ UNDER_REVIEW     │ REJECTED          │ UW_REJECT                │ ROLE_UNDERWRITER_L1    │
│ UNDER_REVIEW     │ REFERRED_TO_L2    │ UW_REFER_L2              │ ROLE_UNDERWRITER_L1    │
│ REFERRED_TO_L2   │ L2_UNDER_REVIEW   │ L2_CASE_OPENED           │ ROLE_UNDERWRITER_L2    │
│ L2_UNDER_REVIEW  │ APPROVED          │ L2_UW_APPROVE            │ ROLE_UNDERWRITER_L2    │
│ L2_UNDER_REVIEW  │ REJECTED          │ L2_UW_REJECT             │ ROLE_UNDERWRITER_L2    │
│ L2_UNDER_REVIEW  │ ESCALATED         │ L2_ESCALATE              │ ROLE_UNDERWRITER_L2    │
│ ESCALATED        │ APPROVED          │ ESCALATION_APPROVE       │ ROLE_UNDERWRITER_L2    │
│ ESCALATED        │ REJECTED          │ ESCALATION_REJECT        │ ROLE_UNDERWRITER_L2    │
│ ASSIGNED         │ ESCALATED         │ SLA_BREACH               │ SYSTEM (@Scheduled)    │
│ UNDER_REVIEW     │ ESCALATED         │ SLA_BREACH               │ SYSTEM (@Scheduled)    │
│ APPROVED         │ CLOSED            │ POLICY_ACTIVATED         │ SYSTEM (policy-service)│
│ REJECTED         │ CLOSED            │ POLICY_REJECTED          │ SYSTEM (policy-service)│
└──────────────────┴───────────────────┴──────────────────────────┴────────────────────────┘
```

### 11.3 SLA Configuration

```
┌──────────────────────────────────────────────────────────────────┐
│                     SLA Configuration (Admin-managed)            │
├─────────────────────┬────────────────┬────────────────────────── ┤
│ Risk Level          │ SLA Hours (L1) │ SLA Hours (L2)            │
├─────────────────────┼────────────────┼───────────────────────────┤
│ HIGH                │ 24 hours       │ 48 hours                  │
│ VERY_HIGH           │ 12 hours       │ 24 hours                  │
└─────────────────────┴────────────────┴───────────────────────────┘

SLA Monitor (@Scheduled, every 15 minutes):
  SELECT uw_workflow_instances
  WHERE current_state NOT IN (APPROVED, REJECTED, CLOSED)
  AND sla_due_at < NOW()
  AND sla_breach_processed = false
  → For each: fire SLA_BREACH event → transition to ESCALATED
  → SET sla_breach_processed = true
  → Trigger notification to Admin + L2 Underwriter
```

---

## 12. Notification Workflow

### 12.1 Notification Event Catalog

```
┌──────────────────────────────────┬──────────────────────┬──────────────────────────────┐
│ Event Code                       │ Triggered By          │ Recipients                  │
├──────────────────────────────────┼──────────────────────┼──────────────────────────────┤
│ REGISTRATION_SUCCESS             │ auth-service          │ Customer                    │
│ LOGIN_ACCOUNT_LOCKED             │ auth-service          │ Customer                    │
│ OTP_REQUESTED                    │ auth-service          │ Customer                    │
│ PASSWORD_RESET_SUCCESS           │ auth-service          │ Customer                    │
│ QUOTE_CREATED                    │ policy-service        │ Customer                    │
│ QUOTE_EXPIRING_SOON              │ policy-service (sched)│ Customer                    │
│ POLICY_PENDING_UW                │ policy-service        │ Customer, Underwriter L1    │
│ POLICY_ACTIVATED                 │ underwriting / policy │ Customer                    │
│ POLICY_REJECTED                  │ underwriting-service  │ Customer                    │
│ UW_INFO_REQUESTED                │ underwriting-service  │ Customer                    │
│ UW_SLA_BREACHED                  │ underwriting-service  │ Admin, UW L2                │
│ POLICY_RENEWAL_DUE               │ policy-service (sched)│ Customer                    │
│ POLICY_CANCELLATION_REQUESTED    │ policy-service        │ Admin, Customer             │
│ CLAIM_SUBMITTED                  │ claims-service        │ Customer, Claims Officer    │
│ CLAIM_DOCUMENT_REQUIRED          │ claims-service        │ Customer                    │
│ CLAIM_UNDER_REVIEW               │ claims-service        │ Customer                    │
│ CLAIM_INVESTIGATION_ASSIGNED     │ claims-service        │ Customer, Field Officer     │
│ CLAIM_DECISION_APPROVED          │ claims-service        │ Customer                    │
│ CLAIM_DECISION_DECLINED          │ claims-service        │ Customer                    │
│ CLAIM_PAYMENT_PROCESSED          │ claims-service        │ Customer                    │
│ FIELD_ASSIGNMENT_RECEIVED        │ field-service         │ Field Officer               │
│ FIELD_REPORT_SUBMITTED           │ field-service         │ Claims Officer              │
│ DOCUMENT_READY                   │ document-service      │ Customer (policy/claim doc) │
└──────────────────────────────────┴──────────────────────┴──────────────────────────────┘
```

### 12.2 Notification Trigger Flow

```
Any Service (e.g., claims-service)
         │
         │  POST /notifications/trigger
         │  Body: {
         │    eventCode: "CLAIM_DECISION_APPROVED",
         │    recipientUserId: "uuid-customer",
         │    referenceId: "CLM-20260501-000045",
         │    referenceType: "CLAIM",
         │    templateVariables: {
         │      customerName: "John Smith",
         │      claimRef: "CLM-20260501-000045",
         │      approvedAmount: "€1,200.00",
         │      policyNumber: "POL-20260501-000123"
         │    }
         │  }
         ▼
  notification-service:
    │
    ├── 1. Lookup notification_templates WHERE event_code = "CLAIM_DECISION_APPROVED"
    │        title_template: "Your claim {{claimRef}} has been approved"
    │        body_template:  "Dear {{customerName}}, your claim for €{{approvedAmount}}..."
    │        channels: [IN_APP, EMAIL]
    │
    ├── 2. Resolve template variables
    │        title: "Your claim CLM-20260501-000045 has been approved"
    │        body:  "Dear John Smith, your claim for €1,200.00..."
    │
    ├── 3. Persist in-app notification
    │        INSERT notifications (userId, title, body, referenceId, referenceType,
    │                              isRead=false, createdAt=NOW())
    │
    ├── 4. Dispatch email (mock in local env — write to log file)
    │        TO: user.email
    │        SUBJECT: title
    │        BODY: HTML formatted body
    │
    └── 5. INSERT notification_delivery_log (notificationId, channel, status, timestamp)

Customer's Angular:
    - notification-service badge count API called on route change
    - Notification Center (UI-042) polls GET /notifications/my
    - Unread count displayed on sidebar bell icon
```

---

## 13. Audit Architecture

### 13.1 Audit Design Principles

```
IMMUTABILITY RULES:
  1. audit_logs table has NO UPDATE triggers — enforced at DB level
  2. The audit-service rejects any PUT/PATCH/DELETE on /audit/events
  3. DB user for audit-service has INSERT + SELECT only (no UPDATE/DELETE grants)
  4. audit_logs has no soft-delete column (no deleted_at, no is_active)
  5. Retention: records are kept indefinitely unless Admin exports + archives

WHAT IS AUDITED (minimum):
  - Every authentication event (login, logout, failed login, password reset)
  - Every policy state change (draft → quote → pending → active → expired)
  - Every underwriting action (assign, approve, decline, refer, escalate)
  - Every claims action (submit, review, assign field, decide, pay)
  - Every field action (accept assignment, submit report)
  - Every Admin configuration change (plan publish, rule publish, RBAC change)
  - Every document generation
  - Every permission-denied access attempt
```

### 13.2 Audit Event Structure

```
audit_logs table:
  id               BIGINT AUTO_INCREMENT PK
  correlation_id   VARCHAR(36)     — X-Correlation-ID from gateway
  event_type       VARCHAR(100)    — e.g., POLICY_ACTIVATED, UW_APPROVED
  entity_type      VARCHAR(50)     — POLICY / CLAIM / USER / RULE / PLAN
  entity_id        VARCHAR(50)     — the ID of the entity affected
  actor_user_id    VARCHAR(36)     — who performed the action (null for SYSTEM)
  actor_role       VARCHAR(50)     — role at time of action
  actor_ip         VARCHAR(45)     — IP from gateway headers
  old_state        TEXT            — JSON of previous state (nullable)
  new_state        TEXT            — JSON of new state (nullable)
  details          TEXT            — human-readable description
  service_name     VARCHAR(50)     — which service published this event
  occurred_at      DATETIME(6)     — nanosecond precision timestamp
  — NO updated_at, NO deleted_at, NO is_active
```

### 13.3 Audit Query Interfaces

```
GET /audit/events
  Filters: entityType, entityId, actorUserId, eventType, fromDate, toDate
  Pagination: page, size, sort=occurredAt:desc
  Used by: Admin Audit Viewer (UI-040)

GET /audit/events/entity/{type}/{id}
  Returns all events for a specific policy, claim, or user
  Used by: UW Audit Trail (UI-021), Claims timeline, Policy history

GET /audit/events/user/{userId}
  Returns all actions by a specific user
  Used by: Admin governance review

Audit Viewer (UI-040) features:
  - Full-text filter on details
  - Role-specific event filtering
  - Date range picker
  - Export to CSV
  - Drill-down to entity detail
```

---

## 14. Configuration Management Strategy

### 14.1 What Is Configuration-Driven

```
HARDCODED NOWHERE — ALL IN DATABASE:
  ┌─────────────────────────────────────┬──────────────────────────────────┐
  │ What                                │ How Configured                   │
  ├─────────────────────────────────────┼──────────────────────────────────┤
  │ Product types                       │ product_types table              │
  │ Plan names, base premiums           │ plans table                      │
  │ Coverage types + limits             │ coverage_types, plan_coverages   │
  │ Add-on catalog + pricing            │ addons, plan_addon_mappings      │
  │ Destination zones + countries       │ destination_zones, zone_countries│
  │ Risk scoring rules                  │ rule_definitions (RISK type)     │
  │ Premium loading rules               │ rule_definitions (PREMIUM type)  │
  │ Discount rules                      │ rule_definitions (DISCOUNT type) │
  │ Claim auto-decision rules           │ rule_definitions (CLAIM type)    │
  │ UW routing thresholds               │ rule_definitions + uw_sla_config │
  │ SLA hours per risk level            │ uw_sla_configurations            │
  │ Claim document checklists per type  │ claim_checklist_types            │
  │ High-value claim threshold          │ application config table         │
  │ Document templates + wording        │ document_templates               │
  │ Notification templates              │ notification_templates           │
  │ Role-to-permission mappings         │ role_permissions                 │
  │ Dashboard layouts                   │ dashboard_configurations         │
  └─────────────────────────────────────┴──────────────────────────────────┘
```

### 14.2 application.properties Management

```
Each service has:
  src/main/resources/
    application.properties          — base (version-controlled)
    application-dev.properties      — dev overrides (version-controlled)
    application-prod.properties     — prod overrides (gitignored — manual deployment)

Sensitive values (DB passwords, JWT secret, service tokens) are NEVER in version control.
They are set as environment variables or passed at Tomcat startup:
  -Dspring.datasource.password=xxx
  -Djwt.secret=xxx
  -Dservice.token=xxx

application.properties structure:
  # DB
  spring.datasource.url=jdbc:mysql://localhost:3306/insurance_platform
  spring.datasource.username=${DB_USER}
  spring.datasource.password=${DB_PASS}

  # Service token (inter-service auth)
  platform.service-token=${SERVICE_TOKEN}

  # JWT
  jwt.secret=${JWT_SECRET}
  jwt.access-token-expiry-ms=900000    # 15 min
  jwt.refresh-token-expiry-days=7

  # Document storage
  storage.document-root=/opt/insurance/storage/documents
  storage.upload-root=/opt/insurance/storage/uploads

  # SLA monitor schedule
  scheduler.uw-sla-check-cron=0 */15 * * * *
  scheduler.claim-sla-check-cron=0 */30 * * * *
  scheduler.quote-expiry-cron=0 0 * * * *
```

### 14.3 Database Migration Strategy (Flyway)

```
Each service has its own Flyway migration directory:
  src/main/resources/db/migration/
    V1__create_initial_schema.sql
    V2__add_plan_versioning.sql
    V3__add_uw_sla_configuration.sql
    ...

Rules:
  - NEVER modify an existing migration file after it is deployed
  - Add new V{n}__ files for schema changes
  - All services run Flyway on startup (spring.flyway.enabled=true)
  - Shared MySQL instance, separate schemas per service domain:
      auth_db, product_db, policy_db, rule_db,
      underwriting_db, claims_db, field_db,
      document_db, notification_db, audit_db, reporting_db
  - reporting-service reads from all schemas (read-only DB user)
```

### 14.4 Configuration Versioning

```
Plan / Rule / Template changes follow a publish workflow:

DRAFT (Admin edits) → PREVIEW (test with sample data) → PUBLISHED (live)

On PUBLISH:
  - New version number assigned
  - effective_from = NOW() (or future date for scheduled launch)
  - Previous version → SUPERSEDED (retained for historical reference)
  - In-memory cache in consuming services refreshed:
      rule-engine-service: refreshes rule cache on POST /rules/cache-refresh
      product-service: refreshes plan cache on POST /products/cache-refresh
      (Called by Admin portal after each publish action)

Version reference on quotes and policies:
  quote_snapshot.rule_version_id = rule_version at time of quoting
  policy_snapshot.plan_version_id = plan version at time of issuance
  policy_snapshot.rule_version_ids = { riskRule: v3, premiumRule: v7 }
```

---

## 15. Deployment Strategy

### 15.1 Local Development Deployment

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    LOCAL DEVELOPMENT ENVIRONMENT                        │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Developer Machine (Windows 11)                                 │   │
│  │                                                                 │   │
│  │  IDE: IntelliJ IDEA                                             │   │
│  │  JDK: Java 21                                                   │   │
│  │  Build: Maven                                                   │   │
│  │  DB: MySQL 8.0 (local install)                                  │   │
│  │  Frontend: Node.js + Angular CLI (ng serve — port 4200)        │   │
│  │                                                                 │   │
│  │  Services run as: java -jar service.jar (each in own terminal) │   │
│  │  OR: IntelliJ run configurations (one per service)             │   │
│  │                                                                 │   │
│  │  Storage: C:/insurance/storage/documents/                      │   │
│  │           C:/insurance/storage/uploads/                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Startup order (dependency-respecting):                                 │
│    1. MySQL                                                             │
│    2. auth-service       (no dependencies)                              │
│    3. product-service    (no dependencies)                              │
│    4. rule-engine-service(no dependencies)                              │
│    5. pricing-service    (depends on rule-engine)                       │
│    6. policy-service     (depends on product, pricing, rule-engine)     │
│    7. underwriting-service (depends on policy)                          │
│    8. claims-service     (depends on policy, rule-engine)               │
│    9. field-service      (depends on claims)                            │
│   10. document-service   (depends on policy, claims)                    │
│   11. notification-service (no hard dependencies)                       │
│   12. audit-service      (no hard dependencies)                         │
│   13. reporting-service  (depends on all — read-only)                   │
│   14. api-gateway-service (depends on all)                              │
│   15. Angular SPA        (ng serve)                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### 15.2 Production Deployment on Tomcat (Future)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   TOMCAT PRODUCTION DEPLOYMENT                          │
│                                                                         │
│  Server: Windows Server / Linux (bare metal or VM)                      │
│  JDK: Java 21 (installed system-wide)                                   │
│  Tomcat: Apache Tomcat 10.x                                             │
│                                                                         │
│  Option A: Executable JAR (embedded Tomcat — recommended for simplicity)│
│    Each service packaged as executable Spring Boot JAR                  │
│    Run as Windows Services or systemd units (Linux)                     │
│    java -jar auth-service.jar --spring.profiles.active=prod             │
│                                                                         │
│  Option B: WAR deployment on external Tomcat                            │
│    Each service packaged as WAR                                         │
│    Deployed to separate Tomcat instances (one per service)              │
│    Avoids port conflicts; managed via Tomcat Manager                    │
│                                                                         │
│  RECOMMENDATION: Option A (executable JAR) for simplicity.             │
│    - No external Tomcat management complexity                           │
│    - Spring Boot embedded Tomcat is production-grade                    │
│    - Easier to manage as Windows Services                               │
│    - Same artifact tested in dev and deployed in prod                   │
│                                                                         │
│  Angular:                                                               │
│    ng build --configuration production                                  │
│    dist/ files served by Nginx (lightweight) or Apache HTTPD           │
│    OR deployed as static files in api-gateway-service resources         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 15.3 Maven Project Structure

```
travel-insurance-platform/
  pom.xml                    ← parent POM (dependency management)
  shared-libs/
    common-dto/
    common-security/
    common-audit/
    common-exception/
    common-util/
    common-workflow/
  services/
    api-gateway-service/
    auth-service/
    product-service/
    pricing-service/
    rule-engine-service/
    policy-service/
    underwriting-service/
    claims-service/
    field-service/
    document-service/
    notification-service/
    audit-service/
    reporting-service/
  frontend/
    travel-insurance-ui/     ← Angular project
```

### 15.4 Jenkins CI/CD Pipeline (Future)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    JENKINS PIPELINE (FUTURE)                            │
│                                                                         │
│  Stage 1: Checkout                                                      │
│    git checkout branch                                                  │
│                                                                         │
│  Stage 2: Build shared-libs                                             │
│    mvn clean install -pl shared-libs/...                                │
│                                                                         │
│  Stage 3: Build + Test all services (parallel)                          │
│    mvn clean package -pl services/auth-service                          │
│    mvn clean package -pl services/product-service                       │
│    ... (all services in parallel)                                        │
│                                                                         │
│  Stage 4: Build Angular                                                 │
│    npm ci && ng build --configuration production                        │
│                                                                         │
│  Stage 5: Deploy (sequential, dependency order)                         │
│    Stop service → Replace JAR → Restart service → Health check          │
│    Health check: GET /actuator/health → 200 OK                          │
│                                                                         │
│  Stage 6: Smoke Tests                                                   │
│    Run integration test suite against deployed environment              │
└─────────────────────────────────────────────────────────────────────────┘
```

### 15.5 Health and Observability

```
Each Spring Boot service exposes:
  GET /actuator/health         → UP / DOWN status
  GET /actuator/info           → version, build info
  GET /actuator/metrics        → JVM, HTTP request metrics

Gateway health aggregation:
  GET /api/health              → aggregates all downstream /actuator/health

Logging strategy:
  - Logback structured JSON logging (local file)
  - Log file per service: /var/log/insurance/{service-name}.log
  - Log rotation: 10MB max size, 30-day retention
  - Each log line includes: correlationId, userId, service, level, message

Log levels:
  Production: INFO
  Development: DEBUG
  Never log: passwords, OTP values, full JWT tokens, PII in DEBUG
```

---

## Summary: Architecture Decision Records

```
┌──────┬────────────────────────────────────────┬────────────────────────────────────────┐
│ ADR  │ Decision                               │ Rationale                              │
├──────┼────────────────────────────────────────┼────────────────────────────────────────┤
│ 001  │ API Gateway as single entry point      │ Centralizes JWT validation, CORS,      │
│      │ (Spring Boot, no Spring Cloud)         │ routing without cloud dependency        │
├──────┼────────────────────────────────────────┼────────────────────────────────────────┤
│ 002  │ JWT in-memory (Angular) +              │ XSS protection for accessToken;        │
│      │ refresh in HttpOnly cookie             │ CSRF protection for refreshToken        │
├──────┼────────────────────────────────────────┼────────────────────────────────────────┤
│ 003  │ Custom DB-driven rule engine           │ No Drools/Camunda per constraints;     │
│      │ (no external engine)                   │ full explainability; Admin-configurable │
├──────┼────────────────────────────────────────┼────────────────────────────────────────┤
│ 004  │ iText 7 Community for PDF generation   │ Java-native, no cloud, production-grade│
│      │ (HTML template → PDF)                  │ template-driven approach               │
├──────┼────────────────────────────────────────┼────────────────────────────────────────┤
│ 005  │ Policy snapshot (JSON blob) at         │ Immutable point-in-time record;        │
│      │ issuance — all claims use snapshot     │ claims always reference issued terms    │
├──────┼────────────────────────────────────────┼────────────────────────────────────────┤
│ 006  │ DB-driven workflow state machine       │ No Camunda per constraints;            │
│      │ (no external BPM)                      │ configurable transitions in DB          │
├──────┼────────────────────────────────────────┼────────────────────────────────────────┤
│ 007  │ Audit-service with INSERT-only DB user │ Technical enforcement of immutability; │
│      │ (no UPDATE/DELETE privileges)          │ regulatory compliance                   │
├──────┼────────────────────────────────────────┼────────────────────────────────────────┤
│ 008  │ Shared MySQL instance, separate schemas│ Single DB server for local deployment; │
│      │ per service domain                     │ schema isolation for data ownership     │
├──────┼────────────────────────────────────────┼────────────────────────────────────────┤
│ 009  │ Executable Spring Boot JAR for prod    │ Simpler than WAR + Tomcat management;  │
│      │ (embedded Tomcat)                      │ same artifact in dev and prod           │
├──────┼────────────────────────────────────────┼────────────────────────────────────────┤
│ 010  │ Rule execution trace stored for ALL    │ Powers the explainability UI (UI-035); │
│      │ evaluations (matched + unmatched)      │ regulatory audit requirement            │
└──────┴────────────────────────────────────────┴────────────────────────────────────────┘
```
