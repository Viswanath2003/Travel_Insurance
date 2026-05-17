-- =============================================================================
-- V25__seed_notification_templates.sql
-- Schema: ins_workflow
-- Description: Seed notification event configuration as platform_configurations
--              entries (group: NOTIFICATIONS).
--
-- Removed vs old seed:
--   - ins_notification.notification_templates table → does not exist in new schema.
--     Notification content is stored inline when events fire; no templates table.
--
-- This file seeds:
--   1. notifications.event_config  — event-to-role mapping + default priority
--   2. notifications.channel_config — delivery channel settings
--
-- Role codes (7 roles, no ROLE_ADMIN, no ROLE_UNDERWRITER_L1/L2):
--   ROLE_CUSTOMER | ROLE_AGENT | ROLE_UNDERWRITER
--   ROLE_CLAIMS_OFFICER | ROLE_FIELD_OFFICER
--   ROLE_FINANCE | ROLE_RELATIONSHIP_MANAGER
-- =============================================================================

SET search_path = ins_workflow, public;

INSERT INTO ins_workflow.platform_configurations
    (id, config_key, config_value, value_type, description, group_name, is_active)
VALUES

-- =============================================================================
-- Notification Event Config
-- Defines which roles receive each platform event and at what priority.
-- Used by the notification service to route events to the right role inboxes.
-- title_template / body_template: {{variable}} placeholders for runtime substitution.
-- =============================================================================
('h1i2j3k4-0001-0000-0000-000000000001',
 'notifications.event_config',
 '[
  {
    "event_code": "POLICY_ACTIVE",
    "target_role": "ROLE_CUSTOMER",
    "priority": "HIGH",
    "title_template": "Policy Active!",
    "body_template": "{{planName}} ({{policyNumber}}) is now active. Your travel is covered."
  },
  {
    "event_code": "POLICY_SUBMITTED_REVIEW",
    "target_role": "ROLE_CUSTOMER",
    "priority": "NORMAL",
    "title_template": "Policy Submitted for Review",
    "body_template": "{{planName}} ({{policyNumber}}) is under review. {{statusLabel}}"
  },
  {
    "event_code": "POLICY_APPROVED",
    "target_role": "ROLE_CUSTOMER",
    "priority": "HIGH",
    "title_template": "Policy Approved!",
    "body_template": "Your policy {{policyNumber}} has been approved and is now active. {{remarks}}"
  },
  {
    "event_code": "POLICY_APPROVED_CONDITIONAL",
    "target_role": "ROLE_CUSTOMER",
    "priority": "HIGH",
    "title_template": "Policy Approved with Conditions",
    "body_template": "Policy {{policyNumber}} approved. Conditions: {{remarks}}"
  },
  {
    "event_code": "POLICY_REJECTED",
    "target_role": "ROLE_CUSTOMER",
    "priority": "HIGH",
    "title_template": "Policy Application Rejected",
    "body_template": "We regret that policy {{policyNumber}} could not be approved. Reason: {{remarks}}"
  },
  {
    "event_code": "POLICY_FORWARDED_FIELD",
    "target_role": "ROLE_CUSTOMER",
    "priority": "NORMAL",
    "title_template": "Application Under Extended Review",
    "body_template": "Policy {{policyNumber}} is undergoing field verification. You will hear back within 3-5 business days."
  },
  {
    "event_code": "UW_CASE_CREATED",
    "target_role": "ROLE_UNDERWRITER",
    "priority": "HIGH",
    "title_template": "New Policy in Queue",
    "body_template": "{{policyNumber}} · {{planName}} · Score: {{riskScore}} · {{customerName}}"
  },
  {
    "event_code": "UW_CASE_FORWARDED_FIELD",
    "target_role": "ROLE_FIELD_OFFICER",
    "priority": "HIGH",
    "title_template": "Field Investigation Required",
    "body_template": "Policy {{policyNumber}} — Risk Score: {{riskScore}} · {{customerName}} — Forwarded by underwriter for field assessment."
  },
  {
    "event_code": "CO_CASE_CREATED",
    "target_role": "ROLE_CLAIMS_OFFICER",
    "priority": "HIGH",
    "title_template": "New Policy Pending Review",
    "body_template": "{{policyNumber}} · {{planName}} · Score: {{riskScore}} · Customer: {{customerName}}"
  },
  {
    "event_code": "CLAIM_SUBMITTED",
    "target_role": "ROLE_CUSTOMER",
    "priority": "NORMAL",
    "title_template": "Claim Submitted",
    "body_template": "Your claim {{claimReference}} for ₹{{claimedAmount}} has been submitted successfully."
  },
  {
    "event_code": "CLAIM_NEW_CO_REVIEW",
    "target_role": "ROLE_CLAIMS_OFFICER",
    "priority": "HIGH",
    "title_template": "New Claim Submitted",
    "body_template": "{{claimReference}} · {{claimType}} · ₹{{claimedAmount}} · Customer: {{customerName}}"
  },
  {
    "event_code": "CLAIM_APPROVED",
    "target_role": "ROLE_CUSTOMER",
    "priority": "HIGH",
    "title_template": "Claim Approved",
    "body_template": "Your claim {{claimReference}} has been approved. Settlement amount: ₹{{approvedAmount}}."
  },
  {
    "event_code": "CLAIM_PARTIALLY_APPROVED",
    "target_role": "ROLE_CUSTOMER",
    "priority": "HIGH",
    "title_template": "Claim Partially Approved",
    "body_template": "Your claim {{claimReference}} has been partially approved for ₹{{approvedAmount}}. {{remarks}}"
  },
  {
    "event_code": "CLAIM_DECLINED",
    "target_role": "ROLE_CUSTOMER",
    "priority": "HIGH",
    "title_template": "Claim Declined",
    "body_template": "We regret that your claim {{claimReference}} has been declined. Reason: {{remarks}}"
  },
  {
    "event_code": "CLAIM_SETTLED",
    "target_role": "ROLE_CUSTOMER",
    "priority": "HIGH",
    "title_template": "Claim Settled — Payment Processed",
    "body_template": "Your claim {{claimReference}} has been settled. ₹{{settledAmount}} has been transferred to your account."
  },
  {
    "event_code": "FIELD_ASSIGNMENT_CREATED",
    "target_role": "ROLE_FIELD_OFFICER",
    "priority": "HIGH",
    "title_template": "New Field Investigation Assigned",
    "body_template": "Claim {{claimReference}} · {{investigationType}} · Location: {{location}} · Due: {{dueAt}}"
  },
  {
    "event_code": "PREMIUM_RECEIVED",
    "target_role": "ROLE_FINANCE",
    "priority": "NORMAL",
    "title_template": "Premium Received",
    "body_template": "₹{{premiumAmount}} collected for policy {{policyNumber}} ({{planName}})"
  },
  {
    "event_code": "PAYOUT_PENDING",
    "target_role": "ROLE_FINANCE",
    "priority": "HIGH",
    "title_template": "Claim Payout Pending",
    "body_template": "Claim {{claimReference}} approved for ₹{{approvedAmount}}. Payout pending processing."
  },
  {
    "event_code": "NEW_POLICY_AGENT",
    "target_role": "ROLE_AGENT",
    "priority": "NORMAL",
    "title_template": "New Policy Sold",
    "body_template": "{{customerName}} purchased {{planName}} — ₹{{premiumAmount}}"
  },
  {
    "event_code": "NEW_POLICY_RM",
    "target_role": "ROLE_RELATIONSHIP_MANAGER",
    "priority": "NORMAL",
    "title_template": "New Policy Sold",
    "body_template": "{{customerName}} purchased {{planName}} — ₹{{premiumAmount}}"
  },
  {
    "event_code": "RENEWAL_REMINDER",
    "target_role": "ROLE_RELATIONSHIP_MANAGER",
    "priority": "NORMAL",
    "title_template": "Policy Renewal Reminder",
    "body_template": "{{policyNumber}} ({{planName}}) for {{customerName}} expires in {{daysLeft}} days."
  },
  {
    "event_code": "PROFILE_UPDATE_REQUEST",
    "target_role": "ROLE_UNDERWRITER",
    "priority": "LOW",
    "title_template": "Profile Update Request",
    "body_template": "Customer {{customerName}} ({{customerEmail}}) has submitted a profile update request."
  },
  {
    "event_code": "PROFILE_UPDATE_APPROVED",
    "target_role": "ROLE_CUSTOMER",
    "priority": "NORMAL",
    "title_template": "Profile Update Approved",
    "body_template": "Your profile update request has been reviewed and approved."
  }
]',
 'JSON',
 'Notification event configuration: event codes, target roles, priority, title and body templates',
 'NOTIFICATIONS', TRUE),

-- =============================================================================
-- Notification Channel Configuration
-- =============================================================================
('h1i2j3k4-0002-0000-0000-000000000002',
 'notifications.channel_config',
 '[
  {"channel":"IN_APP",  "enabled":true,  "description":"In-app notification drawer — all roles"},
  {"channel":"EMAIL",   "enabled":false, "description":"Email delivery — production use only"},
  {"channel":"SMS",     "enabled":false, "description":"SMS delivery — production use only"}
]',
 'JSON',
 'Notification delivery channel config: which channels are active in this environment',
 'NOTIFICATIONS', TRUE),

-- =============================================================================
-- Notification Retention Policy
-- =============================================================================
('h1i2j3k4-0003-0000-0000-000000000003',
 'notifications.retention_days', '90', 'NUMBER',
 'Number of days to retain read notifications before archiving or deletion',
 'NOTIFICATIONS', TRUE)

ON CONFLICT (config_key) DO NOTHING;
