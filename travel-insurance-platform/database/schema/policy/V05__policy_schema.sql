-- =============================================================================
-- V05__policy_schema.sql
-- Schema: ins_policy
-- Service: policy-service
-- Description: Quote-to-policy lifecycle. Quotes are immutable after calculation.
--              Policies are immutable after activation; snapshots preserve state.
--
-- DESIGN (25-table target — 5 tables here):
--   + quotes              — core quote; premium_breakdown & selections stored as JSONB
--   + travelers           — unified for QUOTE and POLICY context (replaces two separate tables)
--   + policies            — core policy; coverage_details & addon_selections stored as JSONB;
--                           risk_score/risk_level hidden from customer (shown to UW/CO only)
--                           status PENDING_UW replaces PENDING_UW_L1 / PENDING_UW_L2
--   + policy_snapshots    — immutable JSON snapshot per lifecycle event (critical for claims)
--   + policy_agent_bindings — agent binding + commission record (replaces agent_commissions)
--
-- Removed vs previous schema:
--   - quote_travelers           → travelers table (context_type=QUOTE)
--   - quote_coverage_selections → quotes.selections_json JSONB
--   - quote_addon_selections    → quotes.selections_json JSONB
--   - quote_premium_breakdown   → quotes.premium_breakdown JSONB
--   - quote_snapshots           → dropped (quotes.premium_breakdown + travelers sufficient)
--   - policy_travelers          → travelers table (context_type=POLICY)
--   - policy_coverage_details   → policies.coverage_details JSONB
--   - policy_addon_selections   → policies.coverage_details JSONB
--   - policy_premium_breakdown  → policies.premium_breakdown JSONB
--   - policy_status_history     → audit_logs (V11) action='POLICY_STATUS_CHANGED'
--   - policy_wordings           → generated_documents (V09)
--   - agent_commissions         → merged into policy_agent_bindings (1:1 with policy)
-- =============================================================================

SET search_path = ins_policy, public;

-- =============================================================================
-- quotes
-- Quote lifecycle. Default validity 48 hours (configurable in platform_configurations).
-- premium_breakdown: JSONB itemized breakdown including rule-by-rule explainability.
--   {base_premium, zone_loading, risk_loading, age_loading, duration_loading,
--    coverage_loading, addon_total, discount_amount, tax_amount,
--    gross_premium, net_premium, breakdown_detail: [...]}
-- selections_json: JSONB array of coverage selections and add-ons.
--   {coverages: [{code, name, selected_limit, premium}], addons: [{code, name, premium}]}
-- risk_score and risk_level are internal fields — never exposed to customer UI.
-- =============================================================================
CREATE TABLE ins_policy.quotes (
    id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
    quote_reference     VARCHAR(30)     NOT NULL,
    customer_id         UUID            NOT NULL,
    product_id          UUID            NOT NULL,
    plan_id             UUID            NOT NULL,
    plan_code           VARCHAR(50)     NOT NULL,
    destination_country_code    CHAR(2)     NOT NULL,
    destination_zone_code       VARCHAR(30) NULL,
    trip_start_date     DATE            NOT NULL,
    trip_end_date       DATE            NOT NULL,
    trip_duration_days  INT             NOT NULL,
    num_travelers       INT             NOT NULL DEFAULT 1,
    trip_purpose        VARCHAR(30)     NOT NULL DEFAULT 'LEISURE',
                        -- LEISURE | BUSINESS | EDUCATION | MEDICAL | PILGRIMAGE | ADVENTURE
    total_premium       DECIMAL(12,2)   NULL,
    currency            CHAR(3)         NOT NULL DEFAULT 'INR',
    risk_score          NUMERIC(5,2)    NULL,   -- Internal; hidden from customer
    risk_level          VARCHAR(12)     NULL,   -- LOW | MEDIUM | HIGH | VERY_HIGH; hidden
    premium_breakdown   JSONB           NULL,
                        -- Itemized breakdown with rule-by-rule explainability
    selections_json     JSONB           NULL,
                        -- {coverages:[...], addons:[...]}
    status              VARCHAR(20)     NOT NULL DEFAULT 'DRAFT',
                        -- DRAFT | CALCULATED | EXPIRED | CONVERTED | ABANDONED
    agent_id            UUID            NULL,   -- If quote initiated by agent
    expires_at          TIMESTAMPTZ     NOT NULL,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_by          UUID            NULL,

    CONSTRAINT pk_quotes PRIMARY KEY (id),
    CONSTRAINT uq_quote_reference UNIQUE (quote_reference),
    CONSTRAINT chk_quote_status CHECK (status IN ('DRAFT','CALCULATED','EXPIRED','CONVERTED','ABANDONED')),
    CONSTRAINT chk_quote_dates CHECK (trip_end_date >= trip_start_date),
    CONSTRAINT chk_quote_purpose CHECK (trip_purpose IN (
        'LEISURE','BUSINESS','EDUCATION','MEDICAL','PILGRIMAGE','ADVENTURE'
    ))
);

CREATE INDEX idx_quotes_customer ON ins_policy.quotes (customer_id, status);
CREATE INDEX idx_quotes_expires  ON ins_policy.quotes (expires_at, status) WHERE status = 'CALCULATED';
CREATE INDEX idx_quotes_agent    ON ins_policy.quotes (agent_id) WHERE agent_id IS NOT NULL;
CREATE INDEX idx_quotes_breakdown_gin ON ins_policy.quotes USING GIN (premium_breakdown)
    WHERE premium_breakdown IS NOT NULL;

CREATE TRIGGER trg_quotes_updated_at
    BEFORE UPDATE ON ins_policy.quotes
    FOR EACH ROW EXECUTE FUNCTION ins_common.set_updated_at();

-- =============================================================================
-- travelers
-- Unified traveler table for both QUOTE and POLICY context.
-- context_type=QUOTE: full_name and passport optional; context_type=POLICY: mandatory.
-- individual_risk_score is internal — never shown on customer portal.
-- =============================================================================
CREATE TABLE ins_policy.travelers (
    id                          UUID            NOT NULL DEFAULT gen_random_uuid(),
    context_type                VARCHAR(10)     NOT NULL,
                                -- QUOTE | POLICY
    context_id                  UUID            NOT NULL,
                                -- quotes.id or policies.id
    traveler_sequence           INT             NOT NULL,
    full_name                   VARCHAR(120)    NULL,
    date_of_birth               DATE            NOT NULL,
    age                         INT             NOT NULL,
    age_band                    VARCHAR(25)     NULL,
                                -- CHILD_0_17 | ADULT_18_35 | ADULT_36_59
                                -- SENIOR_60_70 | SENIOR_71_PLUS
    passport_number             VARCHAR(20)     NULL,
    nationality                 CHAR(2)         NULL,
    gender                      VARCHAR(25)     NULL,
    contact_number              VARCHAR(20)     NULL,
    is_primary                  BOOLEAN         NOT NULL DEFAULT FALSE,
    has_preexisting_condition   BOOLEAN         NOT NULL DEFAULT FALSE,
    has_adventure_activity      BOOLEAN         NOT NULL DEFAULT FALSE,
    individual_risk_score       NUMERIC(5,2)    NULL,   -- Internal; hidden from customer
    individual_premium          DECIMAL(10,2)   NULL,
    nominee_name                VARCHAR(100)    NULL,
    nominee_relationship        VARCHAR(50)     NULL,

    CONSTRAINT pk_travelers PRIMARY KEY (id),
    CONSTRAINT uq_traveler_sequence UNIQUE (context_type, context_id, traveler_sequence),
    CONSTRAINT chk_traveler_context CHECK (context_type IN ('QUOTE','POLICY')),
    CONSTRAINT chk_traveler_age_band CHECK (
        age_band IN ('CHILD_0_17','ADULT_18_35','ADULT_36_59','SENIOR_60_70','SENIOR_71_PLUS')
        OR age_band IS NULL
    )
);

CREATE INDEX idx_travelers_context ON ins_policy.travelers (context_type, context_id);

-- =============================================================================
-- policies
-- Core policy record. Immutable after ACTIVE — any change creates a new snapshot.
-- Status PENDING_UW covers what was previously PENDING_UW_L1 + PENDING_UW_L2.
-- Status PENDING_REVIEW covers what was previously PENDING_CO_REVIEW.
-- coverage_details: JSONB snapshot of locked coverage terms at issuance.
--   {coverages: [{code, name, limit, deductible}], addons: [{code, name, premium}]}
-- premium_breakdown: JSONB locked at issuance (same structure as quotes.premium_breakdown).
-- risk_score and risk_level are internal — the customer portal MUST NOT display them.
-- =============================================================================
CREATE TABLE ins_policy.policies (
    id                      UUID            NOT NULL DEFAULT gen_random_uuid(),
    policy_number           VARCHAR(30)     NOT NULL,
    quote_id                UUID            NOT NULL,
    customer_id             UUID            NOT NULL,
    product_id              UUID            NOT NULL,
    plan_id                 UUID            NOT NULL,
    plan_code               VARCHAR(50)     NOT NULL,
    destination_country_code    CHAR(2)     NOT NULL,
    destination_zone_code       VARCHAR(30) NULL,
    trip_start_date         DATE            NOT NULL,
    trip_end_date           DATE            NOT NULL,
    trip_duration_days      INT             NOT NULL,
    num_travelers           INT             NOT NULL DEFAULT 1,
    trip_purpose            VARCHAR(30)     NULL,
    total_premium           DECIMAL(12,2)   NOT NULL,
    currency                CHAR(3)         NOT NULL DEFAULT 'INR',
    risk_score              NUMERIC(5,2)    NULL,   -- Internal; hidden from customer
    risk_level              VARCHAR(12)     NULL,   -- LOW|MEDIUM|HIGH|VERY_HIGH; hidden
    status                  VARCHAR(30)     NOT NULL,
                            -- PENDING_PAYMENT | PENDING_REVIEW | PENDING_UW
                            -- UNDER_REVIEW | ACTIVE | EXPIRED | CANCELLED
                            -- CANCELLATION_REQUESTED | REJECTED | LAPSED
    coverage_details        JSONB           NULL,
                            -- Locked at issuance: {coverages:[...], addons:[...]}
    premium_breakdown       JSONB           NULL,
                            -- Locked at issuance: same structure as quotes.premium_breakdown
    issue_date              TIMESTAMPTZ     NULL,
    expiry_date             DATE            NULL,
    cancellation_date       TIMESTAMPTZ     NULL,
    cancellation_reason     TEXT            NULL,
    parent_policy_id        UUID            NULL,   -- For renewals
    renewal_count           INT             NOT NULL DEFAULT 0,
    payment_reference       VARCHAR(100)    NULL,
    payment_recorded_at     TIMESTAMPTZ     NULL,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_by              UUID            NULL,
    version                 BIGINT          NOT NULL DEFAULT 0,

    CONSTRAINT pk_policies PRIMARY KEY (id),
    CONSTRAINT uq_policy_number UNIQUE (policy_number),
    CONSTRAINT chk_policy_status CHECK (status IN (
        'PENDING_PAYMENT','PENDING_REVIEW','PENDING_UW',
        'UNDER_REVIEW','ACTIVE','EXPIRED','CANCELLED',
        'CANCELLATION_REQUESTED','REJECTED','LAPSED'
    )),
    CONSTRAINT fk_policies_quote FOREIGN KEY (quote_id) REFERENCES ins_policy.quotes (id),
    CONSTRAINT fk_policies_parent FOREIGN KEY (parent_policy_id) REFERENCES ins_policy.policies (id)
);

CREATE INDEX idx_policies_customer     ON ins_policy.policies (customer_id, status);
CREATE INDEX idx_policies_plan         ON ins_policy.policies (plan_id, plan_code);
CREATE INDEX idx_policies_expiry       ON ins_policy.policies (expiry_date, status) WHERE status = 'ACTIVE';
CREATE INDEX idx_policies_pending_rev  ON ins_policy.policies (status) WHERE status = 'PENDING_REVIEW';
CREATE INDEX idx_policies_pending_uw   ON ins_policy.policies (status) WHERE status = 'PENDING_UW';
CREATE INDEX idx_policies_coverage_gin ON ins_policy.policies USING GIN (coverage_details)
    WHERE coverage_details IS NOT NULL;

CREATE TRIGGER trg_policies_updated_at
    BEFORE UPDATE ON ins_policy.policies
    FOR EACH ROW EXECUTE FUNCTION ins_common.set_updated_at();

-- =============================================================================
-- policy_snapshots
-- Immutable snapshot at each lifecycle event. Claims service ALWAYS reads
-- coverage terms from here — never from the live policies table.
-- snapshot_data: complete policy state including coverage_details, travelers,
--   premium_breakdown, and plan/rule version identifiers used at issuance.
-- =============================================================================
CREATE TABLE ins_policy.policy_snapshots (
    id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
    policy_id           UUID            NOT NULL,
    snapshot_version    INT             NOT NULL DEFAULT 1,
    snapshot_type       VARCHAR(20)     NOT NULL,
                        -- ISSUANCE | ENDORSEMENT | RENEWAL | CANCELLATION
    snapshot_data       JSONB           NOT NULL,
                        -- Full policy state: coverage_details, travelers, premium_breakdown,
                        -- plan_version, rule_versions used, risk_score (internal)
    snapshotted_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    snapshotted_by      UUID            NULL,

    CONSTRAINT pk_policy_snapshots PRIMARY KEY (id),
    CONSTRAINT uq_ps_policy_version UNIQUE (policy_id, snapshot_version),
    CONSTRAINT chk_ps_type CHECK (snapshot_type IN ('ISSUANCE','ENDORSEMENT','RENEWAL','CANCELLATION')),
    CONSTRAINT fk_ps_policy FOREIGN KEY (policy_id) REFERENCES ins_policy.policies (id)
);

CREATE INDEX idx_ps_policy_id    ON ins_policy.policy_snapshots (policy_id);
CREATE INDEX idx_ps_snapshot_gin ON ins_policy.policy_snapshots USING GIN (snapshot_data);

-- Immutable: no updates allowed
CREATE TRIGGER trg_policy_snapshots_immutable
    BEFORE UPDATE ON ins_policy.policy_snapshots
    FOR EACH ROW EXECUTE FUNCTION ins_common.prevent_update();

-- =============================================================================
-- policy_agent_bindings
-- Records which agent bound a policy and the resulting commission.
-- Absorbs agent_commissions (1:1 relationship — one binding + one commission per policy).
-- commission_status lifecycle: PENDING → APPROVED → PAID | CANCELLED
-- Agent-issued policies must also create a ROLE_CUSTOMER user if one doesn't exist.
-- =============================================================================
CREATE TABLE ins_policy.policy_agent_bindings (
    id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
    policy_id           UUID            NOT NULL,
    agent_user_id       UUID            NOT NULL,
    agent_code          VARCHAR(50)     NOT NULL,
                        -- Denormalized for commission reporting
    bound_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    commission_rate     NUMERIC(5,2)    NOT NULL,
                        -- Percentage locked at binding time
    net_premium         DECIMAL(12,2)   NOT NULL,
    commission_amount   DECIMAL(12,2)   NOT NULL,
                        -- = net_premium × commission_rate / 100
    currency            CHAR(3)         NOT NULL DEFAULT 'INR',
    commission_status   VARCHAR(20)     NOT NULL DEFAULT 'PENDING',
                        -- PENDING | APPROVED | PAID | CANCELLED
    approved_by         UUID            NULL,
    approved_at         TIMESTAMPTZ     NULL,
    paid_at             TIMESTAMPTZ     NULL,
    payment_reference   VARCHAR(100)    NULL,
    notes               TEXT            NULL,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_policy_agent_bindings PRIMARY KEY (id),
    CONSTRAINT uq_pab_policy UNIQUE (policy_id),
    CONSTRAINT chk_pab_commission_status CHECK (
        commission_status IN ('PENDING','APPROVED','PAID','CANCELLED')
    ),
    CONSTRAINT chk_pab_commission_amount CHECK (commission_amount >= 0),
    CONSTRAINT fk_pab_policy FOREIGN KEY (policy_id) REFERENCES ins_policy.policies (id)
);

CREATE INDEX idx_pab_agent   ON ins_policy.policy_agent_bindings (agent_user_id, commission_status);
CREATE INDEX idx_pab_pending ON ins_policy.policy_agent_bindings (agent_user_id)
    WHERE commission_status IN ('PENDING','APPROVED');

CREATE TRIGGER trg_pab_updated_at
    BEFORE UPDATE ON ins_policy.policy_agent_bindings
    FOR EACH ROW EXECUTE FUNCTION ins_common.set_updated_at();
