-- =============================================================================
-- V22__seed_rules.sql
-- Schema: ins_rule, ins_workflow
-- Description: Seed default rule definitions matching the DEFAULT_RULES array
--              in webapp/portals/underwriter/app.js.
--              Also seeds risk routing bands, coverage multipliers, pricing,
--              SLA, and security config into ins_workflow.platform_configurations.
--
-- New schema (V04__rule_engine_schema.sql — 2 tables):
--   + rule_definitions  — actions_config JSONB absorbs old rule_actions table
--   + rule_conditions   — group_number + group_operator absorbs old rule_condition_groups
--
-- Rule types: RISK_SCORING | PREMIUM_LOADING | DISCOUNT | ELIGIBILITY |
--             ROUTING | CLAIMS_AUTO_DECISION
-- =============================================================================

SET search_path = ins_rule, public;

-- =============================================================================
-- Rule Definitions  (actions_config JSONB — no separate rule_actions table)
-- =============================================================================
INSERT INTO ins_rule.rule_definitions
    (id, rule_code, rule_name, rule_type, description, priority,
     status, is_active, stop_on_match, logical_operator, actions_config,
     version, effective_from, effective_to)
VALUES

-- 1. Senior Traveler Risk Uplift
('d1e2f3a4-0001-0000-0000-000000000001',
 'RULE_RISK_SENIOR_TRAVELER',
 'Senior Traveler Risk Uplift',
 'RISK_SCORING',
 'Adds 25 risk score points when any traveler is in the senior (61+) age group.',
 10, 'PUBLISHED', TRUE, FALSE, 'AND',
 '[{"action_type":"ADD_SCORE","value":"25","description":"Senior traveler (61+) risk uplift"}]',
 1, CURRENT_DATE, NULL),

-- 2. High-Risk Destination Loading
('d1e2f3a4-0002-0000-0000-000000000002',
 'RULE_RISK_HIGH_DEST',
 'High-Risk Destination Loading',
 'RISK_SCORING',
 'Adds 20 risk score points for USA/Canada, Australia/NZ, or Worldwide destinations.',
 20, 'PUBLISHED', TRUE, FALSE, 'OR',
 '[{"action_type":"ADD_SCORE","value":"20","description":"High-cost destination loading"}]',
 1, CURRENT_DATE, NULL),

-- 3. Long-Trip Duration Risk (>30 days)
('d1e2f3a4-0003-0000-0000-000000000003',
 'RULE_RISK_LONG_TRIP',
 'Long-Trip Duration Risk',
 'RISK_SCORING',
 'Adds 15 points for trips exceeding 30 days; adds 7 points for trips 15–30 days.',
 30, 'PUBLISHED', TRUE, FALSE, 'OR',
 '[{"action_type":"ADD_SCORE","value":"15","description":"Trip > 30 days"},{"action_type":"ADD_SCORE","value":"7","description":"Trip 15-30 days"}]',
 1, CURRENT_DATE, NULL),

-- 4. Adventure Sports Premium Loading
('d1e2f3a4-0004-0000-0000-000000000004',
 'RULE_LOAD_ADVENTURE',
 'Adventure Sports Premium Loading',
 'PREMIUM_LOADING',
 'Applies +10 risk score points when adventure/sports add-on is selected.',
 40, 'PUBLISHED', TRUE, FALSE, 'AND',
 '[{"action_type":"ADD_SCORE","value":"10","description":"Adventure sports add-on selected"}]',
 1, CURRENT_DATE, NULL),

-- 5. Medical Tourism Risk Uplift
('d1e2f3a4-0005-0000-0000-000000000005',
 'RULE_RISK_MEDICAL_TOURISM',
 'Medical Tourism Risk Uplift',
 'RISK_SCORING',
 'Adds 15 risk score points when trip purpose is Medical Tourism.',
 50, 'PUBLISHED', TRUE, FALSE, 'AND',
 '[{"action_type":"ADD_SCORE","value":"15","description":"Medical tourism trip purpose"}]',
 1, CURRENT_DATE, NULL),

-- 6. Auto-Approve Low-Risk Claims
('d1e2f3a4-0006-0000-0000-000000000006',
 'RULE_AUTO_APPROVE_LOW_CLAIM',
 'Auto-Approve Low-Risk Claims',
 'CLAIMS_AUTO_DECISION',
 'Automatically approves claims where claimed amount ≤ ₹5,000 and type is Flight Delay or Baggage.',
 60, 'PUBLISHED', TRUE, FALSE, 'AND',
 '[{"action_type":"SET_STATUS","value":"AUTO_APPROVED","description":"Auto-approve low-value, low-risk claims"}]',
 1, CURRENT_DATE, NULL),

-- 7. Very High Risk Eligibility Gate
('d1e2f3a4-0007-0000-0000-000000000007',
 'RULE_ELIG_VHR_GATE',
 'Very High Risk Eligibility Gate',
 'ELIGIBILITY',
 'Flags policies with risk score ≥ 71 as very high risk; recommends field investigation before underwriter approval.',
 70, 'PUBLISHED', TRUE, TRUE, 'AND',
 '[{"action_type":"SET_FLAG","value":"FIELD_FORWARD_RECOMMENDED","description":"Very high risk — field investigation recommended"}]',
 1, CURRENT_DATE, NULL)

ON CONFLICT (rule_code, version) DO NOTHING;

-- =============================================================================
-- Rule Conditions
-- group_number + group_operator absorbs old rule_condition_groups table.
-- Operators: EQ|NEQ|GT|GTE|LT|LTE|IN|NOT_IN|BETWEEN|IS_NULL|IS_NOT_NULL|CONTAINS
-- =============================================================================
INSERT INTO ins_rule.rule_conditions
    (id, rule_id, group_number, group_operator, field_name, operator,
     field_value, field_value2, value_list, sort_order)
VALUES

-- Rule 1: any traveler age_group = senior (group 1, AND)
('d1e2f3a4-2001-0000-0000-000000002001',
 'd1e2f3a4-0001-0000-0000-000000000001',
 1, 'AND', 'traveler.age_group', 'CONTAINS',
 'senior', NULL, NULL, 1),

-- Rule 2: destination zone IN high-risk zones (group 1, OR)
('d1e2f3a4-2002-0000-0000-000000002002',
 'd1e2f3a4-0002-0000-0000-000000000002',
 1, 'OR', 'destination.zone_code', 'IN',
 NULL, NULL, 'ZONE_USA_CANADA,ZONE_AUS_NZ,ZONE_WORLDWIDE', 1),

-- Rule 3a: tripDays > 30 (group 1, OR)
('d1e2f3a4-2003-0000-0000-000000002003',
 'd1e2f3a4-0003-0000-0000-000000000003',
 1, 'OR', 'trip.duration_days', 'GT',
 '30', NULL, NULL, 1),
-- Rule 3b: tripDays BETWEEN 15 AND 30 (group 1, OR)
('d1e2f3a4-2004-0000-0000-000000002004',
 'd1e2f3a4-0003-0000-0000-000000000003',
 1, 'OR', 'trip.duration_days', 'BETWEEN',
 '15', '30', NULL, 2),

-- Rule 4: adventure sports add-on selected (group 1, AND)
('d1e2f3a4-2005-0000-0000-000000002005',
 'd1e2f3a4-0004-0000-0000-000000000004',
 1, 'AND', 'quote.selected_addons', 'CONTAINS',
 'ADVENTURE_SPORTS', NULL, NULL, 1),

-- Rule 5: trip purpose = Medical Tourism (group 1, AND)
('d1e2f3a4-2006-0000-0000-000000002006',
 'd1e2f3a4-0005-0000-0000-000000000005',
 1, 'AND', 'trip.purpose', 'EQ',
 'Medical Tourism', NULL, NULL, 1),

-- Rule 6a: claim amount <= 5000 (group 1, AND)
('d1e2f3a4-2007-0000-0000-000000002007',
 'd1e2f3a4-0006-0000-0000-000000000006',
 1, 'AND', 'claim.amount', 'LTE',
 '5000', NULL, NULL, 1),
-- Rule 6b: claim type IN (FLIGHT_DELAY, BAGGAGE_LOSS) (group 1, AND)
('d1e2f3a4-2008-0000-0000-000000002008',
 'd1e2f3a4-0006-0000-0000-000000000006',
 1, 'AND', 'claim.type_code', 'IN',
 NULL, NULL, 'FLIGHT_DELAY,BAGGAGE_LOSS', 2),

-- Rule 7: risk score >= 71 (group 1, AND)
('d1e2f3a4-2009-0000-0000-000000002009',
 'd1e2f3a4-0007-0000-0000-000000000007',
 1, 'AND', 'quote.risk_score', 'GTE',
 '71', NULL, NULL, 1)

ON CONFLICT DO NOTHING;

-- =============================================================================
-- Platform Configurations  (ins_workflow schema)
-- Consolidates: risk routing bands, coverage multipliers, pricing, SLA, security.
-- Replaces removed tables: risk_routing_config, coverage_limit_risk_multipliers.
-- =============================================================================
SET search_path = ins_workflow, public;

INSERT INTO ins_workflow.platform_configurations
    (id, config_key, config_value, value_type, description, group_name, is_active)
VALUES

-- ── RISK_ROUTING ─────────────────────────────────────────────────────────────
-- 3-band system matching webapp processPayment() routing logic
('e1f2a3b4-0001-0000-0000-000000000001',
 'risk_routing.auto_issue_max_score', '30', 'NUMBER',
 'Score ≤ this value: policy auto-issued (ACTIVE) immediately after payment',
 'RISK_ROUTING', TRUE),

('e1f2a3b4-0002-0000-0000-000000000002',
 'risk_routing.co_review_max_score', '50', 'NUMBER',
 'Score ≤ this and > auto_issue_max: Claims Officer review (Pending Review)',
 'RISK_ROUTING', TRUE),

('e1f2a3b4-0003-0000-0000-000000000003',
 'risk_routing.bands',
 '[{"band":"AUTO_ISSUE","min":0,"max":30,"target_status":"ACTIVE","notify_roles":["ROLE_CUSTOMER","ROLE_FINANCE","ROLE_AGENT","ROLE_RELATIONSHIP_MANAGER"],"description":"Low risk — policy auto-issued after payment"},{"band":"CO_REVIEW","min":31,"max":50,"target_status":"PENDING_REVIEW","notify_roles":["ROLE_CLAIMS_OFFICER","ROLE_CUSTOMER"],"description":"Medium risk — Claims Officer review within 1 business day"},{"band":"UW_REVIEW","min":51,"max":999,"target_status":"PENDING_UW","notify_roles":["ROLE_UNDERWRITER","ROLE_CUSTOMER"],"description":"High risk — Underwriter review within 2-3 business days"}]',
 'JSON',
 'Risk routing band definitions: score thresholds, target policy status, notify roles',
 'RISK_ROUTING', TRUE),

-- ── RISK_MULTIPLIER ───────────────────────────────────────────────────────────
('e1f2a3b4-1001-0000-0000-000000001001',
 'risk_multiplier.low', '1.50', 'NUMBER',
 'Score 0-30: coverage limit slider max = plan base limit × 1.5',
 'RISK_MULTIPLIER', TRUE),

('e1f2a3b4-1002-0000-0000-000000001002',
 'risk_multiplier.medium', '1.25', 'NUMBER',
 'Score 31-50: coverage limit slider max = plan base limit × 1.25',
 'RISK_MULTIPLIER', TRUE),

('e1f2a3b4-1003-0000-0000-000000001003',
 'risk_multiplier.high', '1.10', 'NUMBER',
 'Score 51+: coverage limit slider max = plan base limit × 1.1',
 'RISK_MULTIPLIER', TRUE),

-- ── PRICING ───────────────────────────────────────────────────────────────────
('e1f2a3b4-2001-0000-0000-000000002001',
 'pricing.gst_rate', '0.18', 'NUMBER',
 'GST rate applied to all premiums (18%)',
 'PRICING', TRUE),

('e1f2a3b4-2002-0000-0000-000000002002',
 'pricing.online_discount_rate', '0.05', 'NUMBER',
 'Online purchase discount applied to subtotal before GST (5%)',
 'PRICING', TRUE),

('e1f2a3b4-2003-0000-0000-000000002003',
 'pricing.traveler_mult_base', '1.00', 'NUMBER',
 'Premium multiplier for the first traveler',
 'PRICING', TRUE),

('e1f2a3b4-2004-0000-0000-000000002004',
 'pricing.traveler_mult_2to4_step', '0.60', 'NUMBER',
 'Each additional traveler (positions 2–4): add 0.6 to the running multiplier',
 'PRICING', TRUE),

('e1f2a3b4-2005-0000-0000-000000002005',
 'pricing.traveler_mult_5plus_step', '0.40', 'NUMBER',
 'Each additional traveler (position 5+): add 0.4 to the running multiplier',
 'PRICING', TRUE),

('e1f2a3b4-2006-0000-0000-000000002006',
 'commission.rate_basic', '0.10', 'NUMBER',
 'Agent commission rate for BASIC plan (10%)',
 'PRICING', TRUE),

('e1f2a3b4-2007-0000-0000-000000002007',
 'commission.rate_plus', '0.12', 'NUMBER',
 'Agent commission rate for PLUS plan (12%)',
 'PRICING', TRUE),

('e1f2a3b4-2008-0000-0000-000000002008',
 'commission.rate_pro', '0.15', 'NUMBER',
 'Agent commission rate for PRO plan (15%)',
 'PRICING', TRUE),

-- ── SLA ───────────────────────────────────────────────────────────────────────
('e1f2a3b4-2009-0000-0000-000000002009',
 'sla.uw_review_hours', '48', 'NUMBER',
 'SLA hours for underwriter review and decision on queued policies',
 'SLA', TRUE),

('e1f2a3b4-2010-0000-0000-000000002010',
 'sla.claims_default_hours', '48', 'NUMBER',
 'Default SLA hours for claims processing (overridden per priority in SLA group)',
 'SLA', TRUE),

-- ── CLAIMS ────────────────────────────────────────────────────────────────────
('e1f2a3b4-2011-0000-0000-000000002011',
 'claims.high_value_threshold', '100000', 'NUMBER',
 'Claims above ₹1L are flagged as high-value and routed for enhanced review',
 'CLAIMS', TRUE),

('e1f2a3b4-2012-0000-0000-000000002012',
 'claims.auto_approve_max_amount', '5000', 'NUMBER',
 'Claims ≤ ₹5,000 of type FLIGHT_DELAY or BAGGAGE_LOSS may be auto-approved',
 'CLAIMS', TRUE),

-- ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
('e1f2a3b4-2013-0000-0000-000000002013',
 'notifications.max_per_role', '50', 'NUMBER',
 'Maximum in-app notifications retained per role in the webapp notification drawer',
 'NOTIFICATIONS', TRUE),

-- ── SECURITY ─────────────────────────────────────────────────────────────────
('e1f2a3b4-2014-0000-0000-000000002014',
 'security.max_login_attempts', '5', 'NUMBER',
 'Maximum consecutive failed login attempts before account is temporarily locked',
 'SECURITY', TRUE),

('e1f2a3b4-2015-0000-0000-000000002015',
 'security.session_ttl_minutes', '480', 'NUMBER',
 'JWT session TTL in minutes (8 hours); customer sessions extend on activity',
 'SECURITY', TRUE),

('e1f2a3b4-2016-0000-0000-000000002016',
 'security.password_min_length', '8', 'NUMBER',
 'Minimum password length enforced at registration and password change',
 'SECURITY', TRUE)

ON CONFLICT (config_key) DO NOTHING;
