# Schema Design

> Preliminary database schema for Cognitive Engine. This will be implemented using Drizzle ORM.

---

## Tables Overview

```
users
├── user_settings
├── entries
│   ├── entry_tags
│   ├── entry_embeddings
│   └── entry_connections
├── tags
├── cognitive_digests
└── ai_interactions
```

---

## Table Definitions

### `users`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Unique user identifier |
| `email` | `varchar(255)` | UNIQUE, NOT NULL | User email |
| `name` | `varchar(255)` | | Display name |
| `avatar_url` | `text` | | Profile image URL |
| `auth_provider` | `varchar(50)` | NOT NULL | OAuth provider or 'email' |
| `auth_provider_id` | `varchar(255)` | | External provider ID |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | Account creation |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | Last update |
| `deleted_at` | `timestamptz` | | Soft delete timestamp |

### `entries`

The core table — stores user's thoughts.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Unique entry identifier |
| `user_id` | `uuid` | FK → users.id, NOT NULL | Owner |
| `title` | `varchar(500)` | | Optional title |
| `content` | `text` | NOT NULL | Raw text content |
| `content_html` | `text` | | Rich text (HTML) |
| `summary` | `text` | | AI-generated summary |
| `mood` | `varchar(50)` | | User-selected mood |
| `word_count` | `integer` | | Computed word count |
| `language` | `varchar(10)` | DEFAULT 'en' | Detected language |
| `is_pinned` | `boolean` | DEFAULT false | Pinned to top |
| `is_archived` | `boolean` | DEFAULT false | Archived |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | Entry creation |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | Last edit |
| `deleted_at` | `timestamptz` | | Soft delete |

**Indexes**:
- `idx_entries_user_id` on `(user_id)`
- `idx_entries_created_at` on `(user_id, created_at DESC)`
- `idx_entries_content_search` GIN index for full-text search

### `entry_embeddings`

Vector embeddings for semantic search.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK | Unique identifier |
| `entry_id` | `uuid` | FK → entries.id, UNIQUE, NOT NULL | Linked entry |
| `embedding` | `vector(1536)` | NOT NULL | Embedding vector |
| `model_id` | `varchar(100)` | NOT NULL | Model used for embedding |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | Generation time |

**Indexes**:
- HNSW index on `embedding` for approximate nearest neighbor search

### `entry_connections`

AI-detected connections between entries.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK | Unique identifier |
| `source_entry_id` | `uuid` | FK → entries.id, NOT NULL | Source entry |
| `target_entry_id` | `uuid` | FK → entries.id, NOT NULL | Connected entry |
| `connection_type` | `varchar(50)` | NOT NULL | Type (semantic, temporal, thematic) |
| `strength` | `float` | NOT NULL | Connection strength (0-1) |
| `explanation` | `text` | | AI-generated explanation |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | Detection time |

**Constraints**:
- UNIQUE on `(source_entry_id, target_entry_id)`
- CHECK `source_entry_id != target_entry_id`

### `tags`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK | Unique identifier |
| `user_id` | `uuid` | FK → users.id, NOT NULL | Tag owner |
| `name` | `varchar(100)` | NOT NULL | Tag name |
| `color` | `varchar(7)` | | Hex color code |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | Creation time |

**Constraints**:
- UNIQUE on `(user_id, name)`

### `entry_tags`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `entry_id` | `uuid` | FK → entries.id, NOT NULL | Entry |
| `tag_id` | `uuid` | FK → tags.id, NOT NULL | Tag |

**Constraints**:
- PK on `(entry_id, tag_id)`

### `user_settings`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `user_id` | `uuid` | FK → users.id, PK | User |
| `theme` | `varchar(20)` | DEFAULT 'dark' | UI theme preference |
| `language` | `varchar(10)` | DEFAULT 'en' | Preferred language |
| `ai_enabled` | `boolean` | DEFAULT true | AI features toggle |
| `digest_enabled` | `boolean` | DEFAULT true | Daily digest toggle |
| `digest_time` | `time` | DEFAULT '08:00' | Preferred digest time |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | Last update |

---

## Relationships

```
users 1──────∞ entries
users 1──────1 user_settings
users 1──────∞ tags
entries ∞────∞ tags (via entry_tags)
entries 1────1 entry_embeddings
entries ∞────∞ entries (via entry_connections)
```

---

> _Schema will be implemented as Drizzle ORM definitions in `packages/shared/src/db/schema/`. This document serves as the design reference._
