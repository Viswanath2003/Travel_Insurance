-- =============================================================================
-- V02__auth_schema.sql
-- Schema: ins_auth
-- Service: auth-service
-- Description: Identity, sessions, and role reference data.
--
-- DESIGN (25-table target):
--   + roles           — reference table; 7 roles, no ADMIN, single UNDERWRITER
--   + users           — single table for all roles; customer PII columns nullable
--                       for non-customer users; single role column (no M:M)
--   + user_sessions   — JWT refresh token store only (no OTP, no password_history)
--
-- Removed vs previous schema:
--   - customer_profiles   → PII columns merged into users (nullable)
--   - profile_change_requests → pending_profile_changes JSONB in users
--   - permissions / role_permissions / user_roles → single role column in users
--   - otp_tokens          → OTP login removed; forgot-password via email link only
--   - password_history    → simplified (can be added back via platform config)
--
-- Domain-based staff login enforced in auth-service:
--   staff email must match *.<role-slug>@policypilot.com
--   ROLE_CUSTOMER users may use any email domain (self-registered or agent-bound)
-- =============================================================================

SET search_path = ins_auth, public;

-- =============================================================================
-- roles
-- Role reference table. role_code matches Spring Security authority strings.
-- 7 roles: CUSTOMER, AGENT, UNDERWRITER, CLAIMS_OFFICER, FIELD_OFFICER,
--          FINANCE, RELATIONSHIP_MANAGER  (ADMIN removed; UW L1/L2 collapsed).
-- =============================================================================
CREATE TABLE ins_auth.roles (
    id              UUID            NOT NULL DEFAULT gen_random_uuid(),
    role_code       VARCHAR(50)     NOT NULL,
                    -- ROLE_CUSTOMER | ROLE_AGENT | ROLE_UNDERWRITER
                    -- ROLE_CLAIMS_OFFICER | ROLE_FIELD_OFFICER
                    -- ROLE_FINANCE | ROLE_RELATIONSHIP_MANAGER
    role_name       VARCHAR(100)    NOT NULL,
    portal_path     VARCHAR(200)    NULL,
                    -- Relative path to the portal served for this role
                    -- e.g. portals/underwriter/index.html
    description     TEXT            NULL,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_roles PRIMARY KEY (id),
    CONSTRAINT uq_roles_code UNIQUE (role_code),
    CONSTRAINT chk_roles_code CHECK (role_code IN (
        'ROLE_CUSTOMER','ROLE_AGENT','ROLE_UNDERWRITER',
        'ROLE_CLAIMS_OFFICER','ROLE_FIELD_OFFICER',
        'ROLE_FINANCE','ROLE_RELATIONSHIP_MANAGER'
    ))
);

CREATE TRIGGER trg_roles_updated_at
    BEFORE UPDATE ON ins_auth.roles
    FOR EACH ROW EXECUTE FUNCTION ins_common.set_updated_at();

-- =============================================================================
-- users
-- Single unified user table for all 7 roles.
-- Customer PII columns are NULL for non-customer users.
-- Each user has exactly one role (column FK, not M:M).
-- pending_profile_changes: JSONB diff of a customer's requested PII changes;
--   underwriter reviews and approves — removes need for a separate table.
-- failed_login_attempts / locked_until: brute-force lockout without OTP.
-- =============================================================================
CREATE TABLE ins_auth.users (
    id                          UUID            NOT NULL DEFAULT gen_random_uuid(),
    email                       VARCHAR(150)    NOT NULL,
    full_name                   VARCHAR(120)    NOT NULL,
    password_hash               VARCHAR(255)    NOT NULL,
    role                        VARCHAR(50)     NOT NULL,
                                -- FK to roles.role_code (denormalized for fast JWT claim lookup)
    status                      VARCHAR(30)     NOT NULL DEFAULT 'ACTIVE',
                                -- ACTIVE | INACTIVE | LOCKED
    failed_login_attempts       SMALLINT        NOT NULL DEFAULT 0,
    locked_until                TIMESTAMPTZ     NULL,
    last_login_at               TIMESTAMPTZ     NULL,
    profile_photo_path          VARCHAR(500)    NULL,

    -- Customer PII (NULL for all non-ROLE_CUSTOMER users) --
    mobile                      VARCHAR(20)     NULL,
    customer_type               VARCHAR(20)     NULL,
                                -- INDIVIDUAL | CORPORATE  (NULL for staff)
    date_of_birth               DATE            NULL,
    gender                      VARCHAR(25)     NULL,
                                -- MALE | FEMALE | OTHER | PREFER_NOT_TO_SAY
    nationality                 CHAR(2)         NULL,     -- ISO 3166-1 alpha-2
    passport_number             VARCHAR(20)     NULL,
    passport_expiry_date        DATE            NULL,
    address_line1               VARCHAR(200)    NULL,
    address_line2               VARCHAR(200)    NULL,
    city                        VARCHAR(100)    NULL,
    state_province              VARCHAR(100)    NULL,
    postal_code                 VARCHAR(20)     NULL,
    country_code                CHAR(2)         NULL,     -- ISO 3166-1 alpha-2
    emergency_contact_name      VARCHAR(100)    NULL,
    emergency_contact_phone     VARCHAR(20)     NULL,
    occupation                  VARCHAR(100)    NULL,
    annual_income_band          VARCHAR(30)     NULL,
                                -- BELOW_300K | 300K_TO_1M | 1M_TO_3M | ABOVE_3M
    pending_profile_changes     JSONB           NULL,
                                -- [{field, old_value, new_value}] — awaits underwriter approval

    created_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_by                  UUID            NULL,
                                -- UUID of agent who created a customer account
    version                     BIGINT          NOT NULL DEFAULT 0,

    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT fk_users_role FOREIGN KEY (role) REFERENCES ins_auth.roles (role_code),
    CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE','INACTIVE','LOCKED')),
    CONSTRAINT chk_users_customer_type CHECK (
        customer_type IN ('INDIVIDUAL','CORPORATE') OR customer_type IS NULL
    ),
    CONSTRAINT chk_users_gender CHECK (
        gender IN ('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY') OR gender IS NULL
    ),
    CONSTRAINT chk_users_income_band CHECK (
        annual_income_band IN ('BELOW_300K','300K_TO_1M','1M_TO_3M','ABOVE_3M')
        OR annual_income_band IS NULL
    )
);

CREATE INDEX idx_users_role   ON ins_auth.users (role);
CREATE INDEX idx_users_status ON ins_auth.users (status);
CREATE INDEX idx_users_mobile ON ins_auth.users (mobile) WHERE mobile IS NOT NULL;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON ins_auth.users
    FOR EACH ROW EXECUTE FUNCTION ins_common.set_updated_at();

-- =============================================================================
-- user_sessions
-- Refresh token store for stateless JWT auth. Access tokens are not persisted.
-- refresh_token_hash: SHA-256 of the token (never store raw).
-- No OTP columns — login is email + password only; forgot-password via email link.
-- =============================================================================
CREATE TABLE ins_auth.user_sessions (
    id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
    user_id             UUID            NOT NULL,
    refresh_token_hash  VARCHAR(255)    NOT NULL,
    device_info         VARCHAR(500)    NULL,
    ip_address          VARCHAR(45)     NULL,     -- supports IPv6
    issued_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    expires_at          TIMESTAMPTZ     NOT NULL,
    revoked_at          TIMESTAMPTZ     NULL,
    is_revoked          BOOLEAN         NOT NULL DEFAULT FALSE,

    CONSTRAINT pk_user_sessions PRIMARY KEY (id),
    CONSTRAINT fk_us_user FOREIGN KEY (user_id) REFERENCES ins_auth.users (id) ON DELETE CASCADE
);

CREATE INDEX idx_us_user_active ON ins_auth.user_sessions (user_id, is_revoked) WHERE is_revoked = FALSE;
CREATE INDEX idx_us_expires     ON ins_auth.user_sessions (expires_at);
CREATE INDEX idx_us_token_hash  ON ins_auth.user_sessions (refresh_token_hash);
