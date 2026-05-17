-- =============================================================================
-- V09__document_schema.sql
-- Schema: ins_document
-- Service: document-service
-- Description: Document template management and generated document storage.
--              Templates use Handlebars/Thymeleaf variable substitution.
--              Customers can view and download their documents from the portal.
--
-- DESIGN (25-table target — 2 tables here):
--   + document_templates    — master template definitions (version history in JSONB)
--   + generated_documents   — one row per generated document instance
--
-- Removed vs previous schema:
--   - document_template_versions → version_history JSONB in document_templates
--   - document_versions          → superseded_by FK in generated_documents
-- =============================================================================

SET search_path = ins_document, public;

-- =============================================================================
-- document_templates
-- Master template definitions. Underwriter publishes new versions.
-- version_history: JSONB array of previous template versions for audit.
--   [{version_number, template_content, output_format, published_by, published_at}]
-- current_version_number and current_content hold the live version inline
-- to avoid a join when generating documents.
-- =============================================================================
CREATE TABLE ins_document.document_templates (
    id                          UUID            NOT NULL DEFAULT gen_random_uuid(),
    template_code               VARCHAR(80)     NOT NULL,
    template_name               VARCHAR(150)    NOT NULL,
    document_category           VARCHAR(40)     NOT NULL,
                                -- POLICY | CLAIM | FINANCE | SYSTEM
    description                 TEXT            NULL,
    current_version_number      INT             NOT NULL DEFAULT 1,
    current_content             TEXT            NULL,
                                -- Active Handlebars/Thymeleaf template body
    output_format               VARCHAR(10)     NOT NULL DEFAULT 'PDF',
                                -- PDF | HTML
    version_history             JSONB           NOT NULL DEFAULT '[]',
                                -- [{version_number, content, output_format,
                                --   published_by, published_at}]
    is_active                   BOOLEAN         NOT NULL DEFAULT TRUE,
    published_by                UUID            NULL,
    published_at                TIMESTAMPTZ     NULL,
    created_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_document_templates PRIMARY KEY (id),
    CONSTRAINT uq_document_templates_code UNIQUE (template_code),
    CONSTRAINT chk_doc_category CHECK (document_category IN ('POLICY','CLAIM','FINANCE','SYSTEM')),
    CONSTRAINT chk_doc_output_format CHECK (output_format IN ('PDF','HTML'))
);

CREATE INDEX idx_doc_templates_active ON ins_document.document_templates (is_active, document_category);

CREATE TRIGGER trg_doc_templates_updated_at
    BEFORE UPDATE ON ins_document.document_templates
    FOR EACH ROW EXECUTE FUNCTION ins_common.set_updated_at();

-- =============================================================================
-- generated_documents
-- One row per generated document instance.
-- entity_type + entity_id reference the source entity (no FK — cross-schema).
-- storage_key: S3/MinIO object key for download.
-- generation_context: JSONB variables substituted at generation time (for audit).
-- customer_id: enables customer portal to list "my documents" without joins.
-- =============================================================================
CREATE TABLE ins_document.generated_documents (
    id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
    document_reference  VARCHAR(30)     NOT NULL,
    template_id         UUID            NOT NULL,
    template_version    INT             NOT NULL DEFAULT 1,
    entity_type         VARCHAR(30)     NOT NULL,
                        -- POLICY | CLAIM | QUOTE | PAYMENT
    entity_id           UUID            NOT NULL,
    entity_reference    VARCHAR(30)     NULL,
                        -- Human-readable: policy number, claim reference, etc.
    customer_id         UUID            NULL,
    document_name       VARCHAR(200)    NOT NULL,
    storage_key         VARCHAR(500)    NOT NULL,
    file_size_bytes     BIGINT          NULL,
    mime_type           VARCHAR(60)     NOT NULL DEFAULT 'application/pdf',
    generated_by        UUID            NULL,
    generation_context  JSONB           NULL,
                        -- Template variables used at generation time
    is_latest_version   BOOLEAN         NOT NULL DEFAULT TRUE,
    superseded_by       UUID            NULL,
                        -- If re-issued, points to newer generated_documents.id
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_generated_documents PRIMARY KEY (id),
    CONSTRAINT uq_generated_doc_reference UNIQUE (document_reference),
    CONSTRAINT fk_gen_docs_template FOREIGN KEY (template_id)
        REFERENCES ins_document.document_templates (id),
    CONSTRAINT chk_gen_doc_entity CHECK (entity_type IN ('POLICY','CLAIM','QUOTE','PAYMENT'))
);

CREATE INDEX idx_gen_docs_entity   ON ins_document.generated_documents (entity_type, entity_id);
CREATE INDEX idx_gen_docs_customer ON ins_document.generated_documents (customer_id)
    WHERE customer_id IS NOT NULL;
CREATE INDEX idx_gen_docs_created  ON ins_document.generated_documents (created_at DESC);
