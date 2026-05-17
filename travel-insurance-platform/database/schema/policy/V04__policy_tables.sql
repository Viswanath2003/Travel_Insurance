-- =============================================================================
-- V04__policy_tables.sql
-- Schema: ins_policy
-- Service: policy-service
-- Description: Complete quote-to-policy lifecycle.
--              Quotes are immutable after calculation.
--              Policies are immutable after activation (snapshots capture state).
-- =============================================================================

USE ins_policy;

-- =============================================================================
-- quotes
-- Quote lifecycle. Quotes are created from user inputs (plan selection,
-- travelers, dates, destination). A quote has 48-hour validity.
-- On purchase confirmation, a quote converts 1:1 to a policy.
-- =============================================================================
CREATE TABLE quotes (
    id                                  VARCHAR(36)     NOT NULL,
    quote_reference                     VARCHAR(30)     NOT NULL,
    customer_id                         VARCHAR(36)     NOT NULL,
    product_id                          VARCHAR(36)     NOT NULL,
    plan_id                             VARCHAR(36)     NOT NULL,
    plan_version                        INT             NOT NULL DEFAULT 1,
    destination_country_code            CHAR(2)         NOT NULL,
    destination_zone_id                 VARCHAR(36)     NULL,
    destination_zone_code               VARCHAR(20)     NULL,
    trip_start_date                     DATE            NOT NULL,
    trip_end_date                       DATE            NOT NULL,
    trip_duration_days                  INT             NOT NULL,
    num_travelers                       INT             NOT NULL DEFAULT 1,
    trip_purpose                        VARCHAR(30)     NOT NULL DEFAULT 'LEISURE',
                                                        -- LEISURE | BUSINESS | EDUCATION
                                                        -- MEDICAL | PILGRIMAGE | ADVENTURE
    total_premium                       DECIMAL(12,2)   NULL,
    currency                            CHAR(3)         NOT NULL DEFAULT 'INR',
    risk_score                          INT             NULL,
    risk_level                          VARCHAR(12)     NULL,
                                                        -- LOW | MEDIUM | HIGH | VERY_HIGH
    status                              VARCHAR(30)     NOT NULL DEFAULT 'DRAFT',
                                                        -- DRAFT | CALCULATED | EXPIRED | CONVERTED
    risk_rule_execution_batch_id        VARCHAR(36)     NULL,
    premium_rule_execution_batch_id     VARCHAR(36)     NULL,
    expires_at                          DATETIME        NOT NULL,
    created_at                          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by                          VARCHAR(36)     NULL,

    CONSTRAINT pk_quotes PRIMARY KEY (id),
    CONSTRAINT uq_quote_reference UNIQUE (quote_reference),
    CONSTRAINT chk_quote_status CHECK (status IN ('DRAFT','CALCULATED','EXPIRED','CONVERTED')),
    CONSTRAINT chk_quote_dates CHECK (trip_end_date >= trip_start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_quotes_customer ON quotes (customer_id, status);
CREATE INDEX idx_quotes_expires ON quotes (expires_at, status);
CREATE INDEX idx_quotes_plan ON quotes (plan_id);

-- =============================================================================
-- quote_travelers
-- Traveler data collected at quote stage.
-- full_name and passport_number are optional at quote; mandatory on policy.
-- individual_risk_score supports multi-traveler risk differentiation.
-- =============================================================================
CREATE TABLE quote_travelers (
    id                          VARCHAR(36)     NOT NULL,
    quote_id                    VARCHAR(36)     NOT NULL,
    traveler_sequence           INT             NOT NULL,
    full_name                   VARCHAR(100)    NULL,
    date_of_birth               DATE            NOT NULL,
    age                         INT             NOT NULL,
    age_band                    VARCHAR(25)     NULL,
                                                -- CHILD_0_17 | ADULT_18_35 | ADULT_36_59
                                                -- SENIOR_60_70 | SENIOR_71_PLUS
    passport_number             VARCHAR(20)     NULL,
    nationality                 CHAR(2)         NULL,
    gender                      VARCHAR(10)     NULL,
                                                -- MALE | FEMALE | OTHER
    is_primary                  TINYINT(1)      NOT NULL DEFAULT 0,
    has_preexisting_condition   TINYINT(1)      NOT NULL DEFAULT 0,
    has_adventure_activity      TINYINT(1)      NOT NULL DEFAULT 0,
    individual_risk_score       INT             NULL,
    individual_premium          DECIMAL(10,2)   NULL,

    CONSTRAINT pk_quote_travelers PRIMARY KEY (id),
    CONSTRAINT uq_qt_sequence UNIQUE (quote_id, traveler_sequence),
    CONSTRAINT fk_qt_quote FOREIGN KEY (quote_id) REFERENCES quotes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_qt_quote_id ON quote_travelers (quote_id);

-- =============================================================================
-- quote_coverage_selections
-- Customer-selected coverage limits from the Adaptive Policy Builder slider.
-- selected_limit is what the customer chose (between min_limit and max_limit).
-- limit_premium is the extra cost for choosing above the default_limit.
-- =============================================================================
CREATE TABLE quote_coverage_selections (
    id                  VARCHAR(36)     NOT NULL,
    quote_id            VARCHAR(36)     NOT NULL,
    coverage_type_id    VARCHAR(36)     NOT NULL,
    coverage_code       VARCHAR(50)     NOT NULL,
    selected_limit      DECIMAL(15,2)   NOT NULL,
    base_limit          DECIMAL(15,2)   NOT NULL,
    limit_premium       DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    currency            CHAR(3)         NOT NULL DEFAULT 'INR',

    CONSTRAINT pk_qcs PRIMARY KEY (id),
    CONSTRAINT uq_qcs_quote_coverage UNIQUE (quote_id, coverage_type_id),
    CONSTRAINT fk_qcs_quote FOREIGN KEY (quote_id) REFERENCES quotes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- quote_addon_selections
-- Add-ons selected by customer during Policy Builder (UI-011).
-- =============================================================================
CREATE TABLE quote_addon_selections (
    id              VARCHAR(36)     NOT NULL,
    quote_id        VARCHAR(36)     NOT NULL,
    addon_id        VARCHAR(36)     NOT NULL,
    addon_code      VARCHAR(50)     NOT NULL,
    addon_premium   DECIMAL(10,2)   NOT NULL,

    CONSTRAINT pk_qas PRIMARY KEY (id),
    CONSTRAINT uq_qas_quote_addon UNIQUE (quote_id, addon_id),
    CONSTRAINT fk_qas_quote FOREIGN KEY (quote_id) REFERENCES quotes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- quote_premium_breakdown
-- Full itemized premium breakdown for the quote.
-- Displayed in UI-012 Dynamic Pricing.
-- breakdown_json holds the rule-by-rule contribution detail for explainability.
-- =============================================================================
CREATE TABLE quote_premium_breakdown (
    id                      VARCHAR(36)     NOT NULL,
    quote_id                VARCHAR(36)     NOT NULL,
    base_premium            DECIMAL(12,2)   NOT NULL,
    zone_loading            DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    risk_loading            DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    age_loading             DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    duration_loading        DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    coverage_loading        DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    addon_premium_total     DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    discount_amount         DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    tax_amount              DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    gross_premium           DECIMAL(12,2)   NOT NULL,
    net_premium             DECIMAL(12,2)   NOT NULL,
    breakdown_json          JSON            NULL,

    CONSTRAINT pk_qpb PRIMARY KEY (id),
    CONSTRAINT uq_qpb_quote UNIQUE (quote_id),
    CONSTRAINT fk_qpb_quote FOREIGN KEY (quote_id) REFERENCES quotes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- quote_snapshots
-- Immutable snapshot of quote at the time of premium calculation.
-- Captures which plan_version and rule_versions were used.
-- Referenced by the policy_snapshot at issuance for full traceability.
-- =============================================================================
CREATE TABLE quote_snapshots (
    id                  VARCHAR(36)     NOT NULL,
    quote_id            VARCHAR(36)     NOT NULL,
    snapshot_data       JSON            NOT NULL,
    plan_version_id     VARCHAR(36)     NULL,
    risk_rule_versions  JSON            NULL,
    premium_rule_versions JSON          NULL,
    snapshotted_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_quote_snapshots PRIMARY KEY (id),
    CONSTRAINT uq_qs_quote UNIQUE (quote_id),
    CONSTRAINT fk_qs_quote FOREIGN KEY (quote_id) REFERENCES quotes (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- policies
-- Core policy record. Immutable after status transitions to ACTIVE.
-- All subsequent reads by claims-service use policy_snapshots, not this table.
-- parent_policy_id self-reference enables renewal chain tracing.
-- version column supports optimistic locking via Spring @Version.
-- =============================================================================
CREATE TABLE policies (
    id                                  VARCHAR(36)     NOT NULL,
    policy_number                       VARCHAR(30)     NOT NULL,
    quote_id                            VARCHAR(36)     NOT NULL,
    customer_id                         VARCHAR(36)     NOT NULL,
    product_id                          VARCHAR(36)     NOT NULL,
    plan_id                             VARCHAR(36)     NOT NULL,
    plan_version                        INT             NOT NULL DEFAULT 1,
    destination_country_code            CHAR(2)         NOT NULL,
    destination_zone_id                 VARCHAR(36)     NULL,
    destination_zone_code               VARCHAR(20)     NULL,
    trip_start_date                     DATE            NOT NULL,
    trip_end_date                       DATE            NOT NULL,
    trip_duration_days                  INT             NOT NULL,
    num_travelers                       INT             NOT NULL DEFAULT 1,
    trip_purpose                        VARCHAR(30)     NULL,
    total_premium                       DECIMAL(12,2)   NOT NULL,
    currency                            CHAR(3)         NOT NULL DEFAULT 'INR',
    risk_score                          INT             NULL,
    risk_level                          VARCHAR(12)     NULL,
    status                              VARCHAR(30)     NOT NULL,
                                                        -- PENDING_UNDERWRITING | UNDER_REVIEW | ACTIVE
                                                        -- EXPIRED | CANCELLED | REJECTED | CANCELLATION_REQUESTED
    issue_date                          DATETIME        NULL,
    expiry_date                         DATE            NULL,
    cancellation_date                   DATETIME        NULL,
    cancellation_reason                 TEXT            NULL,
    parent_policy_id                    VARCHAR(36)     NULL,
    renewal_count                       INT             NOT NULL DEFAULT 0,
    payment_reference                   VARCHAR(100)    NULL,
    payment_recorded_at                 DATETIME        NULL,
    risk_rule_execution_batch_id        VARCHAR(36)     NULL,
    premium_rule_execution_batch_id     VARCHAR(36)     NULL,
    policy_wording_id                   VARCHAR(36)     NULL,
    policy_wording_version              INT             NULL,
    created_at                          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by                          VARCHAR(36)     NULL,
    version                             BIGINT          NOT NULL DEFAULT 0,

    CONSTRAINT pk_policies PRIMARY KEY (id),
    CONSTRAINT uq_policy_number UNIQUE (policy_number),
    CONSTRAINT chk_policy_status CHECK (status IN (
        'PENDING_UNDERWRITING','UNDER_REVIEW','ACTIVE','EXPIRED',
        'CANCELLED','REJECTED','CANCELLATION_REQUESTED'
    )),
    CONSTRAINT fk_policies_quote FOREIGN KEY (quote_id) REFERENCES quotes (id),
    CONSTRAINT fk_policies_parent FOREIGN KEY (parent_policy_id) REFERENCES policies (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_policies_customer ON policies (customer_id, status);
CREATE INDEX idx_policies_status_risk ON policies (status, risk_level);
CREATE INDEX idx_policies_plan ON policies (plan_id);
CREATE INDEX idx_policies_expiry ON policies (expiry_date, status);

-- =============================================================================
-- policy_travelers
-- Complete traveler details locked at policy issuance.
-- All fields mandatory here (unlike quote_travelers).
-- =============================================================================
CREATE TABLE policy_travelers (
    id                          VARCHAR(36)     NOT NULL,
    policy_id                   VARCHAR(36)     NOT NULL,
    traveler_sequence           INT             NOT NULL,
    full_name                   VARCHAR(100)    NOT NULL,
    date_of_birth               DATE            NOT NULL,
    age                         INT             NOT NULL,
    age_band                    VARCHAR(25)     NULL,
    passport_number             VARCHAR(20)     NOT NULL,
    nationality                 CHAR(2)         NULL,
    gender                      VARCHAR(10)     NULL,
    contact_number              VARCHAR(20)     NULL,
    is_primary                  TINYINT(1)      NOT NULL DEFAULT 0,
    has_preexisting_condition   TINYINT(1)      NOT NULL DEFAULT 0,
    has_adventure_activity      TINYINT(1)      NOT NULL DEFAULT 0,
    individual_risk_score       INT             NULL,
    individual_premium          DECIMAL(10,2)   NULL,
    nominee_name                VARCHAR(100)    NULL,
    nominee_relationship        VARCHAR(50)     NULL,

    CONSTRAINT pk_policy_travelers PRIMARY KEY (id),
    CONSTRAINT uq_pt_sequence UNIQUE (policy_id, traveler_sequence),
    CONSTRAINT fk_pt_policy FOREIGN KEY (policy_id) REFERENCES policies (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_pt_policy_id ON policy_travelers (policy_id);

-- =============================================================================
-- policy_coverage_details
-- Coverage details locked at issuance. These are the authoritative coverage
-- terms for claims processing. Claims always use policy_snapshot, not live.
-- =============================================================================
CREATE TABLE policy_coverage_details (
    id                  VARCHAR(36)     NOT NULL,
    policy_id           VARCHAR(36)     NOT NULL,
    coverage_type_id    VARCHAR(36)     NOT NULL,
    coverage_code       VARCHAR(50)     NOT NULL,
    coverage_name       VARCHAR(150)    NOT NULL,
    coverage_limit      DECIMAL(15,2)   NOT NULL,
    deductible          DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    currency            CHAR(3)         NOT NULL DEFAULT 'INR',
    is_mandatory        TINYINT(1)      NOT NULL DEFAULT 0,

    CONSTRAINT pk_policy_coverage_details PRIMARY KEY (id),
    CONSTRAINT uq_pcd_policy_coverage UNIQUE (policy_id, coverage_type_id),
    CONSTRAINT fk_pcd_policy FOREIGN KEY (policy_id) REFERENCES policies (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_pcd_policy_id ON policy_coverage_details (policy_id);

-- =============================================================================
-- policy_addon_selections
-- Add-ons locked at issuance. Stored denormalized (code + name) so
-- even if the add-on catalog changes, the policy record remains accurate.
-- =============================================================================
CREATE TABLE policy_addon_selections (
    id              VARCHAR(36)     NOT NULL,
    policy_id       VARCHAR(36)     NOT NULL,
    addon_id        VARCHAR(36)     NOT NULL,
    addon_code      VARCHAR(50)     NOT NULL,
    addon_name      VARCHAR(150)    NOT NULL,
    addon_premium   DECIMAL(10,2)   NOT NULL,

    CONSTRAINT pk_policy_addon_selections PRIMARY KEY (id),
    CONSTRAINT uq_pas_policy_addon UNIQUE (policy_id, addon_id),
    CONSTRAINT fk_pas_policy FOREIGN KEY (policy_id) REFERENCES policies (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- policy_premium_breakdown
-- Full itemized premium breakdown locked at issuance.
-- breakdown_json contains rule-by-rule contribution details.
-- =============================================================================
CREATE TABLE policy_premium_breakdown (
    id                      VARCHAR(36)     NOT NULL,
    policy_id               VARCHAR(36)     NOT NULL,
    base_premium            DECIMAL(12,2)   NOT NULL,
    zone_loading            DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    risk_loading            DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    age_loading             DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    duration_loading        DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    coverage_loading        DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    addon_premium_total     DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    discount_amount         DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    tax_amount              DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    gross_premium           DECIMAL(12,2)   NOT NULL,
    net_premium             DECIMAL(12,2)   NOT NULL,
    breakdown_json          JSON            NULL,

    CONSTRAINT pk_ppb PRIMARY KEY (id),
    CONSTRAINT uq_ppb_policy UNIQUE (policy_id),
    CONSTRAINT fk_ppb_policy FOREIGN KEY (policy_id) REFERENCES policies (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- policy_snapshots
-- THE most critical table for claims integrity.
-- A complete, immutable JSON snapshot of the entire policy state
-- is created at each significant lifecycle event.
-- Claims service ALWAYS reads from here — never from live policy tables.
-- snapshot_version starts at 1 (issuance); increments on endorsement/renewal.
-- =============================================================================
CREATE TABLE policy_snapshots (
    id                  VARCHAR(36)     NOT NULL,
    policy_id           VARCHAR(36)     NOT NULL,
    snapshot_version    INT             NOT NULL DEFAULT 1,
    snapshot_type       VARCHAR(20)     NOT NULL,
                                        -- ISSUANCE | ENDORSEMENT | RENEWAL
    snapshot_data       JSON            NOT NULL,
    snapshotted_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    snapshotted_by      VARCHAR(36)     NULL,

    CONSTRAINT pk_policy_snapshots PRIMARY KEY (id),
    CONSTRAINT uq_ps_policy_version UNIQUE (policy_id, snapshot_version),
    CONSTRAINT chk_ps_type CHECK (snapshot_type IN ('ISSUANCE','ENDORSEMENT','RENEWAL')),
    CONSTRAINT fk_ps_policy FOREIGN KEY (policy_id) REFERENCES policies (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_ps_policy_id ON policy_snapshots (policy_id);

-- =============================================================================
-- policy_status_history
-- Audit trail of all policy status changes with who changed and why.
-- =============================================================================
CREATE TABLE policy_status_history (
    id          VARCHAR(36)     NOT NULL,
    policy_id   VARCHAR(36)     NOT NULL,
    from_status VARCHAR(30)     NULL,
    to_status   VARCHAR(30)     NOT NULL,
    changed_by  VARCHAR(36)     NULL,
    changed_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason      TEXT            NULL,

    CONSTRAINT pk_policy_status_history PRIMARY KEY (id),
    CONSTRAINT fk_psh_policy FOREIGN KEY (policy_id) REFERENCES policies (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_psh_policy_id ON policy_status_history (policy_id, changed_at);

-- =============================================================================
-- policy_wordings
-- Versioned policy wording documents. The wording version active at the time
-- of policy issuance is linked to the policy and captured in its snapshot.
-- content is the full legal policy text (stored as LONGTEXT).
-- =============================================================================
CREATE TABLE policy_wordings (
    id                  VARCHAR(36)     NOT NULL,
    wording_code        VARCHAR(50)     NOT NULL,
    product_type_code   VARCHAR(50)     NULL,
    version             INT             NOT NULL,
    title               VARCHAR(200)    NOT NULL,
    content             LONGTEXT        NOT NULL,
    effective_from      DATE            NOT NULL,
    effective_to        DATE            NULL,
    is_active           TINYINT(1)      NOT NULL DEFAULT 1,
    published_by        VARCHAR(36)     NULL,
    published_at        DATETIME        NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_policy_wordings PRIMARY KEY (id),
    CONSTRAINT uq_pw_code_version UNIQUE (wording_code, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_pw_active ON policy_wordings (wording_code, is_active);
