# Knowledge Graph Engine — Conceptual Architecture & Integration Specification

> **Document Status:** Conceptual Architecture (Phase 2 Baseline Specification)  
> **Target Engine:** Engine 3 — Knowledge Graph Engine  
> **Effective Date:** 2026-07-31  
> **Version:** 2.0.0-alpha  
> **Scope:** Defines the conceptual architecture, engine boundaries, integration contracts, architectural principles, and Phase 2 roadmap for the Knowledge Graph Engine, adhering strictly to the Phase 1 Baseline and Experiment 003 Constraints.

---

## Executive Summary & System Intent

The **Knowledge Graph Engine (Engine 3)** is the structural synthesis layer of the Cognitive Engine. 

While the **Memory Engine (Engine 2)** provides high-dimensional vector similarity retrieval (`pgvector`), vector search alone cannot answer structural, relational, or multi-hop entity queries (e.g. *"What projects did I work on with Rahul in Q2 2026?"* or *"What dependencies exist between my CAT preparation topics and my study schedule?"*).

The Knowledge Graph Engine constructs a deterministic, evidence-bound graph of **Entities (Nodes)**, **Typed Relationships (Edges)**, and **Provenance Links (Evidence)** across human experiences. 

In strict compliance with the **Experiment 003 Constraint**, raw, un-guided LLM entity extraction is **DISQUALIFIED**. No automatically extracted entity may enter the production Knowledge Graph without intermediate mediation through a **Mediated Validation Interface (MVI)** incorporating a canonical entity dictionary and/or explicit human confirmation.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                COGNITIVE ARCHITECTURE                                  │
│                                                                                        │
│  [Capture Engine] ──► [Memory Engine] ──► [KNOWLEDGE GRAPH ENGINE] ──► [Reasoning/...] │
│  (Raw Ingestion)       (Vector Retrieval)  └─► Candidate Queue                         │
│                                                └─► Human / Canonical Validation        │
│                                                └─► Provenance-Bound Nodes & Edges      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Why the Knowledge Graph Engine Exists

### 1.1 The Limitations of Unstructured Semantic Retrieval
Vector similarity search (`all-MiniLM-L6-v2` dense embeddings + `pgvector`) excels at fuzzy paraphrase matching and top-K semantic similarity. However, empirical evaluation from Phase 1 demonstrated four fundamental limitations of pure vector retrieval:

1. **Lack of Exact Identity Resolution:** Vector distance operates in continuous embedding space. It cannot distinguish between two distinct entities with semantically similar contexts (e.g., *"Rahul Sharma"* vs *"Rahul Verma"*).
2. **Inability to Perform Multi-Hop Traversal:** Vector search cannot traverse compositional relational chains (e.g. `User` $\rightarrow$ `WorkedWith` $\rightarrow$ `Person` $\rightarrow$ `AssignedTo` $\rightarrow$ `Project`).
3. **Distance Clustering Dilution:** As shown in Workstream 1 of Sprint 1C-C, abstract multi-word queries (e.g. `"frontend project"`) suffer from semantic distance dilution where general tech terms cluster closely, displacing exact relational matches.
4. **Non-Determinism in Set Operations:** Vector search cannot perform strict logical set intersections, unions, or structural filtering (e.g., *"Find all memories involving Person:Rahul AND Project:ExpenseTracker within Date Range X"*).

### 1.2 The Problem Solved by the Knowledge Graph
The Knowledge Graph Engine solves these limitations by superimposing an explicit, deterministic relational structure over unstructured memory items. It transforms episodic text entries into a interconnected web of typed entities and verified relations, enabling:
* **Deterministic Relational Traversal:** Answering explicit multi-hop structural queries.
* **Ground-Truth Entity Identity:** Maintaining single canonical representations for real-world entities.
* **Evidence Lineage:** Mapping every graph assertion back to verifiable source fragments.

### 1.3 Future Capabilities Enabled
The Knowledge Graph Engine serves as the mandatory structural foundation for subsequent engines:
* **Cognitive Pattern Engine (Engine 4):** Enables graph-based community detection, recurring entity co-occurrence discovery, and sub-graph density analysis.
* **Reasoning Engine (Engine 5):** Provides structured graph paths for temporal logic, cause-and-effect reasoning chains, and multi-hop counter-factual evaluation.
* **Reflection Engine (Engine 6):** Allows evidence-linked reflection prompts grounded in concrete entity relationships and user growth milestones over time.

---

## 2. Role, Scope & Boundaries of the Knowledge Graph Engine

### 2.1 Primary Responsibilities
The Knowledge Graph Engine is responsible exclusively for:
1. **Entity Management (Nodes):** Maintaining canonical entities (People, Projects, Places, Organizations, Concepts) within a multi-tenant scope.
2. **Relationship Management (Edges):** Maintaining directed, typed edges between entities with confidence scores and evidence counts.
3. **Provenance Linkage:** Binding every node and edge to originating `Memory` entities and `CognitiveFragment` content hashes.
4. **Mediated Validation Management:** Managing candidate entity extraction queues (`PENDING_CONFIRMATION`), enforcing human confirmation, and maintaining user-verified Canonical Entity Dictionaries.
5. **Subgraph Querying:** Exposing deterministic subgraph traversal and relational query APIs.

### 2.2 Invariant System Inputs
* **Derived `Memory` entities** (from Engine 2).
* **Immutable `CognitiveFragment` source events** (from Engine 1).
* **Human Validation Feedback** (Explicit user confirmations/rejections of candidate entities).
* **User Canonical Entity Dictionaries** (User-defined/approved alias lists).

### 2.3 System Outputs
* **Canonical Entity Subgraphs** (Typed nodes, directed edges, confidence scores).
* **Evidence Provenance Chains** (Direct mapping from any node/edge to `memoryId`, `fragmentId`, SHA-256 hash).
* **Candidate Extraction Queues** (Staged candidate entities awaiting confirmation).

### 2.4 Explicit Engine Boundaries (What it is NOT responsible for)
To prevent architectural overlap and maintain single-responsibility principles:
* **NOT Responsible for Raw Ingestion:** Does not parse raw HTTP payloads, normalize multi-modal inputs, or compute content hashes (belongs strictly to **Capture Engine**).
* **NOT Responsible for Vector Search:** Does not generate vector embeddings, compute cosine similarities, or manage `pgvector` indexes (belongs strictly to **Memory Engine**).
* **NOT Responsible for Theme Clustering:** Does not run unsupervised spatial clustering (K-Means, DBSCAN, Graph Community Detection) across memory corpora (belongs strictly to **Cognitive Engine**).
* **NOT Responsible for Cause-and-Effect Logic:** Does not construct temporal reasoning chains or evaluate counter-factual scenarios (belongs strictly to **Reasoning Engine**).
* **NOT Responsible for Reflective Prompt Synthesis:** Does not generate user-facing advice, summary insights, or reflective questions (belongs strictly to **Reflection Engine**).

---

## 3. Integration into the 6-Engine Cognitive Architecture

```
                                  [ Human User ]
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │ Explicit Confirmation / Candidate Validation  │
                 ▼                                               ▼
      ┌────────────────────┐                           ┌────────────────────┐
      │  CAPTURE ENGINE    │                           │  KNOWLEDGE GRAPH   │
      │    (Engine 1)      │                           │      ENGINE        │
      └─────────┬──────────┘                           │    (Engine 3)      │
                │ Creates Immutable                    └─────────▲──────────┘
                │ CognitiveFragment                              │
                ▼                                                │ Maps Relational
      ┌────────────────────┐                                     │ Subgraphs to
      │   MEMORY ENGINE    │                                     │ Evidence
      │    (Engine 2)      ├─────────────────────────────────────┘
      └─────────┬──────────┘
                │ Supplies Retrieved
                │ Evidence Context
                ▼
      ┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐
      │  COGNITIVE ENGINE  │────►│  REASONING ENGINE  │────►│ REFLECTION ENGINE  │
      │    (Engine 4)      │     │    (Engine 5)      │     │    (Engine 6)      │
      └────────────────────┘     └────────────────────┘     └────────────────────┘
```

### 3.1 Interaction Contracts

#### Capture Engine (Engine 1) $\rightarrow$ Knowledge Graph Engine (Engine 3)
* Capture Engine emits immutable `CognitiveFragment` events containing SHA-256 content hashes.
* Knowledge Graph Engine references `fragmentId` and SHA-256 content hashes for provenance verification, but **never** listens directly to raw capture streams to create un-validated nodes.

#### Memory Engine (Engine 2) $\rightarrow$ Knowledge Graph Engine (Engine 3)
* Memory Engine provides derived `Memory` items and top-K vector search results.
* Knowledge Graph Engine consumes `memoryId` as the primary anchor of evidence. Every entity and edge in the graph MUST reference at least one valid `memoryId`.

#### Knowledge Graph Engine (Engine 3) $\rightarrow$ Reasoning Engine (Engine 5)
* Knowledge Graph Engine exposes structured subgraphs (nodes, edges, evidence links) to the Reasoning Engine.
* Reasoning Engine uses graph paths to construct verifiable, multi-hop reasoning chains grounded in source evidence.

#### Knowledge Graph Engine (Engine 3) $\rightarrow$ Reflection Engine (Engine 6)
* Reflection Engine queries Knowledge Graph subgraphs to discover recurring relationships (e.g. long-term collaboration with a specific person) to formulate grounded reflective questions.

---

## 4. Governing Architectural Principles

### Principle 1: Mandatory Provenance (Evidence-First Design)
Every node (Entity) and edge (Relationship) in the Knowledge Graph MUST be traceable to at least one underlying `Memory` item and `CognitiveFragment`. 
* Zero orphaned nodes.
* Zero ungrounded edges.
* Every graph element stores: `originatingMemoryId`, `originatingFragmentId`, `sourceContentHash`, and `creationTimestamp`.

### Principle 2: Strict Compliance with Experiment 003 Constraint
Experiment 003 proved that raw, un-guided LLM entity extraction generated a **$38.10\%$ hallucination rate** against a $2.0\%$ pre-stated ceiling. 
* **Disqualification:** Automatically extracted entities from un-guided LLMs are strictly disqualified from direct ingestion into the active Knowledge Graph.
* **Mediated Validation Mechanism:** All proposed entities must pass through a **Mediated Validation Interface (MVI)**:
  1. Extracted candidate entities enter a `PENDING_CONFIRMATION` queue.
  2. Candidate entities are validated against a user-verified **Canonical Entity Dictionary**.
  3. Unmatched candidate entities require explicit human approval before being promoted to active graph nodes.

### Principle 3: Explainability & Reproducibility
* Every relationship edge must have a clear, human-understandable relation type (e.g., `WORKED_ON`, `COLLABORATED_WITH`, `PREPARED_FOR`, `LOCATED_AT`).
* Ambiguous or implicit edges are prohibited. Every edge includes a explicit confidence score ($0.0 - 1.0$) derived from validation source status (e.g., Human Approved = $1.0$, Canonical Dictionary Match = $0.95$).

### Principle 4: Strict Multi-Tenant Isolation
* Knowledge Graph data is strictly partitioned by `userId`.
* All database queries, candidate queues, node lookups, and edge traversals must enforce `WHERE user_id = :userId` at the database query boundary.
* Cross-tenant graph leakage is a P0 security violation.

### Principle 5: Immutability of Source Evidence
* The Knowledge Graph is a derived structural view over source memory.
* Modifying, merging, or soft-deleting graph nodes or edges must **NEVER** alter or mutate the underlying `CognitiveFragment` or `Memory` records.

### Principle 6: Stack Consistency & Simplicity
* The Knowledge Graph Engine will be implemented using our existing, production-proven technology stack: **PostgreSQL 16**, **Drizzle ORM**, **TypeScript**, and **Hono**.
* We explicitly reject external graph database engines (e.g. Neo4j, Pinecone, GraphRAG frameworks) to prevent operational complexity, additional infrastructure overhead, and multi-database distributed transaction failures.

---

## 5. Major Architectural Challenges & Proposed Solutions

### Challenge 1: Entity Alias & Synonym Resolution without Un-Guided LLM Parsing
* *Problem:* Users refer to the same entity using different lexical variations (e.g., *"Rahul"*, *"Rahul Sharma"*, *"RS"*, *"my co-founder"*). Standard LLM resolution hallucinates at $38.10\%$.
* *Architectural Solution:* Implement a two-stage **Canonical Entity Dictionary & Candidate Matching Queue**:
  1. **Exact & Normalized String Match:** Fast exact matching against user-approved canonical entity aliases.
  2. **Candidate Alias Queue:** When an unrecognized name variant appears, it is staged as a candidate alias under `PENDING_CONFIRMATION` for human approval or canonical alias binding.

### Challenge 2: Efficient Relational Graph Queries in Relational PostgreSQL
* *Problem:* Storing graph structures in relational databases can lead to expensive recursive JOIN operations.
* *Architectural Solution:* Model the graph using normalized relational tables (`kg_nodes`, `kg_edges`, `kg_evidence_links`) optimized with compound B-Tree indexes on `(user_id, entity_type)` and `(user_id, source_node_id, target_node_id)`. Use PostgreSQL Recursive Common Table Expressions (CTEs) for depth-constrained (max-depth $\le 3$) multi-hop subgraph retrieval.

### Challenge 3: Multi-Tenant Graph Security & Partitioning
* *Problem:* Ensuring graph traversals never cross user boundaries.
* *Architectural Solution:* Enforce multi-tenant compound primary keys `(id, user_id)` and mandate `userId` propagation in all repository interface signatures (`findByEntity(userId, entityId)`).

### Challenge 4: Handling Temporal Edge Validity & Evolving Contexts
* *Problem:* Relationships change over time (e.g., *"Rahul"* was a `COLLABORATOR` on *"Expense Tracker"* in Q1, but moved to another project in Q3).
* *Architectural Solution:* Edges do not overwrite historical state. Every edge record includes `validFrom`, `validTo`, and `evidenceCount`. When new evidence arrives, edge confidence and evidence counts increase without invalidating historical evidence links.

---

## 6. Phase 2 Success Criteria

Sprint 2 will be considered successful when the Knowledge Graph Engine achieves the following verifiable capabilities:

1. **Deterministic Relational Persistence:** Fully operational PostgreSQL schema for nodes, typed edges, and evidence links managed via Drizzle ORM.
2. **Zero-Hallucination Ingestion Contract:** 100% of active graph nodes originate from either explicit human confirmation or verified canonical entity dictionary matches. Zero un-guided LLM entities in active graph.
3. **100% Provenance Coverage:** Every active node and edge links to valid `memoryId`, `fragmentId`, and SHA-256 content hash.
4. **Sub-10ms Relational Queries:** Depth-constrained subgraph queries (1–3 hops) execute in $< 10\text{ms}$ per tenant context.
5. **Strict Multi-Tenant Isolation:** 100% pass rate on multi-tenant security test suites verifying zero cross-user graph leakage.

---

## 7. Explicit Exclusions from Phase 2

To maintain strict scope boundaries, the following capabilities are **EXPLICITLY EXCLUDED** from Phase 2 and deferred to future engines:

* **Excluded: Multi-Hop Causal Reasoning & Logic Chains** (Belongs strictly to Engine 5 — Reasoning Engine).
* **Excluded: Reflective Prompt Generation & Insight Mirrors** (Belongs strictly to Engine 6 — Reflection Engine).
* **Excluded: Unsupervised Spatial & Vector Theme Clustering** (Belongs strictly to Engine 4 — Cognitive Engine).
* **Excluded: Autonomous Decision-Making or Conversational Advice** (Out of project scope).
* **Excluded: Automated Background Graph Mutation without User Confirmation** (Disqualified by Experiment 003 Constraint).

---

## 8. Proposed Phase 2 Roadmap & Sprint Breakdown

```
Sprint 2A.1 (Current)  ──► Sprint 2A.2           ──► Sprint 2B                ──► Sprint 2C             ──► Sprint 2D
[Conceptual Architecture]  [Relational Schema     [Mediated Validation Engine  [Evidence Lineage        [Subgraph Query Engine
                           & Data Model Design]    & Candidate Queue (MVI)]     & Graph Persistence]     & Phase 2 Audit]
```

### Sprint 2A.1 (Current Milestone)
* **Goal:** Conceptual Architecture, Engine Boundaries, Governing Principles, and Phase 2 Roadmap Design.
* **Deliverables:** Conceptual Architecture Specification (`KNOWLEDGE_GRAPH_CONCEPTUAL_ARCHITECTURE.md`).

### Sprint 2A.2: Relational Data Model & Schema Specification
* **Goal:** Design type-safe Drizzle ORM relational database schema for nodes, typed edges, candidate queues, and evidence links.
* **Deliverables:** Relational Schema Architecture Document (`KNOWLEDGE_GRAPH_SCHEMA_SPEC.md`). No production code.

### Sprint 2B: Mediated Validation Engine & Candidate Queue (MVI)
* **Goal:** Implement the candidate entity extraction staging queue (`PENDING_CONFIRMATION`) and Canonical Entity Dictionary resolution interface to fulfill the Experiment 003 Constraint.
* **Deliverables:** Production candidate queue repository, canonical entity matcher, and Vitest test suite.

### Sprint 2C: Evidence Provenance & Graph Persistence Layer
* **Goal:** Implement node and typed relationship edge creation services with mandatory `memoryId` and `fragmentId` evidence linking.
* **Deliverables:** Production graph repository, edge persistence services, and multi-tenant isolation unit tests.

### Sprint 2D: Subgraph Retrieval Query Engine & Phase 2 Integration Verification
* **Goal:** Implement depth-constrained recursive graph traversal query APIs and conduct final Phase 2 Engineering Audit.
* **Deliverables:** Subgraph query engine, integration test suite, and Phase 2 Final Audit Report.

---

## 9. Dependency Map

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                           PHASE 2 DEPENDENCY MAP                               │
│                                                                                │
│  Sprint 2A.1: Conceptual Architecture (Foundation Document)                    │
│       │                                                                        │
│       ▼                                                                        │
│  Sprint 2A.2: Relational Schema & Data Model Specification                     │
│       │                                                                        │
│       ▼                                                                        │
│  Sprint 2B: Mediated Validation Engine & Candidate Queue (MVI)                 │
│       │ (Requires Schema & Candidate Queue Types)                              │
│       ▼                                                                        │
│  Sprint 2C: Evidence Provenance & Graph Persistence Layer                      │
│       │ (Requires Validated Candidate Output & Evidence Schemas)               │
│       ▼                                                                        │
│  Sprint 2D: Subgraph Retrieval Query Engine & Final Phase 2 Audit              │
│         (Requires Persisted Graph Nodes, Edges, & Provenance Links)            │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Architectural Risk Register & Open Questions

| Risk ID | Description | Severity | Mitigation Strategy | Validation Status |
|---|---|---|---|---|
| **R-01** | **User Friction in Candidate Entity Confirmation:** Requiring manual confirmation for candidates could increase user overhead. | **Medium** | Introduce a high-confidence Canonical Entity Dictionary so repeat entities (*"Rahul"*, *"Expense Tracker"*) auto-confirm after first approval. | *To be validated in Sprint 2B* |
| **R-02** | **Recursive Query Latency in PostgreSQL:** Multi-hop graph traversals could degrade database performance as graph size grows. | **High** | Enforce strict depth limits ($\text{max\_depth} \le 3$), index compound keys `(user_id, source_id, target_id)`, and benchmark query latency. | *To be validated in Sprint 2D* |
| **R-03** | **Stale Candidate Queues:** Unconfirmed candidate entities accumulating over time. | **Low** | Implement automated candidate expiration policies (e.g., auto-purge unconfirmed candidates after 30 days without mutating memory). | *To be validated in Sprint 2B* |

---

## 11. Explicit Architectural Assumptions

### Assumptions Supported by Empirical Evidence (Phase 1 Baseline)
1. **Vector Retrieval Alone Cannot Replace Graph Structure:** Validated in Sprint 1C-C Workstream 1; vector similarity exhibits distance dilution on technical multi-word queries.
2. **Un-Guided LLM Extraction Is Unsafe for Production Knowledge Graphs:** Validated in Experiment 003 ($38.10\%$ hallucination rate vs $2.0\%$ ceiling).
3. **PostgreSQL Relational Storage Is Sufficient for Graph Baseline:** Validated by architectural constraint avoiding external graph DB complexity (Neo4j/Pinecone).

### Assumptions Requiring Validation in Phase 2
1. **Canonical Entity Dictionary Reduces Candidate Queue Volume by $> 80\%$:** Hypothesis to be empirically tested in Sprint 2B.
2. **Depth-Constrained Recursive CTE Queries Execute in $< 10\text{ms}$ at Scale:** Hypothesis to be benchmarked in Sprint 2D.
