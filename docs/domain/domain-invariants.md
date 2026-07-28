# 🛡️ Non-Negotiable Domain Invariants

> **System Rules That Must NEVER Be Violated**
>
> This document details the absolute invariants governing the Cognitive Engine domain model. Any operation, service call, or data mutation that violates an invariant is invalid and must throw a domain boundary error.

---

## The 10 Core Domain Invariants

### 1. Evidence Lineage Invariant
> *"A Reflection cannot exist without Evidence."*
* **Rule:** Every `MetacognitiveReflection` MUST reference a valid, verified `EvidenceChain` ID.
* **Enforcement:** If `reflection.evidence_chain_id` is null or `EvidenceChain.is_verified == false`, object creation fails immediately.

### 2. Evidence Fragment Integrity Invariant
> *"Evidence cannot reference deleted or non-existent fragments."*
* **Rule:** Every `EvidenceReference` inside an `EvidenceChain` MUST resolve to an active, valid `CognitiveFragment` ID in domain storage.
* **Enforcement:** Verification logic rejects evidence chains containing dangling or invalid UUID references.

### 3. Confidence Origin Invariant
> *"Confidence cannot originate from an LLM."*
* **Rule:** All `AlgorithmicConfidence` scores MUST be calculated mathematically by the `Cognitive Engine` using deterministic formulas (vector distance, graph density, occurrence frequency).
* **Enforcement:** No prompt or LLM text generation step is permitted to emit numerical confidence values.

### 4. Deterministic Discovery Invariant
> *"Discovery must be deterministic whenever possible."*
* **Rule:** `Clusters`, `TemporalSequences`, `Patterns`, and `GraphEdges` MUST be discovered via deterministic math, vector geometry, and graph algorithms — NEVER via LLM prompting.
* **Enforcement:** The `Cognitive Engine` has zero external LLM SDK dependencies.

### 5. Immutable Memory Invariant
> *"Memory content never mutates."*
* **Rule:** `CognitiveFragment.raw_content` and `MemoryNode.content` are 100% immutable once written.
* **Enforcement:** Updates to memory alter decay metadata or generate new versioned nodes; raw text content is read-only forever.

### 6. Graph Node Versioning Invariant
> *"Graph entities are versioned, never overwritten."*
* **Rule:** Any update to a `GraphNode` or `GraphEdge` attributes increments its `version` counter and produces a new immutable record.
* **Enforcement:** Full history of graph topology is preserved for evidence audit trails.

### 7. Minimum Evidence Threshold Invariant
> *"Patterns require minimum supporting evidence."*
* **Rule:** A `Pattern` object CANNOT be instantiated unless its supporting occurrence count $N_{\text{samples}} \ge 3$.
* **Enforcement:** Single or double occurrences are classified as transient noise and discarded.

### 8. LLM Boundary Invariant
> *"LLMs explain validated evidence; LLMs do not invent facts."*
* **Rule:** The LLM's access is restricted to reading pre-validated `ReasoningArtifact` data to synthesize prose explanations.
* **Enforcement:** Automated verification checks run on all generated prose to confirm all mentioned entities exist in the linked `EvidenceChain`.

### 9. Separation of Storage and Graph Invariant
> *"Vector storage and Knowledge Graph topology must remain decoupled."*
* **Rule:** `MemoryEngine` manages vector space and decay; `KnowledgeGraphEngine` manages entity nodes and directional edges.
* **Enforcement:** Graph traversal occurs over explicit graph edges, not over raw vector similarity thresholds.

### 10. Non-Destructive Decay Invariant
> *"Memory decay never destroys user thoughts."*
* **Rule:** A decay score of 0.00 transitions a `MemoryNode` to `Archived` state. It is never deleted from storage.
* **Enforcement:** Hard deletion operations are prohibited at the domain model level.
