-- =============================================================================
-- V03__product_schema.sql
-- Schema: ins_product
-- Service: product-service
-- Description: Insurance product catalog — configuration-driven.
--
-- DESIGN (25-table target — 4 tables here):
--   + insurance_products  — type_code column replaces separate product_types table
--   + plans               — zone_codes TEXT[] replaces zone/zone_country/plan_zone tables;
--                           addon availability stored in addons.compatible_plan_codes
--   + plan_coverages      — coverage_code as string replaces separate coverage_types table
--   + addons              — global catalog; compatible_plan_codes TEXT[] replaces plan_addon_mappings
--
-- Removed vs previous schema (tables absorbed or moved):
--   - product_types             → type_code enum column in insurance_products
--   - plan_versions             → snapshot stored in policy_snapshots (V05)
--   - coverage_types            → coverage_code/name inline in plan_coverages
--   - coverage_limit_risk_multipliers → moved to platform_configurations (V12)
--   - plan_addon_mappings       → compatible_plan_codes TEXT[] in addons
--   - destination_zones         → zone_codes TEXT[] in plans; zone config in platform_configurations
--   - zone_countries            → zone/country config in platform_configurations
--   - plan_zone_mappings        → zone_codes TEXT[] in plans
--   - plan_form_config          → product_type form config in platform_configurations
--
-- Underwriter manages plan publish workflow (moved from admin).
-- =============================================================================

SET search_path = ins_product, public;

-- =============================================================================
-- insurance_products
-- Master product catalog. type_code discriminates product line.
-- Underwriter manages product activation from the underwriter portal.
-- =============================================================================
CREATE TABLE ins_product.insurance_products (
    id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
    product_code        VARCHAR(50)     NOT NULL,
    product_name        VARCHAR(150)    NOT NULL,
    type_code           VARCHAR(50)     NOT NULL,
                        -- SINGLE_TRIP | ANNUAL_MULTI_TRIP | STUDENT | FAMILY
                        -- CORPORATE | SENIOR_CITIZEN | GROUP
    description         TEXT            NULL,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    launch_date         DATE            NULL,
    discontinue_date    DATE            NULL,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_by          UUID            NULL,

    CONSTRAINT pk_insurance_products PRIMARY KEY (id),
    CONSTRAINT uq_product_code UNIQUE (product_code),
    CONSTRAINT chk_ip_type_code CHECK (type_code IN (
        'SINGLE_TRIP','ANNUAL_MULTI_TRIP','STUDENT','FAMILY',
        'CORPORATE','SENIOR_CITIZEN','GROUP'
    ))
);

CREATE INDEX idx_ip_active    ON ins_product.insurance_products (is_active);
CREATE INDEX idx_ip_type_code ON ins_product.insurance_products (type_code);

CREATE TRIGGER trg_insurance_products_updated_at
    BEFORE UPDATE ON ins_product.insurance_products
    FOR EACH ROW EXECUTE FUNCTION ins_common.set_updated_at();

-- =============================================================================
-- plans
-- Plan catalog. Each plan belongs to one product.
-- zone_codes: TEXT[] of zone identifiers covered (e.g., {ZONE_DOMESTIC,ZONE_ASIA}).
--   Zone definitions and country mappings live in platform_configurations.
-- status: DRAFT → ACTIVE publish workflow managed by underwriter.
-- daily_rate: per-day premium for customer portal trip-length display.
-- premium_breakdown_config: JSONB GST/discount/loading factors for this plan.
-- =============================================================================
CREATE TABLE ins_product.plans (
    id                          UUID            NOT NULL DEFAULT gen_random_uuid(),
    plan_code                   VARCHAR(50)     NOT NULL,
    plan_name                   VARCHAR(150)    NOT NULL,
    product_id                  UUID            NOT NULL,
    base_premium                DECIMAL(12,2)   NOT NULL,
    daily_rate                  DECIMAL(10,4)   NOT NULL DEFAULT 0.0000,
    currency                    CHAR(3)         NOT NULL DEFAULT 'INR',
    min_trip_days               INT             NOT NULL DEFAULT 1,
    max_trip_days               INT             NOT NULL DEFAULT 365,
    min_traveler_age            INT             NOT NULL DEFAULT 0,
    max_traveler_age            INT             NOT NULL DEFAULT 99,
    max_travelers               INT             NOT NULL DEFAULT 10,
    zone_codes                  TEXT[]          NOT NULL DEFAULT '{}',
                                -- Zones this plan covers: {ZONE_DOMESTIC, ZONE_ASIA, ...}
    premium_breakdown_config    JSONB           NULL,
                                -- {gst_rate: 0.18, online_discount: 0.05, zone_loadings: {...}}
    status                      VARCHAR(20)     NOT NULL DEFAULT 'DRAFT',
                                -- DRAFT | ACTIVE | INACTIVE | DISCONTINUED
    version                     INT             NOT NULL DEFAULT 1,
    published_at                TIMESTAMPTZ     NULL,
    published_by                UUID            NULL,
    created_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_by                  UUID            NULL,

    CONSTRAINT pk_plans PRIMARY KEY (id),
    CONSTRAINT uq_plan_code UNIQUE (plan_code),
    CONSTRAINT fk_plans_product FOREIGN KEY (product_id)
        REFERENCES ins_product.insurance_products (id),
    CONSTRAINT chk_plan_status CHECK (status IN ('DRAFT','ACTIVE','INACTIVE','DISCONTINUED')),
    CONSTRAINT chk_plan_trip_days CHECK (max_trip_days >= min_trip_days),
    CONSTRAINT chk_plan_traveler_age CHECK (max_traveler_age >= min_traveler_age),
    CONSTRAINT chk_plan_base_premium CHECK (base_premium >= 0)
);

CREATE INDEX idx_plans_product ON ins_product.plans (product_id);
CREATE INDEX idx_plans_status  ON ins_product.plans (status);
CREATE INDEX idx_plans_active  ON ins_product.plans (product_id, plan_code) WHERE status = 'ACTIVE';

CREATE TRIGGER trg_plans_updated_at
    BEFORE UPDATE ON ins_product.plans
    FOR EACH ROW EXECUTE FUNCTION ins_common.set_updated_at();

-- =============================================================================
-- plan_coverages
-- Coverage limit configuration per plan.
-- coverage_code / coverage_name are stored inline (no separate coverage_types table).
-- coverage_category groups related coverages for the customer portal UI.
-- Adjustable limits power the coverage slider in the Policy Builder (UI-010).
--   is_adjustable = TRUE  → customer slides between min_limit and max_limit
--   is_adjustable = FALSE → fixed at default_limit
-- =============================================================================
CREATE TABLE ins_product.plan_coverages (
    id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
    plan_id             UUID            NOT NULL,
    coverage_code       VARCHAR(50)     NOT NULL,
                        -- MEDICAL_EXPENSES | TRIP_CANCELLATION | BAGGAGE_LOSS
                        -- EMERGENCY_EVACUATION | FLIGHT_DELAY | ACCIDENTAL_DEATH
                        -- PERSONAL_LIABILITY | DENTAL | PASSPORT_LOSS | etc.
    coverage_name       VARCHAR(150)    NOT NULL,
    coverage_category   VARCHAR(50)     NULL,
                        -- HEALTH | TRAVEL | FINANCIAL | PERSONAL | ADVENTURE
    min_limit           DECIMAL(15,2)   NOT NULL DEFAULT 0,
    max_limit           DECIMAL(15,2)   NOT NULL,
    default_limit       DECIMAL(15,2)   NOT NULL,
    limit_step          DECIMAL(15,2)   NOT NULL DEFAULT 1000,
    currency            CHAR(3)         NOT NULL DEFAULT 'INR',
    deductible          DECIMAL(12,2)   NOT NULL DEFAULT 0,
    is_mandatory        BOOLEAN         NOT NULL DEFAULT FALSE,
    is_adjustable       BOOLEAN         NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    sort_order          INT             NOT NULL DEFAULT 0,

    CONSTRAINT pk_plan_coverages PRIMARY KEY (id),
    CONSTRAINT uq_plan_coverage UNIQUE (plan_id, coverage_code),
    CONSTRAINT fk_pc_plan FOREIGN KEY (plan_id)
        REFERENCES ins_product.plans (id),
    CONSTRAINT chk_pc_limits CHECK (default_limit BETWEEN min_limit AND max_limit),
    CONSTRAINT chk_pc_max_limit CHECK (max_limit > 0),
    CONSTRAINT chk_pc_step CHECK (limit_step > 0)
);

CREATE INDEX idx_pc_plan_id     ON ins_product.plan_coverages (plan_id);
CREATE INDEX idx_pc_adjustable  ON ins_product.plan_coverages (plan_id, is_adjustable)
    WHERE is_adjustable = TRUE;

-- =============================================================================
-- addons
-- Global add-on catalog. Underwriter manages from the underwriter portal.
-- compatible_plan_codes: TEXT[] lists plan_codes this add-on can be selected with.
--   Empty array = available with all plans.
-- pricing_type drives premium calculation:
--   FLAT         → pricing_value is added directly
--   PERCENT_OF_BASE → pricing_value % of plan base_premium
--   PER_DAY      → pricing_value × trip_days
--   PER_TRAVELER → pricing_value × number_of_travelers
-- =============================================================================
CREATE TABLE ins_product.addons (
    id                      UUID            NOT NULL DEFAULT gen_random_uuid(),
    addon_code              VARCHAR(50)     NOT NULL,
    addon_name              VARCHAR(150)    NOT NULL,
    addon_category          VARCHAR(50)     NULL,
                            -- MEDICAL | TRAVEL | FINANCIAL | ADVENTURE | PERSONAL | CORPORATE
    description             TEXT            NULL,
    pricing_type            VARCHAR(20)     NOT NULL,
                            -- FLAT | PERCENT_OF_BASE | PER_DAY | PER_TRAVELER
    pricing_value           DECIMAL(12,4)   NOT NULL,
    currency                CHAR(3)         NOT NULL DEFAULT 'INR',
    compatible_plan_codes   TEXT[]          NOT NULL DEFAULT '{}',
                            -- {} = all plans; {PLAN_A, PLAN_B} = restricted
    is_active               BOOLEAN         NOT NULL DEFAULT TRUE,
    sort_order              INT             NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_by              UUID            NULL,

    CONSTRAINT pk_addons PRIMARY KEY (id),
    CONSTRAINT uq_addon_code UNIQUE (addon_code),
    CONSTRAINT chk_addon_pricing_type CHECK (
        pricing_type IN ('FLAT','PERCENT_OF_BASE','PER_DAY','PER_TRAVELER')
    ),
    CONSTRAINT chk_addon_pricing_value CHECK (pricing_value >= 0)
);

CREATE INDEX idx_addons_active ON ins_product.addons (is_active, sort_order);

CREATE TRIGGER trg_addons_updated_at
    BEFORE UPDATE ON ins_product.addons
    FOR EACH ROW EXECUTE FUNCTION ins_common.set_updated_at();
