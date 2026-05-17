-- =============================================================================
-- V11__workflow_tables.sql
-- Schema: ins_workflow
-- Service: shared infrastructure (used by underwriting-service, claims-service)
-- Description: DB-driven workflow state machine definitions.
--              Workflow types, states, and valid transitions stored in DB.
--              No external BPM engine (no Camunda, no Activiti).
-- =============================================================================

USE ins_workflow;

-- =============================================================================
-- workflow_definitions
-- Registry of workflow types. Each type corresponds to a business process.
-- =============================================================================
CREATE TABLE workflow_definitions (
    id              VARCHAR(36)     NOT NULL,
    workflow_type   VARCHAR(50)     NOT NULL,
                                    -- UNDERWRITING | CLAIMS | CANCELLATION | ENDORSEMENT
    workflow_name   VARCHAR(150)    NOT NULL,
    entity_type     VARCHAR(20)     NOT NULL,
                                    -- POLICY | CLAIM
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    version         INT             NOT NULL DEFAULT 1,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_workflow_definitions PRIMARY KEY (id),
    CONSTRAINT uq_wf_type UNIQUE (workflow_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- workflow_states
-- All valid states for each workflow type.
-- is_initial: only one state per workflow should have is_initial=true
-- is_terminal: states from which no transitions are allowed
-- sla_hours: 0 = no SLA enforced for this state
-- allowed_roles: comma-separated roles that can perform actions in this state
-- =============================================================================
CREATE TABLE workflow_states (
    id              VARCHAR(36)     NOT NULL,
    workflow_id     VARCHAR(36)     NOT NULL,
    state_code      VARCHAR(50)     NOT NULL,
    state_name      VARCHAR(100)    NOT NULL,
    is_initial      TINYINT(1)      NOT NULL DEFAULT 0,
    is_terminal     TINYINT(1)      NOT NULL DEFAULT 0,
    sla_hours       INT             NOT NULL DEFAULT 0,
    allowed_roles   VARCHAR(500)    NULL,
    description     TEXT            NULL,
    sort_order      INT             NOT NULL DEFAULT 0,

    CONSTRAINT pk_workflow_states PRIMARY KEY (id),
    CONSTRAINT uq_ws_code UNIQUE (workflow_id, state_code),
    CONSTRAINT fk_ws_workflow FOREIGN KEY (workflow_id) REFERENCES workflow_definitions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_ws_workflow_id ON workflow_states (workflow_id);

-- =============================================================================
-- workflow_transitions
-- Valid state-to-state transitions. The workflow engine validates that
-- a transition is in this table before allowing a state change.
-- trigger_event: the event code that fires this transition
-- required_role: NULL = any authenticated role; set = must have specific role
-- is_auto_transition: true = system fires this without user action
-- condition_expression: optional Spring SpEL for conditional transitions
--   e.g., "#claim.amount < 5000 && #claim.type == 'MEDICAL_EXPENSES'"
-- =============================================================================
CREATE TABLE workflow_transitions (
    id                      VARCHAR(36)     NOT NULL,
    workflow_id             VARCHAR(36)     NOT NULL,
    from_state_id           VARCHAR(36)     NOT NULL,
    to_state_id             VARCHAR(36)     NOT NULL,
    trigger_event           VARCHAR(100)    NOT NULL,
    required_role           VARCHAR(100)    NULL,
    is_auto_transition      TINYINT(1)      NOT NULL DEFAULT 0,
    condition_expression    TEXT            NULL,
    description             TEXT            NULL,

    CONSTRAINT pk_workflow_transitions PRIMARY KEY (id),
    CONSTRAINT uq_wt_transition UNIQUE (workflow_id, from_state_id, trigger_event),
    CONSTRAINT fk_wt_workflow FOREIGN KEY (workflow_id) REFERENCES workflow_definitions (id),
    CONSTRAINT fk_wt_from_state FOREIGN KEY (from_state_id) REFERENCES workflow_states (id),
    CONSTRAINT fk_wt_to_state FOREIGN KEY (to_state_id) REFERENCES workflow_states (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_wt_workflow_id ON workflow_transitions (workflow_id);
CREATE INDEX idx_wt_from_state ON workflow_transitions (from_state_id);

-- =============================================================================
-- platform_configurations
-- Global key-value configuration store. Used for system-wide settings
-- that don't belong to a specific service schema.
-- Examples:
--   quote.validity.hours = 48
--   claim.high_value_threshold = 50000
--   policy.renewal.advance_notify_days = 30
--   password.history.limit = 5
--   login.max_failed_attempts = 5
-- =============================================================================
CREATE TABLE platform_configurations (
    id              VARCHAR(36)     NOT NULL,
    config_key      VARCHAR(100)    NOT NULL,
    config_value    TEXT            NOT NULL,
    config_type     VARCHAR(10)     NOT NULL DEFAULT 'STRING',
                                    -- STRING | NUMBER | BOOLEAN | JSON
    description     TEXT            NULL,
    is_sensitive    TINYINT(1)      NOT NULL DEFAULT 0,
    updated_by      VARCHAR(36)     NULL,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_platform_configurations PRIMARY KEY (id),
    CONSTRAINT uq_pc_key UNIQUE (config_key),
    CONSTRAINT chk_pc_type CHECK (config_type IN ('STRING','NUMBER','BOOLEAN','JSON'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
