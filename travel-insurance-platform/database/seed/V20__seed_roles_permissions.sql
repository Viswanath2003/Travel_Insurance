-- =============================================================================
-- V20__seed_roles_permissions.sql
-- Schema: ins_auth
-- Description: Seed the 7 roles and sample users (staff + customer).
--              No separate permissions/role_permissions tables in the new schema.
--              RBAC is enforced at the service layer using the role column on users.
-- =============================================================================

SET search_path = ins_auth, public;

-- =============================================================================
-- roles  (7 roles — no ADMIN, single UNDERWRITER)
-- =============================================================================
INSERT INTO ins_auth.roles (id, role_code, role_name, portal_path, description, is_active)
VALUES
  ('a1b2c3d4-0001-0000-0000-000000000001',
   'ROLE_CUSTOMER',
   'Customer',
   'portals/customer/index.html',
   'Policyholder — buy policies, submit and track claims',
   TRUE),

  ('a1b2c3d4-0002-0000-0000-000000000002',
   'ROLE_AGENT',
   'Agent / Broker',
   'portals/agent/index.html',
   'Insurance agent — quote and bind policies for customers, earn commission',
   TRUE),

  ('a1b2c3d4-0003-0000-0000-000000000003',
   'ROLE_UNDERWRITER',
   'Underwriter',
   'portals/underwriter/index.html',
   'Single-tier underwriter — review policies, manage products, rules, users and platform config (absorbs former ADMIN role)',
   TRUE),

  ('a1b2c3d4-0004-0000-0000-000000000004',
   'ROLE_CLAIMS_OFFICER',
   'Claims Officer',
   'portals/claims-officer/index.html',
   'Process, approve or reject insurance claims and assign field investigations',
   TRUE),

  ('a1b2c3d4-0005-0000-0000-000000000005',
   'ROLE_FIELD_OFFICER',
   'Field Officer',
   'portals/field-officer/index.html',
   'Conduct on-site field investigations and submit investigation reports',
   TRUE),

  ('a1b2c3d4-0006-0000-0000-000000000006',
   'ROLE_FINANCE',
   'Finance Officer',
   'portals/finance/index.html',
   'Manage premium collections, claim payouts, reconciliation and financial reports',
   TRUE),

  ('a1b2c3d4-0007-0000-0000-000000000007',
   'ROLE_RELATIONSHIP_MANAGER',
   'Relationship Manager',
   'portals/relationship-manager/index.html',
   'Manage client portfolio — onboard customers, track policies, renewals and claims',
   TRUE)

ON CONFLICT (role_code) DO UPDATE
  SET role_name    = EXCLUDED.role_name,
      portal_path  = EXCLUDED.portal_path,
      description  = EXCLUDED.description,
      is_active    = EXCLUDED.is_active,
      updated_at   = NOW();

-- =============================================================================
-- sample staff users
-- password_hash placeholder — replace with bcrypt($2a$12$...) in production.
-- Staff emails follow the pattern: firstname.lastname.<role-slug>@policypilot.com
-- =============================================================================
INSERT INTO ins_auth.users
  (id, email, full_name, password_hash, role, status)
VALUES
  -- Underwriter
  ('c1d2e3f4-1001-0000-0000-000000001001',
   'priya.sharma.underwriter@policypilot.com',
   'Priya Sharma',
   '$2a$12$PLACEHOLDER_HASH_CHANGE_ME_UW001',
   'ROLE_UNDERWRITER', 'ACTIVE'),

  -- Agent
  ('c1d2e3f4-1002-0000-0000-000000001002',
   'rahul.mehta.agent@policypilot.com',
   'Rahul Mehta',
   '$2a$12$PLACEHOLDER_HASH_CHANGE_ME_AG001',
   'ROLE_AGENT', 'ACTIVE'),

  -- Claims Officer
  ('c1d2e3f4-1003-0000-0000-000000001003',
   'sara.lee.claims@policypilot.com',
   'Sara Lee',
   '$2a$12$PLACEHOLDER_HASH_CHANGE_ME_CO001',
   'ROLE_CLAIMS_OFFICER', 'ACTIVE'),

  -- Field Officer
  ('c1d2e3f4-1004-0000-0000-000000001004',
   'ramesh.gupta.field@policypilot.com',
   'Ramesh Gupta',
   '$2a$12$PLACEHOLDER_HASH_CHANGE_ME_FO001',
   'ROLE_FIELD_OFFICER', 'ACTIVE'),

  -- Finance Officer
  ('c1d2e3f4-1005-0000-0000-000000001005',
   'ananya.nair.finance@policypilot.com',
   'Ananya Nair',
   '$2a$12$PLACEHOLDER_HASH_CHANGE_ME_FN001',
   'ROLE_FINANCE', 'ACTIVE'),

  -- Relationship Manager
  ('c1d2e3f4-1006-0000-0000-000000001006',
   'vikram.singh.rm@policypilot.com',
   'Vikram Singh',
   '$2a$12$PLACEHOLDER_HASH_CHANGE_ME_RM001',
   'ROLE_RELATIONSHIP_MANAGER', 'ACTIVE')

ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- sample customer users
-- =============================================================================
INSERT INTO ins_auth.users
  (id, email, full_name, password_hash, role, status,
   mobile, customer_type, date_of_birth, nationality, passport_number,
   address_line1, city, state_province, postal_code, country_code)
VALUES
  ('d1e2f3a4-2001-0000-0000-000000002001',
   'ravi.sharma@gmail.com',
   'Ravi Sharma',
   '$2a$12$PLACEHOLDER_HASH_CHANGE_ME_CS001',
   'ROLE_CUSTOMER', 'ACTIVE',
   '+919876543210', 'INDIVIDUAL', '1988-04-15', 'IN', 'P1234567',
   '12 Marine Drive', 'Mumbai', 'Maharashtra', '400001', 'IN'),

  ('d1e2f3a4-2002-0000-0000-000000002002',
   'anita.verma@gmail.com',
   'Anita Verma',
   '$2a$12$PLACEHOLDER_HASH_CHANGE_ME_CS002',
   'ROLE_CUSTOMER', 'ACTIVE',
   '+919812345678', 'INDIVIDUAL', '1993-11-22', 'IN', 'P2345678',
   '45 Gandhi Road', 'Bangalore', 'Karnataka', '560001', 'IN'),

  ('d1e2f3a4-2003-0000-0000-000000002003',
   'james.wilson@outlook.com',
   'James Wilson',
   '$2a$12$PLACEHOLDER_HASH_CHANGE_ME_CS003',
   'ROLE_CUSTOMER', 'ACTIVE',
   '+447777888999', 'INDIVIDUAL', '1975-07-30', 'GB', 'GBP456789',
   '10 Baker Street', 'London', 'England', 'NW1 6XE', 'GB')

ON CONFLICT (email) DO NOTHING;
