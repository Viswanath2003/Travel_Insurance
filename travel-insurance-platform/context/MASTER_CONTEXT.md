# MASTER CONTEXT

IMPORTANT:
The UI Sprint document and wireframes are the latest and authoritative product direction.

The BRD and Product Backlog are older references and should only be used for:
- business context
- terminology
- generic workflows

If conflicts exist:
UI Sprint and wireframes override older documents.

PROJECT TYPE:
This is NOT a simple CRUD insurance application.

This is a configurable enterprise travel insurance administration platform with:
- modular insurance products
- configurable plans
- add-ons
- dynamic pricing
- configurable premium rules
- configurable risk rules
- underwriting workflows
- claims workflows
- document generation
- RBAC
- audit trails
- workflow queues
- explainable rule decisions
- document versioning
- policy snapshots

SYSTEM REQUIREMENTS:
- multiple travel insurance product types
- student travel
- family travel
- corporate travel
- annual multi-trip
- single-trip
- senior citizen travel
- configurable underwriting
- dynamic document generation
- configurable policy wording
- local filesystem storage only

ARCHITECTURE:
- microservices
- no monolith
- no cloud
- local deployment only
- configuration-driven architecture

DO NOT HARDCODE:
- products
- pricing rules
- discounts
- add-ons
- workflows
- underwriting rules

Everything must be database-driven.
