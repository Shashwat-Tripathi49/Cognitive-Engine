# 🗄️ Database Documentation

This directory contains all database design documentation for Cognitive Engine.

## Contents

| Document | Description |
|---|---|
| [Schema Design](schema-design.md) | Table definitions, relationships, and constraints |
| [Data Model](data-model.md) | Conceptual data model and entity relationships |
| [Migrations Strategy](migrations-strategy.md) | Database migration workflow and versioning |
| [Diagrams](diagrams/) | ER diagrams and visual schema representations |

## Database Choice

**PostgreSQL 16** with extensions:

- **pgvector** — Vector similarity search for AI embeddings
- **pg_trgm** — Trigram-based fuzzy text search
- **uuid-ossp** — UUID generation

## ORM

**Drizzle ORM** — Chosen for type-safe queries with zero runtime overhead and excellent migration tooling.

## Key Design Principles

1. **Type safety end-to-end** — Database schema types are shared with application code
2. **Soft deletes** — No hard deletes for user-facing data
3. **Audit trail** — `created_at` and `updated_at` on every table
4. **UUID primary keys** — No sequential IDs exposed to users
5. **Normalized where clear, denormalized where fast** — Balance correctness with performance
