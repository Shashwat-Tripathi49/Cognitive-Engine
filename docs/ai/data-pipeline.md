# Data Pipeline

> How data flows through Cognitive Engine's AI systems.

---

## Pipeline Overview

```
Ingestion → Processing → Embedding → Indexing → Serving
```

### Stage 1: Ingestion

- User creates/updates a thought entry
- Raw text is persisted to PostgreSQL immediately
- An async job is queued for AI processing

### Stage 2: Processing

- Text normalization (unicode, whitespace)
- Metadata extraction (language detection, word count, complexity score)
- Content classification (topic, sentiment, mood)

### Stage 3: Embedding

- Text is converted to a vector embedding via the embedding model
- Embedding is stored alongside the entry in pgvector
- Batch processing for bulk imports

### Stage 4: Indexing

- Vector index is updated (HNSW algorithm)
- Knowledge graph connections are recalculated
- Search index is refreshed

### Stage 5: Serving

- Semantic search queries against vector index
- Related thought recommendations
- Knowledge graph traversal
- Proactive insight generation

---

## Job Queue Architecture

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  API      │────▶│  Job Queue   │────▶│  Workers     │
│  Server   │     │  (Redis/BQ)  │     │  (AI Tasks)  │
└──────────┘     └──────────────┘     └──────────────┘
```

### Job Types

| Job | Priority | Retry | Timeout |
|---|---|---|---|
| `embed_entry` | High | 3x | 30s |
| `find_connections` | Medium | 2x | 60s |
| `generate_digest` | Low | 1x | 120s |
| `analyze_patterns` | Low | 1x | 180s |

---

## Data Retention

| Data Type | Retention | Reason |
|---|---|---|
| Raw text | Until user deletes | User ownership |
| Embeddings | Rebuilt on model change | Tied to model version |
| Connections | Rebuilt on analysis | Derived data |
| AI responses | 30 days | Cache / audit |
| Usage metrics | 90 days | Analytics |

---

> _Pipeline implementation details will be added during Phase 2 (Intelligence Layer)._
