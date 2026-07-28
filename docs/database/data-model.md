# Data Model

> Conceptual data model showing entities, their attributes, and relationships.

---

## Entity Relationship Overview

```
┌──────────┐         ┌──────────────┐         ┌──────────┐
│          │ 1     ∞ │              │ ∞     ∞ │          │
│  User    ├─────────┤    Entry     ├─────────┤   Tag    │
│          │         │              │         │          │
└────┬─────┘         └──┬───┬───┬──┘         └──────────┘
     │ 1                │   │   │
     │                  │   │   │
     ▼ 1                │   │   │
┌──────────┐           │   │   │
│ Settings │           │   │   │
└──────────┘           │   │   │
                       │   │   │
              1────────┘   │   └────────∞
              ▼            │            ▼
     ┌──────────────┐     │    ┌──────────────┐
     │  Embedding   │     │    │  Connection   │
     └──────────────┘     │    └──────────────┘
                          │
                    ∞─────┘
                    ▼
           ┌──────────────┐
           │   Digest     │
           └──────────────┘
```

---

## Core Entities

### User

The authenticated user. Owns all entries, tags, and settings.

**Key attributes**: email, name, auth provider
**Relationships**: Has many entries, has one settings, has many tags

### Entry

A captured thought — the atomic unit of the system.

**Key attributes**: content, title, mood, word count
**Relationships**: Belongs to user, has many tags, has one embedding, has many connections

### Tag

User-defined classification label.

**Key attributes**: name, color
**Relationships**: Belongs to user, belongs to many entries

### Entry Embedding

Vector representation of an entry for semantic search.

**Key attributes**: embedding vector, model ID
**Relationships**: Belongs to one entry

### Entry Connection

AI-detected relationship between two entries.

**Key attributes**: connection type, strength, explanation
**Relationships**: Connects two entries

### Cognitive Digest

AI-generated periodic summary of thinking patterns.

**Key attributes**: content, period, themes
**Relationships**: Belongs to user, references many entries

---

## Data Integrity Rules

1. Deleting a user cascades soft-delete to all owned data
2. Entries are never hard-deleted (soft delete only)
3. Embeddings are regenerated when the entry content changes
4. Connections are recalculated when related entries change
5. Tags without entries are periodically cleaned up

---

> _See [schema-design.md](schema-design.md) for the concrete SQL-level table definitions._
