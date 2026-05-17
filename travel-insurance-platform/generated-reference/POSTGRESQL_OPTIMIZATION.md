# PostgreSQL Optimization Guide — Travel Insurance Platform

**Generated:** 2026-05-12  
**PostgreSQL Target:** 14+  
**Database:** `ins_travelinsurance`

---

## 1. INDEX STRATEGY

### 1.1 Index Philosophy

| Scenario | Index Type | Rationale |
|----------|-----------|-----------|
| UUID primary keys | B-tree (auto, PRIMARY KEY) | Standard equality lookup |
| Foreign keys (UUID) | B-tree (explicit) | PostgreSQL does NOT auto-index FKs |
| JSONB columns | GIN (`jsonb_ops`) | Enables `@>`, `?`, `?|`, `?&` operators |
| Low-cardinality filtered queries | Partial B-tree | WHERE clause narrows index size dramatically |
| Full-text search candidates | GIN (`tsvector`) | If text search added later |
| Range scans (TIMESTAMPTZ, NUMERIC) | B-tree | Default, fine for range predicates |
| High-update columns | Not indexed unless queried frequently | Write amplification cost |

### 1.2 Critical FK Indexes Missing by Default

PostgreSQL does not automatically create indexes on foreign key columns. The following FK indexes must be created explicitly (already included in schema DDL, documented here for verification):

```sql
-- ins_auth
CREATE INDEX idx_sessions_user_id       ON ins_auth.sessions(user_id);
CREATE INDEX idx_otp_requests_user_id   ON ins_auth.otp_requests(user_id);
CREATE INDEX idx_customer_profiles_user ON ins_auth.customer_profiles(user_id);
CREATE INDEX idx_profile_requests_user  ON ins_auth.profile_change_requests(user_id);

-- ins_product
CREATE INDEX idx_plan_coverages_plan_id  ON ins_product.plan_coverages(plan_id);
CREATE INDEX idx_plan_coverages_cov_id   ON ins_product.plan_coverages(coverage_type_id);
CREATE INDEX idx_plan_addons_plan_id     ON ins_product.plan_addons(plan_id);
CREATE INDEX idx_zone_countries_zone_id  ON ins_product.zone_countries(zone_id);

-- ins_rule
CREATE INDEX idx_rcg_rule_id            ON ins_rule.rule_condition_groups(rule_id);
CREATE INDEX idx_rc_group_id            ON ins_rule.rule_conditions(group_id);
CREATE INDEX idx_ra_rule_id             ON ins_rule.rule_actions(rule_id);
CREATE INDEX idx_rel_rule_id            ON ins_rule.rule_execution_logs(rule_id);
CREATE INDEX idx_rel_entity             ON ins_rule.rule_execution_logs(entity_type, entity_id);

-- ins_policy
CREATE INDEX idx_quotes_user_id         ON ins_policy.quotes(user_id);
CREATE INDEX idx_policies_quote_id      ON ins_policy.policies(quote_id);
CREATE INDEX idx_policies_user_id       ON ins_policy.policies(user_id);
CREATE INDEX idx_psh_policy_id          ON ins_policy.policy_status_history(policy_id);
CREATE INDEX idx_pab_policy_id          ON ins_policy.policy_agent_bindings(policy_id);
CREATE INDEX idx_pab_agent_id           ON ins_policy.policy_agent_bindings(agent_user_id);
CREATE INDEX idx_ac_policy_id           ON ins_policy.agent_commissions(policy_id);

-- ins_underwriting
CREATE INDEX idx_uw_cases_policy_id     ON ins_underwriting.uw_cases(policy_id);
CREATE INDEX idx_uw_history_case_id     ON ins_underwriting.uw_case_history(case_id);
CREATE INDEX idx_uw_notes_case_id       ON ins_underwriting.uw_case_notes(case_id);
CREATE INDEX idx_uw_cond_case_id        ON ins_underwriting.uw_conditions(case_id);

-- ins_claims
CREATE INDEX idx_claims_policy_id       ON ins_claims.claims(policy_id);
CREATE INDEX idx_claims_type_id         ON ins_claims.claims(claim_type_id);
CREATE INDEX idx_claim_docs_claim_id    ON ins_claims.claim_documents(claim_id);
CREATE INDEX idx_claim_wh_claim_id      ON ins_claims.claim_workflow_history(claim_id);
CREATE INDEX idx_claim_dec_claim_id     ON ins_claims.claim_decisions(claim_id);
CREATE INDEX idx_claim_notes_claim_id   ON ins_claims.claim_adjuster_notes(claim_id);
CREATE INDEX idx_claim_pay_claim_id     ON ins_claims.claim_payments(claim_id);

-- ins_field
CREATE INDEX idx_fa_claim_id            ON ins_field.field_assignments(claim_id);
CREATE INDEX idx_fa_officer_id          ON ins_field.field_assignments(assigned_officer_id);
CREATE INDEX idx_fr_assignment_id       ON ins_field.field_reports(assignment_id);
CREATE INDEX idx_fed_assignment_id      ON ins_field.field_evidence_documents(assignment_id);

-- ins_document
CREATE INDEX idx_dtv_template_id        ON ins_document.document_template_versions(template_id);
CREATE INDEX idx_gd_entity              ON ins_document.generated_documents(entity_type, entity_id);

-- ins_notification
CREATE INDEX idx_notif_user_id          ON ins_notification.notifications(target_user_id);
CREATE INDEX idx_notif_delivery_id      ON ins_notification.notification_delivery_log(notification_id);
```

---

## 2. PARTIAL INDEXES (HIGH-CARDINALITY FILTERS)

Partial indexes dramatically reduce index size and improve scan speed for rows matching a WHERE condition that is applied in almost every query:

```sql
-- Active sessions only (most queries only care about non-expired sessions)
CREATE INDEX idx_sessions_active
    ON ins_auth.sessions(user_id, expires_at)
    WHERE is_active = TRUE;

-- Active plans only
CREATE INDEX idx_plans_active
    ON ins_product.plans(plan_code)
    WHERE is_active = TRUE;

-- Active rule definitions only
CREATE INDEX idx_rules_active_priority
    ON ins_rule.rule_definitions(category, priority)
    WHERE is_active = TRUE;

-- Policies in pending state (dashboard queries)
CREATE INDEX idx_policies_pending
    ON ins_policy.policies(status, created_at)
    WHERE status IN ('PENDING_PAYMENT','PENDING_CO_REVIEW','PENDING_UW_L1','PENDING_UW_L2');

-- Active UW cases (one active case per policy constraint index)
CREATE UNIQUE INDEX idx_uw_cases_active_policy
    ON ins_underwriting.uw_cases(policy_id)
    WHERE is_active = TRUE;

-- Open claims (primary dashboard filter)
CREATE INDEX idx_claims_open
    ON ins_claims.claims(claim_type_id, priority, created_at)
    WHERE status NOT IN ('CLOSED','WITHDRAWN','REJECTED');

-- High-value claims (special handling queue)
CREATE INDEX idx_claims_high_value
    ON ins_claims.claims(status, created_at)
    WHERE is_high_value = TRUE;

-- Unread notifications (in-app notification badge)
CREATE INDEX idx_notifications_unread
    ON ins_notification.notifications(target_role, target_user_id, created_at)
    WHERE is_read = FALSE;

-- Current document template versions
CREATE UNIQUE INDEX idx_dtv_current
    ON ins_document.document_template_versions(template_id)
    WHERE is_current = TRUE;
```

---

## 3. GIN INDEXES ON JSONB COLUMNS

All JSONB columns require GIN indexes for efficient containment and key-existence queries:

```sql
-- ins_policy
CREATE INDEX idx_gin_quotes_details      ON ins_policy.quotes           USING GIN (quote_details);
CREATE INDEX idx_gin_quotes_risk         ON ins_policy.quotes           USING GIN (risk_factors);
CREATE INDEX idx_gin_policy_coverage     ON ins_policy.policies         USING GIN (coverage_details);
CREATE INDEX idx_gin_policy_snapshot     ON ins_policy.policy_snapshots USING GIN (snapshot_data);
CREATE INDEX idx_gin_policy_travelers    ON ins_policy.policies         USING GIN (traveler_details);

-- ins_underwriting
CREATE INDEX idx_gin_uw_scoring          ON ins_underwriting.uw_cases   USING GIN (scoring_details);

-- ins_claims
CREATE INDEX idx_gin_claims_metadata     ON ins_claims.claims           USING GIN (metadata);
CREATE INDEX idx_gin_claim_snapshot      ON ins_claims.claim_snapshots  USING GIN (snapshot_data);

-- ins_rule
CREATE INDEX idx_gin_rel_input           ON ins_rule.rule_execution_logs USING GIN (input_context);
CREATE INDEX idx_gin_rel_output          ON ins_rule.rule_execution_logs USING GIN (output_context);

-- ins_workflow
CREATE INDEX idx_gin_platform_config     ON ins_workflow.platform_configurations USING GIN (config_value jsonb_path_ops)
    WHERE value_type = 'JSON';

-- ins_document
CREATE INDEX idx_gin_gd_context          ON ins_document.generated_documents USING GIN (generation_context);

-- ins_audit
CREATE INDEX idx_gin_audit_before        ON ins_audit.audit_logs USING GIN (before_state);
CREATE INDEX idx_gin_audit_after         ON ins_audit.audit_logs USING GIN (after_state);
```

---

## 4. CONCURRENTLY INDEX CREATION (NON-BLOCKING)

When applying indexes to a live database (post-migration, no downtime), use `CONCURRENTLY`. Note: cannot be run inside a transaction block.

```sql
-- Example pattern for all production index creation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_policies_status_created
    ON ins_policy.policies(status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_claims_reference
    ON ins_claims.claims(claim_reference);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_policies_number
    ON ins_policy.policies(policy_number);

-- After bulk data load, rebuild all indexes non-concurrently (faster in maintenance window):
-- REINDEX TABLE CONCURRENTLY ins_policy.policies;
```

---

## 5. TABLE PARTITIONING

### 5.1 `ins_audit.audit_logs` — RANGE Partition by Month

```sql
-- Parent table (already defined in V11 DDL)
-- CREATE TABLE ins_audit.audit_logs (...) PARTITION BY RANGE (occurred_at);

-- Create monthly partitions (automate via pg_partman or cron)
CREATE TABLE ins_audit.audit_logs_2026_01
    PARTITION OF ins_audit.audit_logs
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE ins_audit.audit_logs_2026_02
    PARTITION OF ins_audit.audit_logs
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- ... repeat monthly

-- Drop old partitions for retention (e.g., keep 24 months):
-- DROP TABLE ins_audit.audit_logs_2024_01;  -- atomic, instant, no VACUUM needed
```

### 5.2 `ins_rule.rule_execution_logs` — RANGE Partition by Month

```sql
-- If volume exceeds 10M rows/month, partition rule_execution_logs similarly:
-- CREATE TABLE ins_rule.rule_execution_logs (...) PARTITION BY RANGE (executed_at);

-- Monthly partition creation follows same pattern as audit_logs above.
```

### 5.3 pg_partman Automation (Recommended)

```sql
-- Install pg_partman extension
CREATE EXTENSION IF NOT EXISTS pg_partman;

-- Set up automated partition management for audit_logs
SELECT partman.create_parent(
    p_parent_table => 'ins_audit.audit_logs',
    p_control      => 'occurred_at',
    p_type         => 'range',
    p_interval     => 'monthly',
    p_premake      => 3  -- pre-create 3 future partitions
);

-- Run maintenance (add to pg_cron or cron job):
-- SELECT partman.run_maintenance();
```

---

## 6. STATISTICS AND VACUUM TUNING

### 6.1 Per-Table VACUUM Settings for High-Write Tables

```sql
-- audit_logs: high insert volume, rarely updated
ALTER TABLE ins_audit.audit_logs SET (
    autovacuum_vacuum_scale_factor     = 0.01,  -- vacuum when 1% rows dead
    autovacuum_analyze_scale_factor    = 0.005, -- analyze when 0.5% new rows
    autovacuum_vacuum_cost_delay       = 2      -- ms delay between cost cycles
);

-- rule_execution_logs: high insert, no update
ALTER TABLE ins_rule.rule_execution_logs SET (
    autovacuum_vacuum_scale_factor     = 0.01,
    autovacuum_analyze_scale_factor    = 0.01
);

-- notifications: frequent inserts + updates (is_read flipped)
ALTER TABLE ins_notification.notifications SET (
    autovacuum_vacuum_scale_factor     = 0.05,
    autovacuum_analyze_scale_factor    = 0.02
);

-- policies: moderate writes, critical for planning
ALTER TABLE ins_policy.policies SET (
    autovacuum_analyze_scale_factor    = 0.01  -- keep statistics fresh
);
```

### 6.2 Statistics Target for JSONB Planning

```sql
-- Increase statistics target for JSONB columns used in WHERE/JOIN
ALTER TABLE ins_policy.policies
    ALTER COLUMN coverage_details SET STATISTICS 500;

ALTER TABLE ins_claims.claims
    ALTER COLUMN metadata SET STATISTICS 500;

ALTER TABLE ins_rule.rule_execution_logs
    ALTER COLUMN input_context SET STATISTICS 300;
```

---

## 7. CONNECTION POOLING (PgBouncer)

### 7.1 Recommended Pool Configuration

```ini
; pgbouncer.ini
[databases]
ins_travelinsurance = host=localhost port=5432 dbname=ins_travelinsurance

[pgbouncer]
pool_mode          = transaction       ; transaction pooling for stateless services
max_client_conn    = 500               ; total clients (all microservices)
default_pool_size  = 20               ; backend connections per database/user pair
min_pool_size      = 5
reserve_pool_size  = 5
server_lifetime    = 3600
server_idle_timeout = 600
```

### 7.2 Per-Service Connection Budget

| Service | Min Pool | Max Pool | Notes |
|---------|---------|---------|-------|
| policy-service | 5 | 20 | Moderate write volume |
| claims-service | 5 | 15 | Moderate read/write |
| rule-engine-service | 3 | 10 | Burst on quote generation |
| audit-service | 2 | 8 | INSERT-only, high volume |
| auth-service | 3 | 10 | Frequent session reads |
| notification-service | 2 | 8 | Async delivery |
| underwriting-service | 2 | 8 | Low volume |
| field-service | 1 | 5 | Low volume |
| document-service | 1 | 5 | Low volume |
| product-service | 2 | 5 | Mostly reads |
| report-service | 1 | 10 | Read-heavy, burst |

---

## 8. QUERY OPTIMIZATION PATTERNS

### 8.1 Common Dashboard Queries with Index Hints

```sql
-- Claims Officer dashboard: open claims
-- Uses: idx_claims_open (partial index on status NOT IN closed states)
SELECT c.id, c.claim_reference, c.claimed_amount, c.priority, c.status
FROM ins_claims.claims c
WHERE c.status NOT IN ('CLOSED','WITHDRAWN','REJECTED')
ORDER BY c.created_at DESC
LIMIT 50;

-- Underwriter L1 queue
-- Uses: idx_policies_pending (partial index)
SELECT p.id, p.policy_number, p.risk_score, p.plan_code, p.created_at
FROM ins_policy.policies p
WHERE p.status = 'PENDING_UW_L1'
ORDER BY p.created_at ASC;

-- Agent commission dashboard
-- Uses: idx_pab_agent_id, idx_ac_policy_id
SELECT p.policy_number, p.plan_code, ac.commission_amount, ac.payment_status
FROM ins_policy.policy_agent_bindings pab
JOIN ins_policy.agent_commissions ac ON ac.policy_id = pab.policy_id
WHERE pab.agent_user_id = $1
ORDER BY ac.created_at DESC;

-- Unread notification count (badge)
-- Uses: idx_notifications_unread (partial index)
SELECT COUNT(*) FROM ins_notification.notifications
WHERE target_user_id = $1 AND is_read = FALSE;
```

### 8.2 JSONB Query Patterns

```sql
-- Check if adventure addon selected (uses GIN idx_gin_quotes_details)
SELECT id FROM ins_policy.quotes
WHERE quote_details @> '{"selectedAddons": ["adventure"]}';

-- Find claims with specific document type
SELECT c.id FROM ins_claims.claims c
WHERE c.metadata ? 'fieldAssignmentId';

-- Rule execution log for specific entity
SELECT * FROM ins_rule.rule_execution_logs
WHERE entity_type = 'QUOTE' AND entity_id = $1
ORDER BY executed_at DESC;
```

---

## 9. MAINTENANCE SCRIPTS

### 9.1 Weekly VACUUM ANALYZE

```sql
-- Run during low-traffic window
VACUUM ANALYZE ins_policy.policies;
VACUUM ANALYZE ins_policy.quotes;
VACUUM ANALYZE ins_claims.claims;
VACUUM ANALYZE ins_notification.notifications;
VACUUM ANALYZE ins_rule.rule_execution_logs;
-- Note: audit_logs partitions are vacuumed per-partition automatically
```

### 9.2 Index Bloat Check

```sql
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname LIKE 'ins_%'
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 20;
```

### 9.3 Unused Index Detection

```sql
SELECT
    schemaname || '.' || tablename AS table,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE schemaname LIKE 'ins_%'
  AND idx_scan = 0
  AND indexname NOT LIKE '%pkey'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### 9.4 Audit Log Partition Rotation (Monthly Cron)

```sql
-- Run on 1st of each month to pre-create next month's partition
DO $$
DECLARE
    next_month DATE := date_trunc('month', NOW() + INTERVAL '1 month');
    partition_name TEXT := 'audit_logs_' || to_char(next_month, 'YYYY_MM');
    range_start TEXT := to_char(next_month, 'YYYY-MM-DD');
    range_end   TEXT := to_char(next_month + INTERVAL '1 month', 'YYYY-MM-DD');
BEGIN
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS ins_audit.%I
         PARTITION OF ins_audit.audit_logs
         FOR VALUES FROM (%L) TO (%L)',
        partition_name, range_start, range_end
    );
END $$;
```

---

## 10. PostgreSQL CONFIGURATION RECOMMENDATIONS

```ini
# postgresql.conf tuning for travel insurance platform (16 GB RAM server example)

# Memory
shared_buffers             = 4GB       # 25% of RAM
effective_cache_size       = 12GB      # 75% of RAM
work_mem                   = 64MB      # per sort/hash operation
maintenance_work_mem       = 512MB     # for VACUUM, CREATE INDEX

# WAL
wal_buffers                = 64MB
checkpoint_completion_target = 0.9
wal_level                  = replica   # enable streaming replication

# Parallel Query
max_parallel_workers_per_gather = 4
max_parallel_workers            = 8

# Planner
random_page_cost           = 1.1       # SSD storage (default 4.0 is for HDD)
effective_io_concurrency   = 200       # SSD (default 1 is for HDD)
default_statistics_target  = 100       # increase for complex queries

# Connection
max_connections            = 100       # use PgBouncer for more clients
```

---

*Optimization guide complete. Apply indexes CONCURRENTLY in production. Monitor with pg_stat_user_indexes.*
