-- =============================================================================
-- V10__notification_schema.sql
-- Schema: ins_notification
-- Service: notification-service
-- Description: RBAC-based unified notification store.
--              All portals read their own role's unread notifications.
--              Delivery log and templates are merged into one table.
--
-- DESIGN (25-table target — 1 table here):
--   + notifications — RBAC-keyed; target_role broadcast or target_user_id specific.
--                     Delivery tracking inline (delivery_channel, delivered_at).
--                     Template content stored inline (no separate templates table).
--
-- Removed vs previous schema:
--   - notification_templates    → template fields inlined or dropped (content stored directly)
--   - notification_delivery_log → delivery fields inlined in notifications row
-- =============================================================================

SET search_path = ins_notification, public;

-- =============================================================================
-- notifications
-- Single table for all platform notifications.
-- RBAC routing:
--   target_role: broadcast to all users with that role (e.g., ROLE_UNDERWRITER)
--   target_user_id: specific user notification (customer-specific alerts)
--   target_user_email: denormalized for fast email delivery routing
-- Delivery lifecycle (for non-IN_APP channels):
--   delivery_channel: IN_APP | EMAIL | SMS
--   delivery_status: PENDING | SENT | DELIVERED | FAILED
-- Event-driven: entity_type + entity_id link to the triggering entity.
-- =============================================================================
CREATE TABLE ins_notification.notifications (
    id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
    notification_ref    VARCHAR(30)     NOT NULL,
    event_code          VARCHAR(80)     NOT NULL,
                        -- POLICY_ACTIVE | POLICY_FORWARDED | POLICY_APPROVED
                        -- POLICY_REJECTED | CLAIM_SUBMITTED | CLAIM_APPROVED
                        -- CLAIM_SETTLED | FIELD_ASSIGNED | PREMIUM_RECEIVED
                        -- PROFILE_UPDATE_PENDING | RENEWAL_REMINDER | etc.
    title               VARCHAR(200)    NOT NULL,
    body                TEXT            NOT NULL,
    target_role         VARCHAR(50)     NOT NULL,
                        -- ROLE_CUSTOMER | ROLE_AGENT | ROLE_UNDERWRITER
                        -- ROLE_CLAIMS_OFFICER | ROLE_FIELD_OFFICER
                        -- ROLE_FINANCE | ROLE_RELATIONSHIP_MANAGER
    target_user_id      UUID            NULL,
                        -- Set for user-specific notifications (overrides role broadcast)
    target_user_email   VARCHAR(150)    NULL,
                        -- Denormalized for email delivery routing
    entity_type         VARCHAR(30)     NULL,
                        -- POLICY | CLAIM | UW_CASE | FIELD_INVESTIGATION | PAYMENT
    entity_id           UUID            NULL,
    entity_reference    VARCHAR(30)     NULL,
    priority            VARCHAR(10)     NOT NULL DEFAULT 'NORMAL',
                        -- LOW | NORMAL | HIGH | URGENT
    delivery_channel    VARCHAR(10)     NOT NULL DEFAULT 'IN_APP',
                        -- IN_APP | EMAIL | SMS
    delivery_status     VARCHAR(15)     NOT NULL DEFAULT 'PENDING',
                        -- PENDING | SENT | DELIVERED | FAILED
    delivered_at        TIMESTAMPTZ     NULL,
    failure_reason      TEXT            NULL,
    is_read             BOOLEAN         NOT NULL DEFAULT FALSE,
    read_at             TIMESTAMPTZ     NULL,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_notifications PRIMARY KEY (id),
    CONSTRAINT uq_notification_ref UNIQUE (notification_ref),
    CONSTRAINT chk_notif_priority CHECK (priority IN ('LOW','NORMAL','HIGH','URGENT')),
    CONSTRAINT chk_notif_channel CHECK (delivery_channel IN ('IN_APP','EMAIL','SMS')),
    CONSTRAINT chk_notif_delivery_status CHECK (delivery_status IN (
        'PENDING','SENT','DELIVERED','FAILED'
    )),
    CONSTRAINT chk_notif_role CHECK (target_role IN (
        'ROLE_CUSTOMER','ROLE_AGENT','ROLE_UNDERWRITER',
        'ROLE_CLAIMS_OFFICER','ROLE_FIELD_OFFICER',
        'ROLE_FINANCE','ROLE_RELATIONSHIP_MANAGER'
    ))
);

CREATE INDEX idx_notif_role    ON ins_notification.notifications (target_role);
CREATE INDEX idx_notif_user    ON ins_notification.notifications (target_user_id)
    WHERE target_user_id IS NOT NULL;
CREATE INDEX idx_notif_unread  ON ins_notification.notifications (target_role, is_read)
    WHERE is_read = FALSE;
CREATE INDEX idx_notif_entity  ON ins_notification.notifications (entity_type, entity_id)
    WHERE entity_id IS NOT NULL;
CREATE INDEX idx_notif_created ON ins_notification.notifications (created_at DESC);
CREATE INDEX idx_notif_pending_delivery ON ins_notification.notifications (delivery_channel, delivery_status)
    WHERE delivery_status = 'PENDING' AND delivery_channel != 'IN_APP';
