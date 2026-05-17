-- =============================================================================
-- V03__rule_engine_tables.sql
-- Schema: ins_rule
-- Service: rule-engine-service
-- Description: Custom DB-driven rule engine. No Drools, no Camunda, no AI/ML.
--              All rules are Admin-configurable via UI-033 (Premium Rules)
--              and UI-034 (Risk Rules).
-- =============================================================================

USE ins_rule;

-- =============================================================================
-- rule_definitions
-- Master rule registry. Each rule has a type, priority, and version.
-- Rules go through DRAFT → PUBLISHED lifecycle with versioning.
-- logical_operator defines how condition GROUPS combine (AND/OR).
-- =============================================================================
CREATE TABLE rule_definitions (
    id                  VARCHAR(36)     NOT NULL,
    rule_code           VARCHAR(100)    NOT NULL,
    rule_name           VARCHAR(200)    NOT NULL,
    rule_type           VARCHAR(30)     NOT NULL,
                                        -- RISK | PREMIUM | DISCOUNT | ELIGIBILITY | CLAIM_AUTO_DECISION
    description         TEXT            NULL,
    priority            INT             NOT NULL DEFAULT 100,
                                        -- Lower number = evaluated first
    status              VARCHAR(20)     NOT NULL DEFAULT 'DRAFT',
                                        -- DRAFT | PUBLISHED | SUPERSEDED | INACTIVE
    version             INT             NOT NULL DEFAULT 1,
    logical_operator    VARCHAR(5)      NOT NULL DEFAULT 'AND',
                                        -- AND | OR (how condition groups combine)
    published_at        DATETIME        NULL,
    published_by        VARCHAR(36)     NULL,
    effective_from      DATE            NULL,
    effective_to        DATE            NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by          VARCHAR(36)     NULL,

    CONSTRAINT pk_rule_definitions PRIMARY KEY (id),
    CONSTRAINT uq_rule_code_version UNIQUE (rule_code, version),
    CONSTRAINT chk_rule_type CHECK (rule_type IN (
        'RISK','PREMIUM','DISCOUNT','ELIGIBILITY','CLAIM_AUTO_DECISION'
    )),
    CONSTRAINT chk_rule_status CHECK (status IN (
        'DRAFT','PUBLISHED','SUPERSEDED','INACTIVE'
    )),
    CONSTRAINT chk_rule_logical_op CHECK (logical_operator IN ('AND','OR'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_rd_type_status ON rule_definitions (rule_type, status);
CREATE INDEX idx_rd_priority ON rule_definitions (priority);

-- =============================================================================
-- rule_condition_groups
-- Groups conditions with a logical operator (AND/OR within the group).
-- A rule can have multiple groups, combined by the rule's logical_operator.
-- group_number defines evaluation order of groups.
-- =============================================================================
CREATE TABLE rule_condition_groups (
    id                  VARCHAR(36)     NOT NULL,
    rule_id             VARCHAR(36)     NOT NULL,
    group_number        INT             NOT NULL DEFAULT 1,
    logical_operator    VARCHAR(5)      NOT NULL DEFAULT 'AND',

    CONSTRAINT pk_rule_condition_groups PRIMARY KEY (id),
    CONSTRAINT fk_rcg_rule FOREIGN KEY (rule_id) REFERENCES rule_definitions (id) ON DELETE CASCADE,
    CONSTRAINT chk_rcg_logical_op CHECK (logical_operator IN ('AND','OR'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_rcg_rule_id ON rule_condition_groups (rule_id);

-- =============================================================================
-- rule_conditions
-- Individual condition within a group: field OPERATOR value.
--
-- field_name uses dot-notation to address nested context fields:
--   "traveler.age"                 — traveler's age
--   "destination.risk_tier"        — zone risk tier
--   "trip.duration_days"           — trip length
--   "policy.risk_level"            — current risk classification
--   "claim.amount"                 — claim amount
--   "traveler.has_preexisting_condition"
--
-- Operator meanings:
--   EQ / NEQ        — exact match / not match
--   GT / GTE        — greater than / greater than or equal
--   LT / LTE        — less than / less than or equal
--   IN / NOT_IN     — value_list (comma-separated)
--   BETWEEN         — field_value <= x <= field_value2
--   IS_NULL         — field is absent or null in context
--   IS_NOT_NULL     — field is present and not null
--   CONTAINS        — string contains (for list-type fields)
-- =============================================================================
CREATE TABLE rule_conditions (
    id              VARCHAR(36)     NOT NULL,
    group_id        VARCHAR(36)     NOT NULL,
    field_name      VARCHAR(200)    NOT NULL,
    operator        VARCHAR(15)     NOT NULL,
    field_value     VARCHAR(500)    NULL,
    field_value2    VARCHAR(500)    NULL,
    value_list      TEXT            NULL,
    sort_order      INT             NOT NULL DEFAULT 0,

    CONSTRAINT pk_rule_conditions PRIMARY KEY (id),
    CONSTRAINT fk_rc_group FOREIGN KEY (group_id) REFERENCES rule_condition_groups (id) ON DELETE CASCADE,
    CONSTRAINT chk_rc_operator CHECK (operator IN (
        'EQ','NEQ','GT','GTE','LT','LTE','IN','NOT_IN','BETWEEN','IS_NULL','IS_NOT_NULL','CONTAINS'
    ))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_rc_group_id ON rule_conditions (group_id);

-- =============================================================================
-- rule_actions
-- What happens when a rule matches. Multiple actions per rule are supported
-- and executed in sort_order sequence.
--
-- Action types:
--   ADD_SCORE         — adds action_value to risk score total
--   SUBTRACT_SCORE    — subtracts from risk score
--   SET_SCORE         — hard-sets the risk score
--   MULTIPLY_PREMIUM  — multiplies current premium by action_value (e.g., 1.15 = +15%)
--   ADD_FLAT_AMOUNT   — adds a flat currency amount to premium
--   ADD_PERCENT       — adds action_value % of base premium
--   SUBTRACT_PERCENT  — reduces premium by action_value %
--   SET_RISK_LEVEL    — explicitly sets risk level (LOW/MEDIUM/HIGH/VERY_HIGH)
--   ROUTE_TO_UW       — flags policy for underwriting with action_value as level (L1/L2)
--   BLOCK_ELIGIBILITY — makes traveler/policy ineligible; action_value = reason
--   AUTO_APPROVE      — claim auto-approve decision
--   AUTO_DECLINE      — claim auto-decline decision
-- =============================================================================
CREATE TABLE rule_actions (
    id                  VARCHAR(36)     NOT NULL,
    rule_id             VARCHAR(36)     NOT NULL,
    action_type         VARCHAR(30)     NOT NULL,
    action_value        VARCHAR(200)    NOT NULL,
    action_description  VARCHAR(300)    NULL,
    sort_order          INT             NOT NULL DEFAULT 0,

    CONSTRAINT pk_rule_actions PRIMARY KEY (id),
    CONSTRAINT fk_ra_rule FOREIGN KEY (rule_id) REFERENCES rule_definitions (id) ON DELETE CASCADE,
    CONSTRAINT chk_ra_action_type CHECK (action_type IN (
        'ADD_SCORE','SUBTRACT_SCORE','SET_SCORE',
        'MULTIPLY_PREMIUM','ADD_FLAT_AMOUNT','ADD_PERCENT','SUBTRACT_PERCENT',
        'SET_RISK_LEVEL','ROUTE_TO_UW','BLOCK_ELIGIBILITY',
        'AUTO_APPROVE','AUTO_DECLINE'
    ))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_ra_rule_id ON rule_actions (rule_id);

-- =============================================================================
-- rule_versions
-- Immutable snapshot of each rule at the time it was published.
-- Policy snapshots store which rule_version_id was active at quote time.
-- This enables full auditability: "which version of rule R003 priced this policy?"
-- =============================================================================
CREATE TABLE rule_versions (
    id              VARCHAR(36)     NOT NULL,
    rule_id         VARCHAR(36)     NOT NULL,
    version_number  INT             NOT NULL,
    rule_snapshot   JSON            NOT NULL,
                                    -- Complete rule definition + conditions + actions
    published_by    VARCHAR(36)     NULL,
    published_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_rule_versions PRIMARY KEY (id),
    CONSTRAINT uq_rule_version UNIQUE (rule_id, version_number),
    CONSTRAINT fk_rv_rule FOREIGN KEY (rule_id) REFERENCES rule_definitions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_rv_rule_id ON rule_versions (rule_id);

-- =============================================================================
-- rule_execution_logs
-- Records EVERY rule evaluation — both matched and unmatched.
-- This is the foundation of the explainability UI (UI-018, UI-035).
-- execution_batch_id groups all rules evaluated in a single engine call.
--
-- context_type + context_id links this log to the quote/policy/claim
-- that triggered the evaluation.
-- =============================================================================
CREATE TABLE rule_execution_logs (
    id                      BIGINT          NOT NULL AUTO_INCREMENT,
    execution_batch_id      VARCHAR(36)     NOT NULL,
    rule_id                 VARCHAR(36)     NULL,
    rule_code               VARCHAR(100)    NULL,
    rule_version            INT             NULL,
    context_type            VARCHAR(20)     NOT NULL,
                                            -- QUOTE | POLICY | CLAIM | PREVIEW
    context_id              VARCHAR(36)     NULL,
    rule_type               VARCHAR(30)     NOT NULL,
    input_context           JSON            NULL,
    condition_matched       TINYINT(1)      NOT NULL,
    action_applied          VARCHAR(200)    NULL,
    contribution_value      DECIMAL(15,4)   NULL,
    running_total           DECIMAL(15,4)   NULL,
    action_description      VARCHAR(500)    NULL,
    evaluated_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_rule_exec_logs PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_rel_batch_id ON rule_execution_logs (execution_batch_id);
CREATE INDEX idx_rel_context ON rule_execution_logs (context_type, context_id);
CREATE INDEX idx_rel_rule_id ON rule_execution_logs (rule_id);
CREATE INDEX idx_rel_evaluated_at ON rule_execution_logs (evaluated_at);
