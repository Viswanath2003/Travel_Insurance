-- =============================================================================
-- V02__product_tables.sql
-- Schema: ins_product
-- Service: product-service
-- Description: Insurance product catalog — fully configuration-driven.
--              No product type, plan name, coverage, or add-on is hardcoded.
-- =============================================================================

USE ins_product;

-- =============================================================================
-- product_types
-- Configurable product type registry. Admin adds new types from UI-031.
-- Examples: STUDENT, FAMILY, CORPORATE, SENIOR, ANNUAL_MULTI_TRIP, SINGLE_TRIP
-- =============================================================================
CREATE TABLE product_types (
    id          VARCHAR(36)     NOT NULL,
    type_code   VARCHAR(50)     NOT NULL,
    type_name   VARCHAR(100)    NOT NULL,
    description TEXT            NULL,
    is_active   TINYINT(1)      NOT NULL DEFAULT 1,
    sort_order  INT             NOT NULL DEFAULT 0,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by  VARCHAR(36)     NULL,

    CONSTRAINT pk_product_types PRIMARY KEY (id),
    CONSTRAINT uq_product_type_code UNIQUE (type_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- insurance_products
-- Master product catalog. Each product belongs to a product type.
-- =============================================================================
CREATE TABLE insurance_products (
    id                  VARCHAR(36)     NOT NULL,
    product_code        VARCHAR(50)     NOT NULL,
    product_name        VARCHAR(150)    NOT NULL,
    product_type_id     VARCHAR(36)     NOT NULL,
    description         TEXT            NULL,
    is_active           TINYINT(1)      NOT NULL DEFAULT 1,
    launch_date         DATE            NULL,
    discontinue_date    DATE            NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by          VARCHAR(36)     NULL,

    CONSTRAINT pk_insurance_products PRIMARY KEY (id),
    CONSTRAINT uq_product_code UNIQUE (product_code),
    CONSTRAINT fk_ip_product_type FOREIGN KEY (product_type_id) REFERENCES product_types (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_ip_product_type ON insurance_products (product_type_id);
CREATE INDEX idx_ip_active ON insurance_products (is_active);

-- =============================================================================
-- plans
-- Plan catalog. Each plan belongs to a product. Plans go through a
-- DRAFT → ACTIVE publish workflow. Versioning tracks configuration changes.
-- =============================================================================
CREATE TABLE plans (
    id                  VARCHAR(36)     NOT NULL,
    plan_code           VARCHAR(50)     NOT NULL,
    plan_name           VARCHAR(150)    NOT NULL,
    product_id          VARCHAR(36)     NOT NULL,
    base_premium        DECIMAL(12,2)   NOT NULL,
    currency            CHAR(3)         NOT NULL DEFAULT 'INR',
    min_trip_days       INT             NOT NULL DEFAULT 1,
    max_trip_days       INT             NOT NULL DEFAULT 365,
    min_traveler_age    INT             NOT NULL DEFAULT 0,
    max_traveler_age    INT             NOT NULL DEFAULT 99,
    max_travelers       INT             NOT NULL DEFAULT 10,
    status              VARCHAR(20)     NOT NULL DEFAULT 'DRAFT',
                                        -- DRAFT | ACTIVE | INACTIVE | DISCONTINUED
    version             INT             NOT NULL DEFAULT 1,
    published_at        DATETIME        NULL,
    published_by        VARCHAR(36)     NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by          VARCHAR(36)     NULL,

    CONSTRAINT pk_plans PRIMARY KEY (id),
    CONSTRAINT uq_plan_code UNIQUE (plan_code),
    CONSTRAINT chk_plan_status CHECK (status IN ('DRAFT','ACTIVE','INACTIVE','DISCONTINUED')),
    CONSTRAINT fk_plans_product FOREIGN KEY (product_id) REFERENCES insurance_products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_plans_product ON plans (product_id);
CREATE INDEX idx_plans_status ON plans (status);

-- =============================================================================
-- plan_versions
-- Immutable snapshots of plan configuration at each publish.
-- Policy issuance stores which plan version was in force at quote time.
-- =============================================================================
CREATE TABLE plan_versions (
    id              VARCHAR(36)     NOT NULL,
    plan_id         VARCHAR(36)     NOT NULL,
    version_number  INT             NOT NULL,
    version_data    JSON            NOT NULL,
    change_summary  TEXT            NULL,
    published_by    VARCHAR(36)     NULL,
    published_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_plan_versions PRIMARY KEY (id),
    CONSTRAINT uq_plan_version UNIQUE (plan_id, version_number),
    CONSTRAINT fk_pv_plan FOREIGN KEY (plan_id) REFERENCES plans (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_pv_plan_id ON plan_versions (plan_id);

-- =============================================================================
-- coverage_types
-- Master catalog of coverage categories. Admin-configurable.
-- Examples: MEDICAL_EXPENSES, TRIP_CANCELLATION, BAGGAGE_LOSS, PERSONAL_ACCIDENT,
--           EMERGENCY_EVACUATION, FLIGHT_DELAY, DENTAL, ADVENTURE_SPORTS
-- =============================================================================
CREATE TABLE coverage_types (
    id                  VARCHAR(36)     NOT NULL,
    coverage_code       VARCHAR(50)     NOT NULL,
    coverage_name       VARCHAR(150)    NOT NULL,
    coverage_category   VARCHAR(50)     NULL,
                                        -- HEALTH | TRAVEL | FINANCIAL | PERSONAL
    description         TEXT            NULL,
    is_active           TINYINT(1)      NOT NULL DEFAULT 1,
    sort_order          INT             NOT NULL DEFAULT 0,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_coverage_types PRIMARY KEY (id),
    CONSTRAINT uq_coverage_code UNIQUE (coverage_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- plan_coverages
-- Defines coverage limits per plan. min_limit/max_limit/limit_step support
-- the coverage slider in the Adaptive Policy Builder (UI-010).
-- is_adjustable = true → customer can slide between min and max
-- is_adjustable = false → fixed at default_limit
-- =============================================================================
CREATE TABLE plan_coverages (
    id                  VARCHAR(36)     NOT NULL,
    plan_id             VARCHAR(36)     NOT NULL,
    coverage_type_id    VARCHAR(36)     NOT NULL,
    min_limit           DECIMAL(15,2)   NOT NULL DEFAULT 0,
    max_limit           DECIMAL(15,2)   NOT NULL,
    default_limit       DECIMAL(15,2)   NOT NULL,
    limit_step          DECIMAL(15,2)   NOT NULL DEFAULT 1000,
    currency            CHAR(3)         NOT NULL DEFAULT 'INR',
    deductible          DECIMAL(12,2)   NOT NULL DEFAULT 0,
    is_mandatory        TINYINT(1)      NOT NULL DEFAULT 0,
    is_adjustable       TINYINT(1)      NOT NULL DEFAULT 0,
    is_active           TINYINT(1)      NOT NULL DEFAULT 1,

    CONSTRAINT pk_plan_coverages PRIMARY KEY (id),
    CONSTRAINT uq_plan_coverage UNIQUE (plan_id, coverage_type_id),
    CONSTRAINT fk_pc_plan FOREIGN KEY (plan_id) REFERENCES plans (id),
    CONSTRAINT fk_pc_coverage_type FOREIGN KEY (coverage_type_id) REFERENCES coverage_types (id),
    CONSTRAINT chk_pc_limits CHECK (default_limit BETWEEN min_limit AND max_limit)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_pc_plan_id ON plan_coverages (plan_id);

-- =============================================================================
-- addons
-- Add-on catalog. Admin manages from UI-032.
-- pricing_type determines how addon cost is calculated:
--   FLAT           → fixed amount
--   PERCENT_OF_BASE → % of base plan premium
--   PER_DAY        → daily rate × trip duration
--   PER_TRAVELER   → per-person flat rate
-- =============================================================================
CREATE TABLE addons (
    id              VARCHAR(36)     NOT NULL,
    addon_code      VARCHAR(50)     NOT NULL,
    addon_name      VARCHAR(150)    NOT NULL,
    addon_category  VARCHAR(50)     NULL,
                                    -- MEDICAL | TRAVEL | FINANCIAL | ADVENTURE | PERSONAL
    description     TEXT            NULL,
    pricing_type    VARCHAR(20)     NOT NULL,
                                    -- FLAT | PERCENT_OF_BASE | PER_DAY | PER_TRAVELER
    pricing_value   DECIMAL(12,4)   NOT NULL,
    currency        CHAR(3)         NOT NULL DEFAULT 'INR',
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    sort_order      INT             NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by      VARCHAR(36)     NULL,

    CONSTRAINT pk_addons PRIMARY KEY (id),
    CONSTRAINT uq_addon_code UNIQUE (addon_code),
    CONSTRAINT chk_addon_pricing_type CHECK (pricing_type IN ('FLAT','PERCENT_OF_BASE','PER_DAY','PER_TRAVELER'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- plan_addon_mappings
-- Controls which add-ons are available for which plans.
-- Admin manages this mapping from UI-032.
-- =============================================================================
CREATE TABLE plan_addon_mappings (
    id          VARCHAR(36)     NOT NULL,
    plan_id     VARCHAR(36)     NOT NULL,
    addon_id    VARCHAR(36)     NOT NULL,
    is_active   TINYINT(1)      NOT NULL DEFAULT 1,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_plan_addon_mappings PRIMARY KEY (id),
    CONSTRAINT uq_plan_addon UNIQUE (plan_id, addon_id),
    CONSTRAINT fk_pam_plan FOREIGN KEY (plan_id) REFERENCES plans (id),
    CONSTRAINT fk_pam_addon FOREIGN KEY (addon_id) REFERENCES addons (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_pam_plan_id ON plan_addon_mappings (plan_id);
CREATE INDEX idx_pam_addon_id ON plan_addon_mappings (addon_id);

-- =============================================================================
-- destination_zones
-- Geographic risk zones. risk_tier feeds into the rule engine for premium loading.
-- Admin configures zones and their risk tiers from the Admin panel.
-- =============================================================================
CREATE TABLE destination_zones (
    id          VARCHAR(36)     NOT NULL,
    zone_code   VARCHAR(20)     NOT NULL,
                                -- ZONE_DOMESTIC | ZONE_ASIA | ZONE_EUROPE
                                -- ZONE_USA_CANADA | ZONE_WORLDWIDE
    zone_name   VARCHAR(100)    NOT NULL,
    risk_tier   VARCHAR(10)     NOT NULL DEFAULT 'TIER_1',
                                -- TIER_1 (lowest) ... TIER_5 (highest)
    description TEXT            NULL,
    is_active   TINYINT(1)      NOT NULL DEFAULT 1,
    sort_order  INT             NOT NULL DEFAULT 0,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_destination_zones PRIMARY KEY (id),
    CONSTRAINT uq_zone_code UNIQUE (zone_code),
    CONSTRAINT chk_risk_tier CHECK (risk_tier IN ('TIER_1','TIER_2','TIER_3','TIER_4','TIER_5'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- zone_countries
-- Maps countries to zones. ISO 3166-1 alpha-2 country codes.
-- Used by product-service to resolve zone when customer selects destination.
-- =============================================================================
CREATE TABLE zone_countries (
    id              VARCHAR(36)     NOT NULL,
    zone_id         VARCHAR(36)     NOT NULL,
    country_code    CHAR(2)         NOT NULL,
    country_name    VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_zone_countries PRIMARY KEY (id),
    CONSTRAINT uq_zone_country UNIQUE (country_code),
    CONSTRAINT fk_zc_zone FOREIGN KEY (zone_id) REFERENCES destination_zones (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_zc_zone_id ON zone_countries (zone_id);
CREATE INDEX idx_zc_country_code ON zone_countries (country_code);

-- =============================================================================
-- plan_zone_mappings
-- Defines which zones a plan covers and any zone-specific base loading.
-- zone_base_loading_percent is an additional premium % applied for this zone
-- before the rule engine runs (e.g., Zone USA = +15% base).
-- =============================================================================
CREATE TABLE plan_zone_mappings (
    id                          VARCHAR(36)     NOT NULL,
    plan_id                     VARCHAR(36)     NOT NULL,
    zone_id                     VARCHAR(36)     NOT NULL,
    zone_base_loading_percent   DECIMAL(6,2)    NOT NULL DEFAULT 0.00,
    is_active                   TINYINT(1)      NOT NULL DEFAULT 1,

    CONSTRAINT pk_plan_zone_mappings PRIMARY KEY (id),
    CONSTRAINT uq_plan_zone UNIQUE (plan_id, zone_id),
    CONSTRAINT fk_pzm_plan FOREIGN KEY (plan_id) REFERENCES plans (id),
    CONSTRAINT fk_pzm_zone FOREIGN KEY (zone_id) REFERENCES destination_zones (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_pzm_plan_id ON plan_zone_mappings (plan_id);
