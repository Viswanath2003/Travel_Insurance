-- =============================================================================
-- V09__notification_tables.sql
-- Schema: ins_notification
-- Service: notification-service
-- Description: Event-driven notification system. Supports in-app and email
--              (mock/log in local deployment). Template-driven message composition.
-- =============================================================================

USE ins_notification;

-- =============================================================================
-- notification_templates
-- Maps event codes to message templates.
-- title_template and body_template use {{variable}} placeholders resolved
-- at trigger time from the event payload.
-- channels: comma-separated delivery channels (IN_APP,EMAIL)
-- =============================================================================
CREATE TABLE notification_templates (
    id              VARCHAR(36)     NOT NULL,
    event_code      VARCHAR(100)    NOT NULL,
    event_name      VARCHAR(200)    NOT NULL,
    title_template  VARCHAR(300)    NOT NULL,
    body_template   TEXT            NOT NULL,
    channels        VARCHAR(100)    NOT NULL DEFAULT 'IN_APP',
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_notification_templates PRIMARY KEY (id),
    CONSTRAINT uq_nt_event_code UNIQUE (event_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- notifications
-- In-app notification store. One row per recipient per event occurrence.
-- is_read / read_at track when the user viewed the notification.
-- reference_type + reference_id enable deep-link navigation from notification
-- (e.g., click on "Policy Activated" → navigate to policy detail page).
-- =============================================================================
CREATE TABLE notifications (
    id              VARCHAR(36)     NOT NULL,
    user_id         VARCHAR(36)     NOT NULL,
    event_code      VARCHAR(100)    NOT NULL,
    title           VARCHAR(300)    NOT NULL,
    body            TEXT            NOT NULL,
    reference_id    VARCHAR(36)     NULL,
    reference_type  VARCHAR(50)     NULL,
                                    -- POLICY | CLAIM | UW_CASE | QUOTE | FIELD_ASSIGNMENT
    is_read         TINYINT(1)      NOT NULL DEFAULT 0,
    read_at         DATETIME        NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_notifications PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_notif_user_unread ON notifications (user_id, is_read);
CREATE INDEX idx_notif_user_created ON notifications (user_id, created_at);
CREATE INDEX idx_notif_reference ON notifications (reference_type, reference_id);

-- =============================================================================
-- notification_delivery_log
-- Tracks delivery status per channel per notification.
-- In local deployment, EMAIL channel writes to log file.
-- status=FAILED entries can be retried by a scheduled task.
-- =============================================================================
CREATE TABLE notification_delivery_log (
    id                  VARCHAR(36)     NOT NULL,
    notification_id     VARCHAR(36)     NOT NULL,
    channel             VARCHAR(10)     NOT NULL,
                                        -- IN_APP | EMAIL | SMS
    status              VARCHAR(10)     NOT NULL DEFAULT 'PENDING',
                                        -- PENDING | SENT | FAILED
    delivery_address    VARCHAR(200)    NULL,
    sent_at             DATETIME        NULL,
    failure_reason      TEXT            NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_notification_delivery_log PRIMARY KEY (id),
    CONSTRAINT chk_ndl_channel CHECK (channel IN ('IN_APP','EMAIL','SMS')),
    CONSTRAINT chk_ndl_status CHECK (status IN ('PENDING','SENT','FAILED')),
    CONSTRAINT fk_ndl_notification FOREIGN KEY (notification_id) REFERENCES notifications (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_ndl_notification_id ON notification_delivery_log (notification_id);
CREATE INDEX idx_ndl_status ON notification_delivery_log (status, created_at);
