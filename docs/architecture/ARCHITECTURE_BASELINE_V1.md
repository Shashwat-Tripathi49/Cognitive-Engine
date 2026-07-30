# Architecture Baseline v1.0 — Cognitive Engine

> **Document Status:** Architecture Baseline (Validated Decision — Subject to Revision)  
> **Effective Date:** 2026-07-29  
> **Version:** 1.0.0  
> **Scope:** Establishes the authoritative architectural contract and engine boundary definitions for the Cognitive Engine project based on empirical evidence from Sprint 1A through Experiment 002.

---

## 1. Project Purpose

The Cognitive Engine is an architecture for human thought capture, memory retention, structural knowledge synthesis, and reflective reasoning.

The long-term objective of the system is to act as a deterministic, evidence-bound cognitive partner that faithfully preserves human experiences, extracts semantic themes over time, builds a dynamic knowledge graph of entities and relationships, and offers reflective insights—all while ensuring every generated synthesis can be traced back to immutable source evidence without LLM hallucination.

---

## 2. Validated Decisions

The following architectural decisions have been empirically validated through production implementations and disposable research spikes:

1. **Capture Engine Boundary (Sprint 1B, Sprint 1C-A):**
   * The ingestion boundary must remain strictly un-opinionated. The Capture Engine is responsible solely for normalization, structural enrichment, SHA-256 content hashing, and emit—it must never attempt AI interpretation or memory indexing.
2. **Multi-Tenant Authorization & Identity (Sprint 1C-A):**
   * Multi-tenant security is strictly enforced at the backend middleware layer. `userId` is extracted exclusively from authenticated contexts (Clerk JWTs) and database queries enforce `WHERE user_id = :userId` across all read/write paths.
3. **Dense Semantic Embeddings vs. Lexical Representations (Experiment 001 & 002):**
   * Dense semantic vector embeddings (`sentence-transformers/all-MiniLM-L6-v2`, 384-D) substantially outperform sparse bag-of-words (TF-IDF). Paraphrase recognition improved clustering performance from near-zero ($\text{ARI} = 0.038$) to moderate accuracy ($\text{ARI} \ge 0.42 - 0.54$).
4. **Memory Engine Scope Isolation (Experiment 001 & 002):**
   * The Memory Engine must be responsible strictly for vector embedding generation, storage, and similarity retrieval. It must NOT attempt unsupervised spatial clustering, entity extraction, or reasoning.
5. **Density Clustering Limitations on Sparse Cold-Start Data (Experiment 001 & 002):**
   * Density-based spatial clustering algorithms (DBSCAN) fail on sparse cold-start datasets ($N \le 50$), exhibiting $90\%$ to $100\%$ noise. Spatial vector clustering UI widgets must be suppressed until $N \ge 50$.

---

## 3. Rejected Assumptions

The following initial hypotheses were disproved during research validation and are explicitly rejected from the production architecture:

1. **Rejected Assumption 1: Lexical Similarity (TF-IDF) is Sufficient for Theme Discovery.**
   * *Disproof:* Experiment 001 demonstrated that TF-IDF achieved an Adjusted Rand Index (ARI) of only $0.038$ at $N=20$ and $0.220$ at $N=100$. Lexical bag-of-words cannot recognize paraphrases.
2. **Rejected Assumption 2: DBSCAN / Density Clustering Works for Early Cold-Start Users.**
   * *Disproof:* Experiment 001 & 002 proved that DBSCAN classifies $90\%$ of entries as noise at $N=20$ and $61.3\%$ as noise at $N=50$. Spatial density neighborhoods require dense point distributions that early journal corpora lack.
3. **Rejected Assumption 3: Knowledge Graph Generation Depends on Vector Spatial Clustering.**
   * *Disproof:* Experiment 002 established that Knowledge Graph node creation MUST NOT depend on spatial vector clusters, which retain boundary ambiguity ($\text{ARI} \approx 0.42$). Graph nodes must be derived via deterministic entity extraction from individual Memory items.

---

## 4. Open Questions & Future Sprints

The following engineering questions remain open for future sprints. They are explicitly acknowledged but NOT resolved in Architecture Baseline v1.0:

1. **Entity Extraction Strategy (Sprint 1D):** How to extract entities (People, Projects, Places) deterministically using lightweight NLP vs LLM parsing while maintaining strict source evidence lineage.
2. **Knowledge Graph Construction & Synonyms (Sprint 2):** How to resolve entity aliases (e.g., *"Rahul"* $\leftrightarrow$ *"Rahul Sharma"*) and manage relationship edge decay.
3. **Long-Term Memory Decay & Reinforcement (Sprint 3):** Designing the temporal decay curve for memory retrieval ranking so recent or frequently accessed memories maintain higher relevance.
4. **Reflection Quality & Alignment (Sprint 4):** Metrics and guardrails for evaluating reflective prompts without introducing confirmation bias or therapeutic hallucination.

---

## 5. Engine Responsibilities & Boundaries

```
[ Human Input ]
       │
       ▼
 1. CAPTURE ENGINE ──────────────► [ PostgreSQL / CognitiveFragment ]
       │                                     │
       ▼                                     ▼
 2. MEMORY ENGINE ───────────────► [ pgvector / Derived Memory Items ]
       │                                     │
       ▼                                     ▼
 3. KNOWLEDGE GRAPH ENGINE ──────► [ Entities & Edge Relationships ]
       │
       ▼
 4. COGNITIVE ENGINE ────────────► [ Pattern Discovery & Theme Clusters ]
       │
       ▼
 5. REASONING ENGINE ────────────► [ Temporal & Contextual Logic ]
       │
       ▼
 6. REFLECTION ENGINE ───────────► [ Evidence-Bound User Insights ]
```

### 1. Capture Engine
* **Purpose:** Transform raw, multi-modal human input into immutable `CognitiveFragment` records.
* **Inputs:** Raw text, voice transcriptions, web highlights, image captions.
* **Outputs:** `CognitiveFragment` domain events with SHA-256 content hashes and typed metadata.
* **Out of Scope:** Vector embedding generation, semantic searching, entity extraction, AI summaries.

### 2. Memory Engine
* **Purpose:** Transform `CognitiveFragments` into vector-indexed, retrievable semantic memories.
* **Inputs:** Immutably stored `CognitiveFragments`.
* **Outputs:** Derived `Memory` domain entities with vector embeddings and top-K similarity search results.
* **Out of Scope:** Unsupervised clustering, entity extraction, knowledge graph edges, LLM reflections.

### 3. Knowledge Graph Engine
* **Purpose:** Extract discrete entities (People, Projects, Places, Concepts) and link structural relationships.
* **Inputs:** Derived `Memory` entities and originating `CognitiveFragments`.
* **Outputs:** Entity nodes and typed relationship edges.
* **Out of Scope:** Vector similarity search, prompt generation, raw ingestion.

### 4. Cognitive Engine
* **Purpose:** Discover recurring temporal themes, behavioral patterns, and mental models across large memory corpora ($N \ge 50$).
* **Inputs:** Derived Memories and Knowledge Graph subgraphs.
* **Outputs:** Thematic clusters and pattern definitions.
* **Out of Scope:** Raw fragment ingestion, memory storage.

### 5. Reasoning Engine
* **Purpose:** Evaluate temporal logic, cause-and-effect sequences, and counter-factual context.
* **Inputs:** Cognitive patterns, Memory subgraphs, and Knowledge Graph paths.
* **Outputs:** Structured reasoning chains bound to source evidence.
* **Out of Scope:** Unverified opinion generation, advice-giving.

### 6. Reflection Engine
* **Purpose:** Synthesize evidence-bound, reflective prompts and mirror user growth over time.
* **Inputs:** Reasoning chains and validated cognitive patterns.
* **Outputs:** Reflective questions, memory highlights, progress mirrors.
* **Out of Scope:** Direct therapeutic intervention, ungrounded recommendations.

---

## 6. Production Principles

1. **Evidence Before Explanation:** The system must ground all higher-order insights in verifiable source evidence.
2. **Immutable Evidence:** Raw `CognitiveFragments` are immutable once captured. Derived artifacts (`Memories`, `Entities`, `Clusters`) reference fragments but never alter them.
3. **Single Responsibility:** Each engine has a strict, non-overlapping boundary.
4. **Deterministic Systems Before Probabilistic Systems:** Deterministic structural components (database schemas, entity IDs, content hashes) govern probabilistic AI components (vector embeddings, LLM reflections).
5. **Research Before Architecture:** Major technical decisions must be validated through isolated empirical experiments before production commitment.
6. **Retrieval Before Reasoning:** Reasoning and reflection engines operate exclusively on retrieved, evidence-linked memories.

---

## 7. Memory Lifecycle & Future Memory Policies

### Current Decision
Automated memory decay, episodic/semantic/procedural memory classification, memory forgetting, and consolidation algorithms are **intentionally deferred beyond Phase 1 (v1)**.

### Architectural Rationale
1. **Infrastructure Prerequisites:** Reliable, deterministic memory storage (`pgvector`), immutable evidence lineage (`CognitiveFragment`), and semantic vector retrieval MUST exist and be thoroughly validated before automated lifecycle policies become meaningful or manageable.
2. **Prevention of Premature Complexity:** Implementing memory decay or forgetting algorithms prior to establishing baseline retrieval accuracy would introduce compounding non-deterministic variables into similarity scoring.
3. **Evidence Integrity:** In early development stages, all recorded memories remain permanently retrievable to ensure source evidence is preserved without artificial temporal attenuation.

---

## 8. Current Technology Decisions (Subject to Revision)

* **Authentication:** **Clerk** (Bearer JWT tokens, Clerk SDK integration).
* **Database & Vector Search:** **PostgreSQL 16** with **`pgvector`** extension (`vector(384)`).
* **Embedding Model:** **Sentence Transformers** (`all-MiniLM-L6-v2`, 384 dimensions).
* **ORM & Database Client:** **Drizzle ORM** with type-safe schema migrations.
* **Backend Framework:** **Hono** running on Node.js / TypeScript.
* **Frontend Framework:** **Next.js 15 (App Router)** & TailwindCSS.
* **Monorepo Management:** **Turborepo** with `pnpm` workspaces.

---

## 9. Roadmap

* **Sprint 1C-B:** Memory Engine — Vector embeddings, `pgvector` storage, semantic similarity retrieval, evidence linkage.
* **Sprint 1C-C (Current):** Phase 1 Validation & Architectural Audit Milestone.
* **Sprint 1D:** Entity & Metadata Engine — Deterministic entity extraction (People, Projects) and structural metadata indexing.
* **Sprint 2:** Knowledge Graph Engine — Node/edge storage, graph querying, alias resolution.
* **Sprint 3:** Cognitive Engine — Pattern discovery, thematic clustering ($N \ge 50$), memory recency decay ranking.
* **Sprint 4:** Reasoning & Reflection Engine — Evidence-bound reflective synthesis, interactive user feedback loops.
