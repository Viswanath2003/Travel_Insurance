-- =============================================================================
-- V04__rule_engine_schema.sql
-- Schema: ins_rule
-- Service: rule-engine-service
-- Description: DB-driven rule engine for risk scoring, premium loading,
--              discounts, eligibility, routing, and claims auto-decision.
--              No Drools, no Camunda — all rules are underwriter-configurable.
--
-- DESIGN (25-table target — 2 tables here):
--   + rule_definitions  — core rule: type, priority, status, actions_config JSONB
--                         (absorbs rule_actions table; actions are non-queryable config)
--   + rule_conditions   — individual conditions with group_number for AND/OR grouping
--                         (absorbs rule_condition_groups; group is just a number column)
--
-- Removed vs previous schema:
--   - rule_condition_groups → group_number + group_operator columns in rule_conditions
--   - rule_actions          → actions_config JSONB column in rule_definitions
--   - rule_versions         → version snapshot in policy_snapshots (V05)
--   - rule_execution_logs   → moved to audit_logs (V11) under action='RULE_EVALUATED'
--   - risk_routing_config   → moved to platform_configurations (V12)
--
-- Underwriter manages all rules (replaces admin rule management).
-- =============================================================================

SET search_path = ins_rule, public;

-- =============================================================================
-- rule_definitions
-- Master rule registry. Each rule has a type, priority, lifecycle, and
-- a JSONB actions_config that defines what happens on a match.
--
-- actions_config schema:
--   [{ "action_type": "ADD_SCORE", "value": "10", "description": "Age >70 risk" },
--    { "action_type": "SET_RISK_LEVEL", "value": "HIGH" }]
--
-- logical_operator: how condition groups within this rule combine (AND | OR).
-- stop_on_match: if TRUE, engine stops evaluating further rules of same type.
-- effective_from / effective_to: date-bounded rule validity.
-- =============================================================================
CREATE TABLE ins_rule.rule_definitions (
    id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
    rule_code           VARCHAR(100)    NOT NULL,
    rule_name           VARCHAR(200)    NOT NULL,
    rule_type           VARCHAR(30)     NOT NULL,
                        -- RISK_SCORING | PREMIUM_LOADING | DISCOUNT | ELIGIBILITY
                        -- ROUTING | CLAIMS_AUTO_DECISION
    description         TEXT            NULL,
    priority            INT             NOT NULL DEFAULT 100,
                        -- Lower number = evaluated first
    status              VARCHAR(20)     NOT NULL DEFAULT 'DRAFT',
                        -- DRAFT | PUBLISHED | SUPERSEDED | INACTIVE
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    stop_on_match       BOOLEAN         NOT NULL DEFAULT FALSE,
    logical_operator    VARCHAR(5)      NOT NULL DEFAULT 'AND',
                        -- AND | OR — how condition groups combine at rule level
    actions_config      JSONB           NOT NULL DEFAULT '[]',
                        -- Array of actions: [{action_type, value, description}]
    version             INT             NOT NULL DEFAULT 1,
    published_at        TIMESTAMPTZ     NULL,
    published_by        UUID            NULL,
    effective_from      DATE            NULL,
    effective_to        DATE            NULL,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_by          UUID            NULL,

    CONSTRAINT pk_rule_definitions PRIMARY KEY (id),
    CONSTRAINT uq_rule_code_version UNIQUE (rule_code, version),
    CONSTRAINT chk_rule_type CHECK (rule_type IN (
        'RISK_SCORING','PREMIUM_LOADING','DISCOUNT','ELIGIBILITY',
        'ROUTING','CLAIMS_AUTO_DECISION'
    )),
    CONSTRAINT chk_rule_status CHECK (status IN ('DRAFT','PUBLISHED','SUPERSEDED','INACTIVE')),
    CONSTRAINT chk_rule_logical_op CHECK (logical_operator IN ('AND','OR'))
);

-- Partial index: runtime queries only hit PUBLISHED + active rules
CREATE INDEX idx_rd_active_published ON ins_rule.rule_definitions (rule_type, priority)
    WHERE status = 'PUBLISHED' AND is_active = TRUE;
CREATE INDEX idx_rd_type_status ON ins_rule.rule_definitions (rule_type, status);

CREATE TRIGGER trg_rule_definitions_updated_at
    BEFORE UPDATE ON ins_rule.rule_definitions
    FOR EACH ROW EXECUTE FUNCTION ins_common.set_updated_at();

-- =============================================================================
-- rule_conditions
-- Individual conditions that belong to a rule.
-- group_number groups conditions within a rule for nested AND/OR logic:
--   group_operator (AND|OR) applies within a group.
--   The rule's logical_operator combines groups.
--
-- field_name uses dot-notation for context traversal:
--   traveler.age | traveler.has_preexisting_condition
--   destination.risk_tier | trip.duration_days
--   policy.risk_level | claim.amount
-- =============================================================================
CREATE TABLE ins_rule.rule_conditions (
    id              UUID            NOT NULL DEFAULT gen_random_uuid(),
    rule_id         UUID            NOT NULL,
    group_number    INT             NOT NULL DEFAULT 1,
                    -- Conditions with same group_number belong to one condition group
    group_operator  VARCHAR(5)      NOT NULL DEFAULT 'AND',
                    -- AND | OR — how conditions within this group combine
    field_name      VARCHAR(200)    NOT NULL,
    operator        VARCHAR(15)     NOT NULL,
                    -- EQ | NEQ | GT | GTE | LT | LTE | IN | NOT_IN
                    -- BETWEEN | IS_NULL | IS_NOT_NULL | CONTAINS
    field_value     VARCHAR(500)    NULL,
    field_value2    VARCHAR(500)    NULL,
                    -- Upper bound for BETWEEN operator
    value_list      TEXT            NULL,
                    -- Comma-separated list for IN / NOT_IN
    sort_order      INT             NOT NULL DEFAULT 0,

    CONSTRAINT pk_rule_conditions PRIMARY KEY (id),
    CONSTRAINT fk_rc_rule FOREIGN KEY (rule_id)
        REFERENCES ins_rule.rule_definitions (id) ON DELETE CASCADE,
    CONSTRAINT chk_rc_operator CHECK (operator IN (
        'EQ','NEQ','GT','GTE','LT','LTE','IN','NOT_IN',
        'BETWEEN','IS_NULL','IS_NOT_NULL','CONTAINS'
    )),
    CONSTRAINT chk_rc_group_operator CHECK (group_operator IN ('AND','OR'))
);

CREATE INDEX idx_rc_rule_id ON ins_rule.rule_conditions (rule_id, group_number, sort_order);
