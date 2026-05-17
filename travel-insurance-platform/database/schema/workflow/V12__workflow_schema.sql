-- =============================================================================
-- V12__workflow_schema.sql
-- Schema: ins_workflow
-- Service: workflow-service / shared infrastructure
-- Description: Single platform_configurations key-value store absorbing all
--              previously separate workflow, config, and routing tables.
--
-- DESIGN (25-table target — 1 table here):
--   + platform_configurations — unified key-value store for all platform settings.
--
-- Removed vs previous schema (absorbed into platform_configurations):
--   - workflow_definitions         → JSONB config entries (group: WORKFLOW)
--   - workflow_states              → JSONB config entries (group: WORKFLOW)
--   - workflow_transitions         → JSONB config entries (group: WORKFLOW)
--   - risk_routing_config          → JSONB config entries (group: RISK_ROUTING)
--   - coverage_limit_risk_multipliers → JSONB config entries (group: RISK_MULTIPLIER)
--   - platform_configurations (old)→ merged here as-is
--
-- Also absorbs configs from removed tables in other schemas:
--   - claim_sla_config (V07)      → JSONB config entries (group: SLA)
--   - claim_doc_checklist_config (V07) → JSONB config entries (group: CLAIMS)
--   - destination_zones (V03)     → JSONB config entries (group: ZONES)
--   - zone_countries (V03)        → JSONB config entries (group: ZONES)
--   - plan_form_config (V03)      → JSONB config entries (group: PRODUCT_FORMS)
--
-- config_value types:
--   STRING  → plain text
--   NUMBER  → numeric (parseable by service)
--   BOOLEAN → "true" | "false"
--   JSON    → complex structured config (arrays, nested objects)
--
-- Underwriter manages all config entries from the underwriter portal.
-- =============================================================================

SET search_path = ins_workflow, public;

-- =============================================================================
-- platform_configurations
-- Global configuration key-value store. All platform-wide settings live here.
-- group_name organises entries for the management UI:
--   PRICING       → GST rate (18%), online discount (5%), commission rates
--   RISK_ROUTING  → score-to-policy-status thresholds (0-30=AUTO, 31-60=REVIEW, 61+=UW)
--   RISK_MULTIPLIER → coverage limit multipliers per risk level (LOW=1.5×, etc.)
--   SLA           → claim/UW SLA hours per priority band
--   WORKFLOW      → status machine definitions (JSON arrays)
--   ZONES         → destination zone definitions and country mappings
--   PRODUCT_FORMS → per-product-type form field configurations
--   CLAIMS        → claim type definitions, doc checklist configs
--   NOTIFICATIONS → default notification templates and event mappings
--   SECURITY      → password policy, session TTL, login lockout config
--   GENERAL       → misc platform settings
-- =============================================================================
CREATE TABLE ins_workflow.platform_configurations (
    id              UUID            NOT NULL DEFAULT gen_random_uuid(),
    config_key      VARCHAR(150)    NOT NULL,
                    -- Dot-notation namespacing:
                    -- pricing.gst_rate | risk_routing.auto_issue_max_score
                    -- sla.claims.medium.resolution_hours | zones.zone_list
    config_value    TEXT            NOT NULL,
    value_type      VARCHAR(10)     NOT NULL DEFAULT 'STRING',
                    -- STRING | NUMBER | BOOLEAN | JSON
    description     VARCHAR(400)    NULL,
    group_name      VARCHAR(30)     NOT NULL DEFAULT 'GENERAL',
                    -- PRICING | RISK_ROUTING | RISK_MULTIPLIER | SLA | WORKFLOW
                    -- ZONES | PRODUCT_FORMS | CLAIMS | NOTIFICATIONS | SECURITY | GENERAL
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    updated_by      UUID            NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_platform_configurations PRIMARY KEY (id),
    CONSTRAINT uq_platform_config_key UNIQUE (config_key),
    CONSTRAINT chk_pc_value_type CHECK (value_type IN ('STRING','NUMBER','BOOLEAN','JSON')),
    CONSTRAINT chk_pc_group CHECK (group_name IN (
        'PRICING','RISK_ROUTING','RISK_MULTIPLIER','SLA','WORKFLOW',
        'ZONES','PRODUCT_FORMS','CLAIMS','NOTIFICATIONS','SECURITY','GENERAL'
    ))
);

CREATE INDEX idx_pc_group_active ON ins_workflow.platform_configurations (group_name, is_active);

CREATE TRIGGER trg_platform_config_updated_at
    BEFORE UPDATE ON ins_workflow.platform_configurations
    FOR EACH ROW EXECUTE FUNCTION ins_common.set_updated_at();
