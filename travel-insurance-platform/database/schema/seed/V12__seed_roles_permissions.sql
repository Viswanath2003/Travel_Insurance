-- =============================================================================
-- V12__seed_roles_permissions.sql
-- Schema: ins_auth
-- Description: Seed core roles and all platform permissions.
--              Role-to-permission mappings seeded for all system roles.
-- =============================================================================

USE ins_auth;

-- =============================================================================
-- Roles
-- =============================================================================
INSERT INTO roles (id, role_code, role_name, description, is_system_role, is_active) VALUES
('role-customer',       'ROLE_CUSTOMER',              'Customer',                   'Policyholder — buy policies, submit claims',                            1, 1),
('role-agent',          'ROLE_AGENT',                 'Agent / Broker',             'Insurance agent — quote and bind policies for customers',               1, 1),
('role-uw-l1',          'ROLE_UNDERWRITER_L1',        'Underwriter L1',             'Level 1 underwriter — review HIGH risk policies',                      1, 1),
('role-uw-l2',          'ROLE_UNDERWRITER_L2',        'Underwriter L2',             'Level 2 underwriter — review VERY_HIGH and escalated cases',           1, 1),
('role-claims-officer', 'ROLE_CLAIMS_OFFICER',        'Claims Officer',             'Process and decide on insurance claims',                                1, 1),
('role-field-officer',  'ROLE_FIELD_OFFICER',         'Field Officer',              'Conduct field investigations and submit reports',                       1, 1),
('role-finance',        'ROLE_FINANCE',               'Finance Officer',            'Process payments and manage financial reports',                         1, 1),
('role-admin',          'ROLE_ADMIN',                 'Administrator',              'Full configuration access — plans, rules, RBAC, reports',              1, 1),
('role-rm',             'ROLE_RELATIONSHIP_MANAGER',  'Relationship Manager',       'Manages customer portfolio — onboard clients, track their policies and claims', 1, 1);

-- =============================================================================
-- Permissions — grouped by domain
-- =============================================================================
INSERT INTO permissions (id, permission_code, permission_name, domain) VALUES
-- POLICY domain
('perm-pol-read',        'POLICY_READ',         'View own policies',              'POLICY'),
('perm-pol-view-all',    'POLICY_VIEW_ALL',     'View all policies',              'POLICY'),
('perm-pol-write',       'POLICY_WRITE',        'Create / modify policies',       'POLICY'),
('perm-pol-cancel',      'POLICY_CANCEL',       'Request policy cancellation',    'POLICY'),
('perm-pol-renew',       'POLICY_RENEW',        'Renew a policy',                 'POLICY'),

-- QUOTE domain
('perm-quote-create',    'QUOTE_CREATE',        'Create quotes',                  'POLICY'),
('perm-quote-view',      'QUOTE_VIEW',          'View quotes',                    'POLICY'),

-- UNDERWRITING domain
('perm-uw-view',         'UW_VIEW',             'View underwriting queue',        'UNDERWRITING'),
('perm-uw-approve',      'UW_APPROVE',          'Approve underwriting cases',     'UNDERWRITING'),
('perm-uw-decline',      'UW_DECLINE',          'Decline underwriting cases',     'UNDERWRITING'),
('perm-uw-refer',        'UW_REFER',            'Refer case to L2',               'UNDERWRITING'),
('perm-uw-req-info',     'UW_REQUEST_INFO',     'Request more info from customer','UNDERWRITING'),
('perm-uw-escalate',     'UW_ESCALATE_RESOLVE', 'Resolve escalated cases',        'UNDERWRITING'),

-- CLAIMS domain
('perm-clm-submit',      'CLAIM_SUBMIT',        'Submit a claim',                 'CLAIMS'),
('perm-clm-track',       'CLAIM_TRACK',         'Track own claim status',         'CLAIMS'),
('perm-clm-view-all',    'CLAIM_VIEW_ALL',      'View all claims',                'CLAIMS'),
('perm-clm-decide',      'CLAIM_DECIDE',        'Approve / decline claims',       'CLAIMS'),
('perm-clm-assign-field','CLAIM_ASSIGN_FIELD',  'Assign field investigation',     'CLAIMS'),

-- FIELD domain
('perm-fld-view-own',    'FIELD_VIEW_OWN',      'View own field assignments',     'FIELD'),
('perm-fld-submit',      'FIELD_REPORT_SUBMIT', 'Submit field investigation report','FIELD'),
('perm-fld-assign',      'FIELD_ASSIGN',        'Assign field officers',          'FIELD'),

-- FINANCE domain
('perm-fin-view',        'FINANCE_VIEW',        'View finance dashboards',        'FINANCE'),
('perm-fin-pay',         'PAYMENT_PROCESS',     'Process claim payments',         'FINANCE'),

-- DOCUMENT domain
('perm-doc-view',        'DOCUMENT_VIEW',       'View generated documents',       'DOCUMENT'),
('perm-doc-download',    'DOCUMENT_DOWNLOAD',   'Download generated documents',   'DOCUMENT'),

-- ADMIN — Products & Plans
('perm-plan-read',       'PLAN_READ',           'View plan configurations',       'ADMIN'),
('perm-plan-write',      'PLAN_WRITE',          'Create / modify plans',          'ADMIN'),
('perm-plan-publish',    'PLAN_PUBLISH',        'Publish plan configurations',    'ADMIN'),
('perm-addon-read',      'ADDON_READ',          'View add-on configurations',     'ADMIN'),
('perm-addon-write',     'ADDON_WRITE',         'Create / modify add-ons',        'ADMIN'),

-- ADMIN — Rules
('perm-rule-read',       'RULE_READ',           'View rule configurations',       'ADMIN'),
('perm-rule-write',      'RULE_WRITE',          'Create / modify rules',          'ADMIN'),
('perm-rule-publish',    'RULE_PUBLISH',        'Publish rules to production',    'ADMIN'),

-- ADMIN — Users & RBAC
('perm-user-read',       'USER_READ',           'View user accounts',             'ADMIN'),
('perm-user-write',      'USER_WRITE',          'Create / modify user accounts',  'ADMIN'),
('perm-user-deactivate', 'USER_DEACTIVATE',     'Deactivate user accounts',       'ADMIN'),
('perm-rbac-manage',     'RBAC_MANAGE',         'Manage role-permission matrix',  'ADMIN'),

-- REPORTING
('perm-report-view',     'REPORT_VIEW',         'View reports and dashboards',    'REPORTING'),
('perm-audit-view',      'AUDIT_VIEW',          'View audit logs',                'REPORTING'),

-- NOTIFICATIONS
('perm-notif-view',      'NOTIFICATION_VIEW_OWN','View own notifications',        'NOTIFICATIONS'),

-- RELATIONSHIP MANAGER
('perm-rm-manage',       'RM_MANAGE_CLIENTS',    'Manage own client portfolio',   'RM');

-- =============================================================================
-- Role-Permission Mappings
-- =============================================================================

-- ROLE_CUSTOMER
INSERT INTO role_permissions (id, role_id, permission_id, granted_by) VALUES
(UUID(), 'role-customer', 'perm-pol-read',     'system'),
(UUID(), 'role-customer', 'perm-pol-cancel',   'system'),
(UUID(), 'role-customer', 'perm-pol-renew',    'system'),
(UUID(), 'role-customer', 'perm-quote-create', 'system'),
(UUID(), 'role-customer', 'perm-quote-view',   'system'),
(UUID(), 'role-customer', 'perm-clm-submit',   'system'),
(UUID(), 'role-customer', 'perm-clm-track',    'system'),
(UUID(), 'role-customer', 'perm-doc-view',     'system'),
(UUID(), 'role-customer', 'perm-doc-download', 'system'),
(UUID(), 'role-customer', 'perm-notif-view',   'system');

-- ROLE_AGENT
INSERT INTO role_permissions (id, role_id, permission_id, granted_by) VALUES
(UUID(), 'role-agent', 'perm-pol-read',       'system'),
(UUID(), 'role-agent', 'perm-pol-view-all',   'system'),
(UUID(), 'role-agent', 'perm-pol-write',      'system'),
(UUID(), 'role-agent', 'perm-pol-cancel',     'system'),
(UUID(), 'role-agent', 'perm-pol-renew',      'system'),
(UUID(), 'role-agent', 'perm-quote-create',   'system'),
(UUID(), 'role-agent', 'perm-quote-view',     'system'),
(UUID(), 'role-agent', 'perm-doc-view',       'system'),
(UUID(), 'role-agent', 'perm-doc-download',   'system'),
(UUID(), 'role-agent', 'perm-notif-view',     'system');

-- ROLE_UNDERWRITER_L1
INSERT INTO role_permissions (id, role_id, permission_id, granted_by) VALUES
(UUID(), 'role-uw-l1', 'perm-uw-view',       'system'),
(UUID(), 'role-uw-l1', 'perm-uw-approve',    'system'),
(UUID(), 'role-uw-l1', 'perm-uw-decline',    'system'),
(UUID(), 'role-uw-l1', 'perm-uw-refer',      'system'),
(UUID(), 'role-uw-l1', 'perm-uw-req-info',   'system'),
(UUID(), 'role-uw-l1', 'perm-pol-view-all',  'system'),
(UUID(), 'role-uw-l1', 'perm-doc-view',      'system'),
(UUID(), 'role-uw-l1', 'perm-doc-download',  'system'),
(UUID(), 'role-uw-l1', 'perm-notif-view',    'system');

-- ROLE_UNDERWRITER_L2
INSERT INTO role_permissions (id, role_id, permission_id, granted_by) VALUES
(UUID(), 'role-uw-l2', 'perm-uw-view',       'system'),
(UUID(), 'role-uw-l2', 'perm-uw-approve',    'system'),
(UUID(), 'role-uw-l2', 'perm-uw-decline',    'system'),
(UUID(), 'role-uw-l2', 'perm-uw-escalate',   'system'),
(UUID(), 'role-uw-l2', 'perm-pol-view-all',  'system'),
(UUID(), 'role-uw-l2', 'perm-doc-view',      'system'),
(UUID(), 'role-uw-l2', 'perm-doc-download',  'system'),
(UUID(), 'role-uw-l2', 'perm-notif-view',    'system');

-- ROLE_CLAIMS_OFFICER
INSERT INTO role_permissions (id, role_id, permission_id, granted_by) VALUES
(UUID(), 'role-claims-officer', 'perm-clm-view-all',    'system'),
(UUID(), 'role-claims-officer', 'perm-clm-decide',      'system'),
(UUID(), 'role-claims-officer', 'perm-clm-assign-field','system'),
(UUID(), 'role-claims-officer', 'perm-pol-view-all',    'system'),
(UUID(), 'role-claims-officer', 'perm-fld-assign',      'system'),
(UUID(), 'role-claims-officer', 'perm-doc-view',        'system'),
(UUID(), 'role-claims-officer', 'perm-doc-download',    'system'),
(UUID(), 'role-claims-officer', 'perm-notif-view',      'system');

-- ROLE_FIELD_OFFICER
INSERT INTO role_permissions (id, role_id, permission_id, granted_by) VALUES
(UUID(), 'role-field-officer', 'perm-fld-view-own',  'system'),
(UUID(), 'role-field-officer', 'perm-fld-submit',    'system'),
(UUID(), 'role-field-officer', 'perm-doc-view',      'system'),
(UUID(), 'role-field-officer', 'perm-notif-view',    'system');

-- ROLE_FINANCE
INSERT INTO role_permissions (id, role_id, permission_id, granted_by) VALUES
(UUID(), 'role-finance', 'perm-fin-view',       'system'),
(UUID(), 'role-finance', 'perm-fin-pay',        'system'),
(UUID(), 'role-finance', 'perm-clm-view-all',   'system'),
(UUID(), 'role-finance', 'perm-pol-view-all',   'system'),
(UUID(), 'role-finance', 'perm-report-view',    'system'),
(UUID(), 'role-finance', 'perm-doc-view',       'system'),
(UUID(), 'role-finance', 'perm-doc-download',   'system'),
(UUID(), 'role-finance', 'perm-notif-view',     'system');

-- ROLE_ADMIN
INSERT INTO role_permissions (id, role_id, permission_id, granted_by) VALUES
(UUID(), 'role-admin', 'perm-pol-view-all',    'system'),
(UUID(), 'role-admin', 'perm-pol-write',       'system'),
(UUID(), 'role-admin', 'perm-plan-read',       'system'),
(UUID(), 'role-admin', 'perm-plan-write',      'system'),
(UUID(), 'role-admin', 'perm-plan-publish',    'system'),
(UUID(), 'role-admin', 'perm-addon-read',      'system'),
(UUID(), 'role-admin', 'perm-addon-write',     'system'),
(UUID(), 'role-admin', 'perm-rule-read',       'system'),
(UUID(), 'role-admin', 'perm-rule-write',      'system'),
(UUID(), 'role-admin', 'perm-rule-publish',    'system'),
(UUID(), 'role-admin', 'perm-user-read',       'system'),
(UUID(), 'role-admin', 'perm-user-write',      'system'),
(UUID(), 'role-admin', 'perm-user-deactivate', 'system'),
(UUID(), 'role-admin', 'perm-rbac-manage',     'system'),
(UUID(), 'role-admin', 'perm-clm-view-all',    'system'),
(UUID(), 'role-admin', 'perm-fld-assign',      'system'),
(UUID(), 'role-admin', 'perm-fin-view',        'system'),
(UUID(), 'role-admin', 'perm-report-view',     'system'),
(UUID(), 'role-admin', 'perm-audit-view',      'system'),
(UUID(), 'role-admin', 'perm-doc-view',        'system'),
(UUID(), 'role-admin', 'perm-doc-download',    'system'),
(UUID(), 'role-admin', 'perm-notif-view',      'system'),
(UUID(), 'role-admin', 'perm-uw-view',         'system');

-- ROLE_RELATIONSHIP_MANAGER
INSERT INTO role_permissions (id, role_id, permission_id, granted_by) VALUES
(UUID(), 'role-rm', 'perm-rm-manage',      'system'),
(UUID(), 'role-rm', 'perm-pol-read',       'system'),
(UUID(), 'role-rm', 'perm-pol-view-all',   'system'),
(UUID(), 'role-rm', 'perm-pol-write',      'system'),
(UUID(), 'role-rm', 'perm-pol-renew',      'system'),
(UUID(), 'role-rm', 'perm-quote-create',   'system'),
(UUID(), 'role-rm', 'perm-quote-view',     'system'),
(UUID(), 'role-rm', 'perm-clm-view-all',   'system'),
(UUID(), 'role-rm', 'perm-clm-track',      'system'),
(UUID(), 'role-rm', 'perm-report-view',    'system'),
(UUID(), 'role-rm', 'perm-doc-view',       'system'),
(UUID(), 'role-rm', 'perm-doc-download',   'system'),
(UUID(), 'role-rm', 'perm-notif-view',     'system');
