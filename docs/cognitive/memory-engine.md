# Memory Engine

> The storage, embedding, and semantic retrieval boundary of the Cognitive Engine.

---

## Purpose

The Memory Engine is responsible for transforming raw `CognitiveFragments` (emitted by the Capture Engine) into vector-indexed, retrievable `Memory` entities.

The Memory Engine maintains strict evidence lineage: every `Memory` is a derived artifact holding an immutable reference (`fragmentId`) back to the originating `CognitiveFragment`.

---

## Responsibilities

| #   | Responsibility                   | Description                                                                                 |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | **Memory Derivation**            | Transform captured `CognitiveFragments` into `Memory` records.                               |
| 2   | **Vector Embedding Generation**  | Generate 384-dimensional dense vector embeddings using `EmbeddingProvider` abstraction.     |
| 3   | **Vector Index Storage**         | Store embeddings in PostgreSQL `pgvector` (`vector(384)`).                                 |
| 4   | **Semantic Similarity Search**   | Execute top-K cosine similarity retrieval scoped strictly to the authenticated `userId`.    |
| 5   | **Evidence Lineage Maintenance** | Preserve immutable reference (`fragmentId`) connecting every Memory to its source fragment.  |

### What It Does NOT Do

- ❌ Unsupervised spatial clustering (that's Engine 4 — Cognitive Engine)
- ❌ Entity & relationship graph extraction (that's Engine 3 — Knowledge Graph Engine)
- ❌ Temporal reasoning & logic (that's Engine 5 — Reasoning Engine)
- ❌ Reflection synthesis or AI advice (that's Engine 6 — Reflection Engine)

---

## Architecture & Data Model

```
CognitiveFragment (Immutable Evidence)
       │
       ▼
   MemoryEngine.createMemoryFromFragment()
       │
       ├─► EmbeddingProvider.generateEmbedding(content) ──► 384-D Vector
       │
       ▼
    Memory {
      id:          UUID
      userId:      UUID (Owner)
      fragmentId:  UUID (Evidence Reference)
      content:     Text
      embedding:   vector(384)
      metadata:    { schemaVersion: 1, embeddingModel: 'all-MiniLM-L6-v2', dimensions: 384 }
      createdAt:   Timestamp
      updatedAt:   Timestamp
    }
```

---

## API Specification (Sprint 1C-B)

* `POST /memory/from-fragment` $\rightarrow$ Accepts `{ "fragmentId": "..." }`. Generates 384-D embedding, returns `201 Created` with `Memory`.
* `POST /memory/search` $\rightarrow$ Accepts `{ "query": "...", "topK": 5, "minSimilarity": 0.0 }`. Performs vector similarity search scoped to `userId`. Returns `200 OK` with `{ "data": [...MemorySearchResult] }`.
* `GET /memory/:id` $\rightarrow$ Accepts memory ID. Returns `200 OK` if owned by user, `404 Not Found` if non-existent or owned by another user.
