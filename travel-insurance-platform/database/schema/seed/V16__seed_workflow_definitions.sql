-- =============================================================================
-- V16__seed_workflow_definitions.sql
-- Schema: ins_workflow
-- Description: Seed workflow definitions, states, and valid transitions for
--              UNDERWRITING and CLAIMS workflows.
-- =============================================================================

USE ins_workflow;

-- =============================================================================
-- Workflow Definitions
-- =============================================================================
INSERT INTO workflow_definitions (id, workflow_type, workflow_name, entity_type, is_active, version) VALUES
('wf-underwriting', 'UNDERWRITING', 'Policy Underwriting Workflow', 'POLICY', 1, 1),
('wf-claims',       'CLAIMS',       'Insurance Claims Workflow',    'CLAIM',  1, 1);

-- =============================================================================
-- UNDERWRITING Workflow States
-- =============================================================================
INSERT INTO workflow_states (id, workflow_id, state_code, state_name, is_initial, is_terminal, sla_hours, allowed_roles, sort_order) VALUES
('uws-new',         'wf-underwriting', 'NEW',              'New Case',             1, 0,  0,  'ROLE_ADMIN',                                        1),
('uws-assigned',    'wf-underwriting', 'ASSIGNED',         'Assigned',             0, 0,  24, 'ROLE_UNDERWRITER_L1,ROLE_UNDERWRITER_L2,ROLE_ADMIN', 2),
('uws-review',      'wf-underwriting', 'UNDER_REVIEW',     'Under Review',         0, 0,  24, 'ROLE_UNDERWRITER_L1,ROLE_UNDERWRITER_L2',           3),
('uws-info-req',    'wf-underwriting', 'INFO_REQUESTED',   'Info Requested',       0, 0,  72, 'ROLE_CUSTOMER',                                     4),
('uws-info-recv',   'wf-underwriting', 'INFO_RECEIVED',    'Info Received',        0, 0,  24, 'ROLE_UNDERWRITER_L1,ROLE_UNDERWRITER_L2',           5),
('uws-approved',    'wf-underwriting', 'APPROVED',         'Approved',             0, 0,  0,  NULL,                                                6),
('uws-rejected',    'wf-underwriting', 'REJECTED',         'Rejected',             0, 0,  0,  NULL,                                                7),
('uws-ref-l2',      'wf-underwriting', 'REFERRED_TO_L2',   'Referred to L2',       0, 0,  0,  'ROLE_UNDERWRITER_L2',                               8),
('uws-l2-review',   'wf-underwriting', 'L2_UNDER_REVIEW',  'L2 Under Review',      0, 0,  24, 'ROLE_UNDERWRITER_L2',                               9),
('uws-escalated',   'wf-underwriting', 'ESCALATED',        'Escalated',            0, 0,  24, 'ROLE_UNDERWRITER_L2,ROLE_ADMIN',                   10),
('uws-closed',      'wf-underwriting', 'CLOSED',           'Closed',               0, 1,  0,  NULL,                                               11);

-- =============================================================================
-- UNDERWRITING Workflow Transitions
-- =============================================================================
INSERT INTO workflow_transitions (id, workflow_id, from_state_id, to_state_id, trigger_event, required_role, is_auto_transition, description) VALUES
(UUID(), 'wf-underwriting', 'uws-new',       'uws-assigned',  'ASSIGN_UNDERWRITER',    'ROLE_ADMIN',              0, 'Admin or system assigns case to underwriter'),
(UUID(), 'wf-underwriting', 'uws-assigned',  'uws-review',    'CASE_OPENED',            'ROLE_UNDERWRITER_L1',     0, 'Underwriter opens and locks the case'),
(UUID(), 'wf-underwriting', 'uws-review',    'uws-info-req',  'REQUEST_MORE_INFO',      'ROLE_UNDERWRITER_L1',     0, 'Underwriter requests additional information'),
(UUID(), 'wf-underwriting', 'uws-info-req',  'uws-info-recv', 'CUSTOMER_PROVIDED_INFO', 'ROLE_CUSTOMER',           0, 'Customer submits requested information'),
(UUID(), 'wf-underwriting', 'uws-info-recv', 'uws-review',    'RESUME_REVIEW',          'ROLE_UNDERWRITER_L1',     0, 'Underwriter resumes review after receiving info'),
(UUID(), 'wf-underwriting', 'uws-review',    'uws-approved',  'UW_APPROVE',             'ROLE_UNDERWRITER_L1',     0, 'Underwriter approves the policy'),
(UUID(), 'wf-underwriting', 'uws-review',    'uws-rejected',  'UW_REJECT',              'ROLE_UNDERWRITER_L1',     0, 'Underwriter rejects the policy'),
(UUID(), 'wf-underwriting', 'uws-review',    'uws-ref-l2',    'UW_REFER_L2',            'ROLE_UNDERWRITER_L1',     0, 'Underwriter refers case to L2'),
(UUID(), 'wf-underwriting', 'uws-ref-l2',    'uws-l2-review', 'L2_CASE_OPENED',         'ROLE_UNDERWRITER_L2',     0, 'L2 Underwriter opens the referred case'),
(UUID(), 'wf-underwriting', 'uws-l2-review', 'uws-approved',  'L2_UW_APPROVE',          'ROLE_UNDERWRITER_L2',     0, 'L2 Underwriter approves'),
(UUID(), 'wf-underwriting', 'uws-l2-review', 'uws-rejected',  'L2_UW_REJECT',           'ROLE_UNDERWRITER_L2',     0, 'L2 Underwriter rejects'),
(UUID(), 'wf-underwriting', 'uws-l2-review', 'uws-escalated', 'L2_ESCALATE',            'ROLE_UNDERWRITER_L2',     0, 'L2 escalates to senior underwriter'),
(UUID(), 'wf-underwriting', 'uws-assigned',  'uws-escalated', 'SLA_BREACH',             NULL,                      1, 'System auto-escalates on SLA breach'),
(UUID(), 'wf-underwriting', 'uws-review',    'uws-escalated', 'SLA_BREACH',             NULL,                      1, 'System auto-escalates on SLA breach from review'),
(UUID(), 'wf-underwriting', 'uws-escalated', 'uws-approved',  'ESCALATION_APPROVE',     'ROLE_UNDERWRITER_L2',     0, 'Senior UW approves escalated case'),
(UUID(), 'wf-underwriting', 'uws-escalated', 'uws-rejected',  'ESCALATION_REJECT',      'ROLE_UNDERWRITER_L2',     0, 'Senior UW rejects escalated case'),
(UUID(), 'wf-underwriting', 'uws-approved',  'uws-closed',    'POLICY_ACTIVATED',       NULL,                      1, 'Auto-closed when policy is activated'),
(UUID(), 'wf-underwriting', 'uws-rejected',  'uws-closed',    'POLICY_REJECTED',        NULL,                      1, 'Auto-closed when policy is rejected');

-- =============================================================================
-- CLAIMS Workflow States
-- =============================================================================
INSERT INTO workflow_states (id, workflow_id, state_code, state_name, is_initial, is_terminal, sla_hours, allowed_roles, sort_order) VALUES
('cws-submitted',   'wf-claims', 'SUBMITTED',             'Submitted',                    1, 0,  0,  'ROLE_CUSTOMER',                      1),
('cws-doc-review',  'wf-claims', 'DOCUMENT_REVIEW',       'Document Review',               0, 0,  24, 'ROLE_CLAIMS_OFFICER',                2),
('cws-doc-pending', 'wf-claims', 'DOCUMENT_PENDING',      'Document Pending',              0, 0,  72, 'ROLE_CUSTOMER',                      3),
('cws-reviewing',   'wf-claims', 'UNDER_REVIEW',          'Under Review',                  0, 0,  48, 'ROLE_CLAIMS_OFFICER',                4),
('cws-invest',      'wf-claims', 'INVESTIGATION_ASSIGNED','Investigation Assigned',        0, 0,  72, 'ROLE_FIELD_OFFICER',                 5),
('cws-invest-done', 'wf-claims', 'INVESTIGATION_COMPLETE','Investigation Complete',        0, 0,  24, 'ROLE_CLAIMS_OFFICER',                6),
('cws-dec-pending', 'wf-claims', 'DECISION_PENDING',      'Decision Pending',              0, 0,  24, 'ROLE_CLAIMS_OFFICER',                7),
('cws-auto-approv', 'wf-claims', 'AUTO_APPROVED',         'Auto Approved',                 0, 0,  0,  NULL,                                 8),
('cws-auto-decl',   'wf-claims', 'AUTO_DECLINED',         'Auto Declined',                 0, 0,  0,  NULL,                                 9),
('cws-approved',    'wf-claims', 'APPROVED',              'Approved',                      0, 0,  0,  NULL,                                10),
('cws-partial',     'wf-claims', 'PARTIALLY_APPROVED',    'Partially Approved',            0, 0,  0,  NULL,                                11),
('cws-declined',    'wf-claims', 'DECLINED',              'Declined',                      0, 0,  0,  NULL,                                12),
('cws-payment',     'wf-claims', 'PAYMENT_PENDING',       'Payment Pending',               0, 0,  72, 'ROLE_FINANCE',                      13),
('cws-settled',     'wf-claims', 'SETTLED',               'Settled',                       0, 0,  0,  NULL,                                14),
('cws-closed',      'wf-claims', 'CLOSED',                'Closed',                        0, 1,  0,  NULL,                                15);

-- =============================================================================
-- CLAIMS Workflow Transitions
-- =============================================================================
INSERT INTO workflow_transitions (id, workflow_id, from_state_id, to_state_id, trigger_event, required_role, is_auto_transition, description) VALUES
(UUID(), 'wf-claims', 'cws-submitted',   'cws-doc-review',   'SYSTEM_VALIDATE_DOCS',    NULL,                     1, 'System validates doc completeness after submission'),
(UUID(), 'wf-claims', 'cws-doc-review',  'cws-doc-pending',  'DOCS_INCOMPLETE',          NULL,                     1, 'System flags missing documents'),
(UUID(), 'wf-claims', 'cws-doc-pending', 'cws-doc-review',   'CUSTOMER_UPLOAD_DOCS',     'ROLE_CUSTOMER',          0, 'Customer uploads missing documents'),
(UUID(), 'wf-claims', 'cws-doc-review',  'cws-reviewing',    'DOCS_COMPLETE',            NULL,                     1, 'All mandatory docs present — move to review'),
(UUID(), 'wf-claims', 'cws-reviewing',   'cws-auto-approv',  'AUTO_DECISION_APPROVE',    NULL,                     1, 'Rule engine auto-approves low-risk claim'),
(UUID(), 'wf-claims', 'cws-reviewing',   'cws-auto-decl',    'AUTO_DECISION_DECLINE',    NULL,                     1, 'Rule engine auto-declines claim'),
(UUID(), 'wf-claims', 'cws-reviewing',   'cws-invest',       'ASSIGN_FIELD_OFFICER',     'ROLE_CLAIMS_OFFICER',    0, 'Officer assigns field investigation'),
(UUID(), 'wf-claims', 'cws-invest',      'cws-invest-done',  'FIELD_REPORT_SUBMITTED',   'ROLE_FIELD_OFFICER',     0, 'Field officer submits report'),
(UUID(), 'wf-claims', 'cws-invest-done', 'cws-dec-pending',  'REVIEW_COMPLETE',          'ROLE_CLAIMS_OFFICER',    0, 'Officer completes review after field report'),
(UUID(), 'wf-claims', 'cws-reviewing',   'cws-dec-pending',  'REVIEW_COMPLETE',          'ROLE_CLAIMS_OFFICER',    0, 'Officer completes manual review'),
(UUID(), 'wf-claims', 'cws-dec-pending', 'cws-approved',     'CLAIM_APPROVE',            'ROLE_CLAIMS_OFFICER',    0, 'Officer approves the claim'),
(UUID(), 'wf-claims', 'cws-dec-pending', 'cws-partial',      'CLAIM_PARTIAL_APPROVE',    'ROLE_CLAIMS_OFFICER',    0, 'Officer partially approves the claim'),
(UUID(), 'wf-claims', 'cws-dec-pending', 'cws-declined',     'CLAIM_DECLINE',            'ROLE_CLAIMS_OFFICER',    0, 'Officer declines the claim'),
(UUID(), 'wf-claims', 'cws-approved',    'cws-payment',      'DECISION_FINALIZED',       NULL,                     1, 'Auto-move to payment after approval'),
(UUID(), 'wf-claims', 'cws-partial',     'cws-payment',      'DECISION_FINALIZED',       NULL,                     1, 'Auto-move to payment after partial approval'),
(UUID(), 'wf-claims', 'cws-auto-approv', 'cws-payment',      'DECISION_FINALIZED',       NULL,                     1, 'Auto-move to payment after auto approval'),
(UUID(), 'wf-claims', 'cws-payment',     'cws-settled',      'PAYMENT_PROCESSED',        'ROLE_FINANCE',           0, 'Finance records payment completion'),
(UUID(), 'wf-claims', 'cws-settled',     'cws-closed',       'CLOSE_CLAIM',              NULL,                     1, 'Auto-close after settlement'),
(UUID(), 'wf-claims', 'cws-declined',    'cws-closed',       'CLOSE_CLAIM',              NULL,                     1, 'Auto-close after decline'),
(UUID(), 'wf-claims', 'cws-auto-decl',   'cws-closed',       'CLOSE_CLAIM',              NULL,                     1, 'Auto-close after auto-decline');

-- =============================================================================
-- Platform Configurations
-- =============================================================================
INSERT INTO platform_configurations (id, config_key, config_value, config_type, description) VALUES
(UUID(), 'quote.validity.hours',                     '48',     'NUMBER',  'Hours a quote remains valid before expiry'),
(UUID(), 'policy.renewal.advance_notify_days',        '30',     'NUMBER',  'Days before expiry to send renewal reminder'),
(UUID(), 'password.history.limit',                   '5',      'NUMBER',  'Number of previous passwords that cannot be reused'),
(UUID(), 'login.max_failed_attempts',                '5',      'NUMBER',  'Max consecutive failed logins before account lock'),
(UUID(), 'login.lock_duration_minutes',              '30',     'NUMBER',  'Minutes account remains locked after max failed attempts'),
(UUID(), 'otp.expiry.minutes',                       '10',     'NUMBER',  'OTP validity period in minutes'),
(UUID(), 'otp.resend.cooldown.seconds',              '60',     'NUMBER',  'Seconds before customer can request a new OTP'),
(UUID(), 'claim.high_value_threshold',               '50000',  'NUMBER',  'Claims above this amount are flagged as high-value in queue'),
(UUID(), 'document.max_upload_size_mb',              '5',      'NUMBER',  'Maximum file size for customer document uploads (MB)'),
(UUID(), 'document.allowed_mime_types',              'application/pdf,image/jpeg,image/png', 'STRING', 'Comma-separated allowed MIME types for uploads'),
(UUID(), 'document.max_files_per_claim',             '10',     'NUMBER',  'Maximum number of files per claim submission'),
(UUID(), 'scheduler.uw_sla_check_cron',              '0 */15 * * * *', 'STRING', 'Cron expression for UW SLA breach check'),
(UUID(), 'scheduler.claim_sla_check_cron',           '0 */30 * * * *', 'STRING', 'Cron expression for claims SLA breach check'),
(UUID(), 'scheduler.quote_expiry_cron',              '0 0 * * * *',    'STRING', 'Cron expression for quote expiry job'),
(UUID(), 'scheduler.renewal_reminder_cron',          '0 0 8 * * *',    'STRING', 'Cron expression for policy renewal reminder job'),
(UUID(), 'storage.document_root',                    '/opt/insurance/storage/documents', 'STRING', 'Root path for generated PDF documents'),
(UUID(), 'storage.upload_root',                      '/opt/insurance/storage/uploads',   'STRING', 'Root path for customer-uploaded documents'),
(UUID(), 'premium.tax_rate_percent',                 '18',     'NUMBER',  'GST/tax rate applied to net premium'),
(UUID(), 'uw.premium_loading.max_percent',           '50',     'NUMBER',  'Maximum premium loading percentage underwriter can apply'),
(UUID(), 'jwt.access_token_expiry_minutes',          '15',     'NUMBER',  'JWT access token validity in minutes'),
(UUID(), 'jwt.refresh_token_expiry_days',            '7',      'NUMBER',  'JWT refresh token validity in days');
