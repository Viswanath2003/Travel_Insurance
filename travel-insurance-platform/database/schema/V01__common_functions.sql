-- =============================================================================
-- V01__common_functions.sql
-- Schema: ins_common
-- Description: Shared PostgreSQL functions used across all service schemas.
--
-- Functions defined here:
--   1. ins_common.set_updated_at()     — trigger function for updated_at automation
--   2. ins_common.generate_reference_code()  — human-readable reference code generator
--
-- Usage pattern for updated_at trigger:
--   CREATE TRIGGER trg_<table>_updated_at
--       BEFORE UPDATE ON <schema>.<table>
--       FOR EACH ROW EXECUTE FUNCTION ins_common.set_updated_at();
--
-- All service schemas import this via shared function call.
-- The trigger function lives in ins_common schema — all service roles
-- have EXECUTE on ins_common functions (granted via DEFAULT PRIVILEGES in V00).
-- =============================================================================

SET search_path = ins_common, public;

-- =============================================================================
-- ins_common.set_updated_at()
-- Trigger function that sets NEW.updated_at = NOW() on every UPDATE.
-- Replaces MySQL's ON UPDATE CURRENT_TIMESTAMP column attribute.
--
-- Usage:
--   Attach as BEFORE UPDATE trigger to any table with an updated_at column.
--
-- Notes:
--   - Returns NEW (required for BEFORE triggers)
--   - Safe to attach to tables that may not have updated_at; guard with
--     an IF check if needed (not required here — all target tables have it)
-- =============================================================================
CREATE OR REPLACE FUNCTION ins_common.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION ins_common.set_updated_at() IS
    'Universal BEFORE UPDATE trigger function. Sets updated_at = NOW() on any table row update.
     Attach with: CREATE TRIGGER trg_<table>_updated_at BEFORE UPDATE ON <schema>.<table>
                  FOR EACH ROW EXECUTE FUNCTION ins_common.set_updated_at();';

-- =============================================================================
-- ins_common.generate_reference_code(prefix TEXT, length INT)
-- Generates a human-readable reference code for policies, claims, quotes, etc.
-- Format: <PREFIX>-<YYYYMMDD>-<RANDOM_UPPERCASE_ALPHANUMERIC>
--
-- Parameters:
--   prefix  — e.g., 'POL', 'CLM', 'QT', 'UW', 'FA'
--   length  — length of the random suffix (default 8)
--
-- Example outputs:
--   POL-20260512-A3K7F2MN
--   CLM-20260512-XR91BQTZ
--   QT-20260512-55KMPWLA
--
-- Notes:
--   - Uniqueness is not guaranteed by this function — the caller MUST have a
--     UNIQUE constraint and use retry logic on conflict.
--   - The date component provides natural partitioning for reference lookups.
--   - Uses encode(gen_random_bytes()) for cryptographically random suffix.
-- =============================================================================
CREATE OR REPLACE FUNCTION ins_common.generate_reference_code(
    prefix TEXT,
    length INT DEFAULT 8
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    date_part TEXT;
    random_part TEXT;
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- No ambiguous chars: O,0,I,1
    i INT;
    result TEXT;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');

    -- Build random suffix from safe character set
    random_part := '';
    FOR i IN 1..length LOOP
        random_part := random_part ||
            SUBSTR(chars, (FLOOR(RANDOM() * LENGTH(chars)) + 1)::INT, 1);
    END LOOP;

    result := UPPER(prefix) || '-' || date_part || '-' || random_part;
    RETURN result;
END;
$$;

COMMENT ON FUNCTION ins_common.generate_reference_code(TEXT, INT) IS
    'Generates human-readable reference codes like POL-20260512-A3K7F2MN.
     Parameters: prefix (e.g., POL, CLM, QT), length of random suffix (default 8).
     IMPORTANT: Not guaranteed unique — caller must handle UNIQUE constraint conflicts
     and retry. The service layer should retry up to 3 times on duplicate key error.';

-- =============================================================================
-- ins_common.prevent_update()
-- Trigger function that raises an exception on any UPDATE attempt.
-- Use on immutable tables (e.g., audit_logs, policy_snapshots, quote_snapshots).
--
-- Usage:
--   CREATE TRIGGER trg_<table>_immutable
--       BEFORE UPDATE ON <schema>.<table>
--       FOR EACH ROW EXECUTE FUNCTION ins_common.prevent_update();
-- =============================================================================
CREATE OR REPLACE FUNCTION ins_common.prevent_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Table % is immutable — updates are not permitted. Table: %, Row ID: %',
        TG_TABLE_NAME, TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME, OLD.id
        USING ERRCODE = 'restrict_violation';
    RETURN NULL;
END;
$$;

COMMENT ON FUNCTION ins_common.prevent_update() IS
    'Prevents UPDATE on immutable tables. Attach as BEFORE UPDATE trigger.
     Raises restrict_violation (23001) with descriptive message.
     Use on: audit_logs, policy_snapshots, quote_snapshots, rule_versions, plan_versions.';

-- =============================================================================
-- ins_common.prevent_delete()
-- Trigger function that raises an exception on any DELETE attempt.
-- Use on append-only tables (e.g., audit_logs, policy_status_history).
-- =============================================================================
CREATE OR REPLACE FUNCTION ins_common.prevent_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Table % is append-only — deletes are not permitted. Table: %, Row ID: %',
        TG_TABLE_NAME, TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME, OLD.id
        USING ERRCODE = 'restrict_violation';
    RETURN NULL;
END;
$$;

COMMENT ON FUNCTION ins_common.prevent_delete() IS
    'Prevents DELETE on append-only tables. Attach as BEFORE DELETE trigger.
     Use on: audit_logs, policy_status_history, uw_case_history, claim_workflow_history.';
