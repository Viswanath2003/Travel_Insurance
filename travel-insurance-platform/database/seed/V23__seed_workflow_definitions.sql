-- =============================================================================
-- V23__seed_workflow_definitions.sql
-- Schema: ins_workflow
-- Description: Seed workflow state machine definitions as JSON in
--              platform_configurations (group: WORKFLOW).
--
-- Removed vs old seed (V16__seed_workflow_definitions.sql):
--   - workflow_definitions table   → JSONB config entries (group: WORKFLOW)
--   - workflow_states table        → embedded in JSONB config entries
--   - workflow_transitions table   → embedded in JSONB config entries
--
-- Three workflows defined:
--   1. POLICY_ISSUANCE  — quote → payment → risk routing → active/review
--   2. UNDERWRITING     — single-tier UW queue → review → decision/forward
--   3. CLAIMS_PROCESSING — submission → review → investigation → decision → payout
-- =============================================================================

SET search_path = ins_workflow, public;

INSERT INTO ins_workflow.platform_configurations
    (id, config_key, config_value, value_type, description, group_name, is_active)
VALUES

-- =============================================================================
-- 1. Policy Issuance Workflow
-- =============================================================================
('f1a2b3c4-0001-0000-0000-000000000001',
 'workflow.policy_issuance',
 '{
  "code": "POLICY_ISSUANCE",
  "name": "Policy Issuance Workflow",
  "domain": "POLICY",
  "version": 1,
  "states": [
    {"code":"QUOTE_CREATED",     "name":"Quote Created",        "type":"INITIAL"},
    {"code":"PAYMENT_PENDING",   "name":"Payment Pending",      "type":"INTERMEDIATE"},
    {"code":"PAYMENT_CONFIRMED", "name":"Payment Confirmed",    "type":"INTERMEDIATE"},
    {"code":"ACTIVE",            "name":"Active",               "type":"TERMINAL"},
    {"code":"PENDING_REVIEW",    "name":"Pending Review",       "type":"INTERMEDIATE"},
    {"code":"PENDING_UW",        "name":"Pending UW Review",    "type":"INTERMEDIATE"},
    {"code":"FORWARDED_TO_FIELD","name":"Forwarded to Field",   "type":"INTERMEDIATE"},
    {"code":"REJECTED",          "name":"Rejected",             "type":"TERMINAL"},
    {"code":"CANCELLED",         "name":"Cancelled",            "type":"TERMINAL"},
    {"code":"EXPIRED",           "name":"Expired",              "type":"TERMINAL"}
  ],
  "transitions": [
    {"from":"QUOTE_CREATED",      "to":"PAYMENT_PENDING",    "code":"INITIATE_PAYMENT",   "actor":"ROLE_CUSTOMER"},
    {"from":"PAYMENT_PENDING",    "to":"PAYMENT_CONFIRMED",  "code":"CONFIRM_PAYMENT",    "actor":"SYSTEM"},
    {"from":"PAYMENT_CONFIRMED",  "to":"ACTIVE",             "code":"AUTO_ISSUE",         "actor":"SYSTEM",       "condition":"riskScore <= 30"},
    {"from":"PAYMENT_CONFIRMED",  "to":"PENDING_REVIEW",     "code":"ROUTE_CO_REVIEW",    "actor":"SYSTEM",       "condition":"riskScore 31-50"},
    {"from":"PAYMENT_CONFIRMED",  "to":"PENDING_UW",         "code":"ROUTE_UW_REVIEW",    "actor":"SYSTEM",       "condition":"riskScore > 50"},
    {"from":"PENDING_REVIEW",     "to":"ACTIVE",             "code":"CO_APPROVE",         "actor":"ROLE_CLAIMS_OFFICER"},
    {"from":"PENDING_REVIEW",     "to":"REJECTED",           "code":"CO_REJECT",          "actor":"ROLE_CLAIMS_OFFICER"},
    {"from":"PENDING_UW",         "to":"ACTIVE",             "code":"UW_APPROVE",         "actor":"ROLE_UNDERWRITER"},
    {"from":"PENDING_UW",         "to":"REJECTED",           "code":"UW_REJECT",          "actor":"ROLE_UNDERWRITER"},
    {"from":"PENDING_UW",         "to":"FORWARDED_TO_FIELD", "code":"FORWARD_TO_FIELD",   "actor":"ROLE_UNDERWRITER"},
    {"from":"FORWARDED_TO_FIELD", "to":"PENDING_UW",         "code":"FIELD_REPORT_IN",    "actor":"ROLE_FIELD_OFFICER"},
    {"from":"ACTIVE",             "to":"CANCELLED",          "code":"CANCEL",             "actor":"ROLE_CUSTOMER"},
    {"from":"ACTIVE",             "to":"EXPIRED",            "code":"EXPIRE",             "actor":"SYSTEM"}
  ]
}',
 'JSON',
 'Policy issuance state machine: from quote through payment, risk routing, UW review to active/rejected',
 'WORKFLOW', TRUE),

-- =============================================================================
-- 2. Underwriting Workflow  (single-tier — no L1/L2 split)
-- =============================================================================
('f1a2b3c4-0002-0000-0000-000000000002',
 'workflow.underwriting',
 '{
  "code": "UNDERWRITING",
  "name": "Underwriting Workflow",
  "domain": "UNDERWRITING",
  "version": 1,
  "states": [
    {"code":"NEW",                       "name":"New",                         "type":"INITIAL"},
    {"code":"ASSIGNED",                  "name":"Assigned",                    "type":"INTERMEDIATE"},
    {"code":"UNDER_REVIEW",              "name":"Under Review",                "type":"INTERMEDIATE"},
    {"code":"INFO_REQUESTED",            "name":"Information Requested",       "type":"INTERMEDIATE"},
    {"code":"INFO_RECEIVED",             "name":"Information Received",        "type":"INTERMEDIATE"},
    {"code":"FORWARDED_TO_FIELD",        "name":"Forwarded to Field",          "type":"INTERMEDIATE"},
    {"code":"FIELD_REPORT_RECEIVED",     "name":"Field Report Received",       "type":"INTERMEDIATE"},
    {"code":"APPROVED",                  "name":"Approved",                    "type":"TERMINAL"},
    {"code":"APPROVED_WITH_CONDITIONS",  "name":"Approved with Conditions",    "type":"TERMINAL"},
    {"code":"REJECTED",                  "name":"Rejected",                    "type":"TERMINAL"},
    {"code":"CLOSED",                    "name":"Closed",                      "type":"TERMINAL"}
  ],
  "transitions": [
    {"from":"NEW",                   "to":"ASSIGNED",                 "code":"ASSIGN",             "actor":"ROLE_UNDERWRITER",    "name":"Assign to Underwriter"},
    {"from":"ASSIGNED",              "to":"UNDER_REVIEW",             "code":"START_REVIEW",        "actor":"ROLE_UNDERWRITER",    "name":"Start Review"},
    {"from":"UNDER_REVIEW",          "to":"INFO_REQUESTED",           "code":"REQUEST_INFO",        "actor":"ROLE_UNDERWRITER",    "name":"Request Additional Info"},
    {"from":"INFO_REQUESTED",        "to":"INFO_RECEIVED",            "code":"INFO_SUBMITTED",      "actor":"ROLE_CUSTOMER",       "name":"Customer Submits Info"},
    {"from":"INFO_RECEIVED",         "to":"UNDER_REVIEW",             "code":"RESUME_REVIEW",       "actor":"ROLE_UNDERWRITER",    "name":"Resume Review"},
    {"from":"UNDER_REVIEW",          "to":"APPROVED",                 "code":"APPROVE",             "actor":"ROLE_UNDERWRITER",    "name":"Approve Policy"},
    {"from":"UNDER_REVIEW",          "to":"APPROVED_WITH_CONDITIONS", "code":"APPROVE_CONDITIONAL", "actor":"ROLE_UNDERWRITER",    "name":"Approve with Conditions"},
    {"from":"UNDER_REVIEW",          "to":"REJECTED",                 "code":"REJECT",              "actor":"ROLE_UNDERWRITER",    "name":"Reject Policy"},
    {"from":"UNDER_REVIEW",          "to":"FORWARDED_TO_FIELD",       "code":"FORWARD_TO_FIELD",    "actor":"ROLE_UNDERWRITER",    "name":"Forward to Field Officer"},
    {"from":"FORWARDED_TO_FIELD",    "to":"FIELD_REPORT_RECEIVED",    "code":"SUBMIT_FIELD_REPORT", "actor":"ROLE_FIELD_OFFICER",  "name":"Submit Field Report"},
    {"from":"FIELD_REPORT_RECEIVED", "to":"UNDER_REVIEW",             "code":"RESUME_AFTER_FIELD",  "actor":"ROLE_UNDERWRITER",    "name":"Resume Review After Field"},
    {"from":"APPROVED",              "to":"CLOSED",                   "code":"CLOSE",               "actor":"SYSTEM",              "name":"Close Case"},
    {"from":"REJECTED",              "to":"CLOSED",                   "code":"CLOSE",               "actor":"SYSTEM",              "name":"Close Case"}
  ]
}',
 'JSON',
 'Underwriting state machine: single-tier UW review with optional field forwarding',
 'WORKFLOW', TRUE),

-- =============================================================================
-- 3. Claims Processing Workflow
-- =============================================================================
('f1a2b3c4-0003-0000-0000-000000000003',
 'workflow.claims_processing',
 '{
  "code": "CLAIMS_PROCESSING",
  "name": "Claims Processing Workflow",
  "domain": "CLAIMS",
  "version": 1,
  "states": [
    {"code":"SUBMITTED",              "name":"Submitted",               "type":"INITIAL"},
    {"code":"DOCUMENT_REVIEW",        "name":"Document Review",         "type":"INTERMEDIATE"},
    {"code":"DOCUMENT_PENDING",       "name":"Document Pending",        "type":"INTERMEDIATE"},
    {"code":"UNDER_REVIEW",           "name":"Under Review",            "type":"INTERMEDIATE"},
    {"code":"INVESTIGATION_ASSIGNED", "name":"Investigation Assigned",  "type":"INTERMEDIATE"},
    {"code":"INVESTIGATION_COMPLETE", "name":"Investigation Complete",  "type":"INTERMEDIATE"},
    {"code":"DECISION_PENDING",       "name":"Decision Pending",        "type":"INTERMEDIATE"},
    {"code":"AUTO_APPROVED",          "name":"Auto Approved",           "type":"INTERMEDIATE"},
    {"code":"AUTO_DECLINED",          "name":"Auto Declined",           "type":"TERMINAL"},
    {"code":"APPROVED",               "name":"Approved",                "type":"INTERMEDIATE"},
    {"code":"PARTIALLY_APPROVED",     "name":"Partially Approved",      "type":"INTERMEDIATE"},
    {"code":"DECLINED",               "name":"Declined",                "type":"TERMINAL"},
    {"code":"PAYMENT_PENDING",        "name":"Payment Pending",         "type":"INTERMEDIATE"},
    {"code":"SETTLED",                "name":"Settled",                 "type":"TERMINAL"},
    {"code":"CLOSED",                 "name":"Closed",                  "type":"TERMINAL"}
  ],
  "transitions": [
    {"from":"SUBMITTED",              "to":"AUTO_APPROVED",          "code":"AUTO_APPROVE",       "actor":"SYSTEM",              "condition":"amount ≤ 5000 AND type IN (FLIGHT_DELAY, BAGGAGE_LOSS)"},
    {"from":"SUBMITTED",              "to":"DOCUMENT_REVIEW",        "code":"BEGIN_REVIEW",       "actor":"ROLE_CLAIMS_OFFICER", "name":"Begin Document Review"},
    {"from":"DOCUMENT_REVIEW",        "to":"DOCUMENT_PENDING",       "code":"REQUEST_DOCS",       "actor":"ROLE_CLAIMS_OFFICER", "name":"Request Missing Documents"},
    {"from":"DOCUMENT_PENDING",       "to":"DOCUMENT_REVIEW",        "code":"DOCS_SUBMITTED",     "actor":"ROLE_CUSTOMER",       "name":"Customer Submits Documents"},
    {"from":"DOCUMENT_REVIEW",        "to":"UNDER_REVIEW",           "code":"DOCS_VERIFIED",      "actor":"ROLE_CLAIMS_OFFICER", "name":"Documents Verified"},
    {"from":"UNDER_REVIEW",           "to":"INVESTIGATION_ASSIGNED", "code":"ASSIGN_FIELD",       "actor":"ROLE_CLAIMS_OFFICER", "name":"Assign Field Investigation"},
    {"from":"INVESTIGATION_ASSIGNED", "to":"INVESTIGATION_COMPLETE", "code":"SUBMIT_REPORT",      "actor":"ROLE_FIELD_OFFICER",  "name":"Submit Field Report"},
    {"from":"INVESTIGATION_COMPLETE", "to":"DECISION_PENDING",       "code":"PROCEED_TO_DECISION","actor":"ROLE_CLAIMS_OFFICER", "name":"Proceed to Decision"},
    {"from":"UNDER_REVIEW",           "to":"DECISION_PENDING",       "code":"PROCEED_TO_DECISION","actor":"ROLE_CLAIMS_OFFICER", "name":"Proceed to Decision"},
    {"from":"DECISION_PENDING",       "to":"APPROVED",               "code":"APPROVE",            "actor":"ROLE_CLAIMS_OFFICER", "name":"Approve Claim"},
    {"from":"DECISION_PENDING",       "to":"PARTIALLY_APPROVED",     "code":"PARTIAL_APPROVE",    "actor":"ROLE_CLAIMS_OFFICER", "name":"Partially Approve Claim"},
    {"from":"DECISION_PENDING",       "to":"DECLINED",               "code":"DECLINE",            "actor":"ROLE_CLAIMS_OFFICER", "name":"Decline Claim"},
    {"from":"AUTO_APPROVED",          "to":"PAYMENT_PENDING",        "code":"INITIATE_PAYMENT",   "actor":"ROLE_FINANCE",        "name":"Initiate Payment"},
    {"from":"APPROVED",               "to":"PAYMENT_PENDING",        "code":"INITIATE_PAYMENT",   "actor":"ROLE_FINANCE",        "name":"Initiate Payment"},
    {"from":"PARTIALLY_APPROVED",     "to":"PAYMENT_PENDING",        "code":"INITIATE_PAYMENT",   "actor":"ROLE_FINANCE",        "name":"Initiate Partial Payment"},
    {"from":"PAYMENT_PENDING",        "to":"SETTLED",                "code":"SETTLE",             "actor":"ROLE_FINANCE",        "name":"Process Payout & Settle"},
    {"from":"SETTLED",                "to":"CLOSED",                 "code":"CLOSE",              "actor":"SYSTEM",              "name":"Close Claim"},
    {"from":"DECLINED",               "to":"CLOSED",                 "code":"CLOSE",              "actor":"SYSTEM",              "name":"Close Claim"},
    {"from":"AUTO_DECLINED",          "to":"CLOSED",                 "code":"CLOSE",              "actor":"SYSTEM",              "name":"Close Claim"}
  ]
}',
 'JSON',
 'Claims processing state machine: submission through document review, field investigation, decision, payout, settlement',
 'WORKFLOW', TRUE)

ON CONFLICT (config_key) DO NOTHING;
