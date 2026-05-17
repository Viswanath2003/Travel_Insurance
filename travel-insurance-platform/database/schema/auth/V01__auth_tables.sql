-- =============================================================================
-- V01__auth_tables.sql
-- Schema: ins_auth
-- Service: auth-service
-- Description: Identity, session management, RBAC
-- =============================================================================

USE ins_auth;

-- =============================================================================
-- users
-- Core user account table. Supports all roles (Customer, Admin, Underwriter, etc.)
-- =============================================================================
CREATE TABLE users (
    id                      VARCHAR(36)     NOT NULL,
    username                VARCHAR(50)     NOT NULL,
    email                   VARCHAR(100)    NOT NULL,
    mobile                  VARCHAR(20)     NULL,
    full_name               VARCHAR(100)    NOT NULL,
    password_hash           VARCHAR(255)    NOT NULL,
    customer_type           VARCHAR(20)     NOT NULL DEFAULT 'INDIVIDUAL',
                                            -- INDIVIDUAL | CORPORATE
    status                  VARCHAR(30)     NOT NULL DEFAULT 'PENDING_VERIFICATION',
                                            -- ACTIVE | INACTIVE | LOCKED | PENDING_VERIFICATION
    failed_login_attempts   TINYINT         NOT NULL DEFAULT 0,
    locked_until            DATETIME        NULL,
    last_login_at           DATETIME        NULL,
    email_verified          TINYINT(1)      NOT NULL DEFAULT 0,
    mobile_verified         TINYINT(1)      NOT NULL DEFAULT 0,
    created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by              VARCHAR(36)     NULL,
    version                 BIGINT          NOT NULL DEFAULT 0,

    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE','INACTIVE','LOCKED','PENDING_VERIFICATION')),
    CONSTRAINT chk_users_customer_type CHECK (customer_type IN ('INDIVIDUAL','CORPORATE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_users_status ON users (status);
CREATE INDEX idx_users_mobile ON users (mobile);

-- =============================================================================
-- roles
-- Role definitions. is_system_role prevents Admin from accidentally deleting
-- core roles like ROLE_ADMIN.
-- =============================================================================
CREATE TABLE roles (
    id              VARCHAR(36)     NOT NULL,
    role_code       VARCHAR(50)     NOT NULL,
                                    -- ROLE_CUSTOMER | ROLE_AGENT | ROLE_UNDERWRITER_L1
                                    -- ROLE_UNDERWRITER_L2 | ROLE_CLAIMS_OFFICER
                                    -- ROLE_FIELD_OFFICER | ROLE_FINANCE | ROLE_ADMIN | ROLE_SUPERADMIN
    role_name       VARCHAR(100)    NOT NULL,
    description     TEXT            NULL,
    is_system_role  TINYINT(1)      NOT NULL DEFAULT 0,
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_roles PRIMARY KEY (id),
    CONSTRAINT uq_roles_code UNIQUE (role_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- permissions
-- Fine-grained permission codes. Domain groups permissions for Admin UI display.
-- =============================================================================
CREATE TABLE permissions (
    id                  VARCHAR(36)     NOT NULL,
    permission_code     VARCHAR(100)    NOT NULL,
                                        -- e.g., POLICY_READ, UW_APPROVE, CLAIM_DECIDE
    permission_name     VARCHAR(150)    NOT NULL,
    domain              VARCHAR(50)     NOT NULL,
                                        -- POLICY | UNDERWRITING | CLAIMS | FIELD | FINANCE
                                        -- ADMIN | REPORTING | DOCUMENT
    description         TEXT            NULL,
    is_active           TINYINT(1)      NOT NULL DEFAULT 1,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_permissions PRIMARY KEY (id),
    CONSTRAINT uq_permissions_code UNIQUE (permission_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_permissions_domain ON permissions (domain);

-- =============================================================================
-- role_permissions
-- Many-to-many: which permissions each role has.
-- Admin manages this via RBAC matrix (UI-039).
-- =============================================================================
CREATE TABLE role_permissions (
    id              VARCHAR(36)     NOT NULL,
    role_id         VARCHAR(36)     NOT NULL,
    permission_id   VARCHAR(36)     NOT NULL,
    granted_by      VARCHAR(36)     NULL,
    granted_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_role_permissions PRIMARY KEY (id),
    CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles (id),
    CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_rp_role_id ON role_permissions (role_id);
CREATE INDEX idx_rp_permission_id ON role_permissions (permission_id);

-- =============================================================================
-- user_roles
-- Many-to-many: which roles a user has.
-- A user can have multiple roles (e.g., Admin can also be a Finance Officer).
-- =============================================================================
CREATE TABLE user_roles (
    id              VARCHAR(36)     NOT NULL,
    user_id         VARCHAR(36)     NOT NULL,
    role_id         VARCHAR(36)     NOT NULL,
    assigned_by     VARCHAR(36)     NULL,
    assigned_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,

    CONSTRAINT pk_user_roles PRIMARY KEY (id),
    CONSTRAINT uq_user_role UNIQUE (user_id, role_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_ur_user_id ON user_roles (user_id);
CREATE INDEX idx_ur_role_id ON user_roles (role_id);

-- =============================================================================
-- user_sessions
-- Refresh token store. Access tokens are stateless (JWT); only refresh tokens
-- are persisted here for revocation support.
-- =============================================================================
CREATE TABLE user_sessions (
    id                      VARCHAR(36)     NOT NULL,
    user_id                 VARCHAR(36)     NOT NULL,
    refresh_token_hash      VARCHAR(255)    NOT NULL,
    device_info             VARCHAR(500)    NULL,
    ip_address              VARCHAR(45)     NULL,
    issued_at               DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at              DATETIME        NOT NULL,
    revoked_at              DATETIME        NULL,
    is_revoked              TINYINT(1)      NOT NULL DEFAULT 0,

    CONSTRAINT pk_user_sessions PRIMARY KEY (id),
    CONSTRAINT fk_us_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_us_user_active ON user_sessions (user_id, is_revoked);
CREATE INDEX idx_us_expires ON user_sessions (expires_at);

-- =============================================================================
-- otp_tokens
-- OTP for forgot-password, email/mobile verification, profile updates.
-- OTP value stored as BCrypt hash — never plaintext.
-- =============================================================================
CREATE TABLE otp_tokens (
    id          VARCHAR(36)     NOT NULL,
    user_id     VARCHAR(36)     NOT NULL,
    otp_hash    VARCHAR(255)    NOT NULL,
    purpose     VARCHAR(50)     NOT NULL,
                                -- FORGOT_PASSWORD | EMAIL_VERIFY | MOBILE_VERIFY | PROFILE_UPDATE
    expires_at  DATETIME        NOT NULL,
    used_at     DATETIME        NULL,
    is_used     TINYINT(1)      NOT NULL DEFAULT 0,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_otp_tokens PRIMARY KEY (id),
    CONSTRAINT chk_otp_purpose CHECK (purpose IN ('FORGOT_PASSWORD','EMAIL_VERIFY','MOBILE_VERIFY','PROFILE_UPDATE')),
    CONSTRAINT fk_otp_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_otp_user_valid ON otp_tokens (user_id, is_used, expires_at);

-- =============================================================================
-- password_history
-- Prevents reuse of last N passwords. Checked during reset and profile update.
-- =============================================================================
CREATE TABLE password_history (
    id              VARCHAR(36)     NOT NULL,
    user_id         VARCHAR(36)     NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    changed_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_password_history PRIMARY KEY (id),
    CONSTRAINT fk_ph_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_ph_user_id ON password_history (user_id, changed_at);
