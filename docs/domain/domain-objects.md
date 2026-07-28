# 📦 Domain Object Specifications

> Complete technology-agnostic conceptual specifications for all core domain objects in the Cognitive Engine.

---

## 1. Cognitive Fragment

* **Purpose:** The atomic, normalized, immutable representation of ingested human thought.
* **Owned By Engine:** `Capture Engine`
* **Created By:** `Capture Engine`
* **Consumed By:** `Memory Engine`
* **Lifecycle:** `Created` → `Immutable` (Never modified or deleted)
* **Required Fields:**
  * `fragment_id`: Universal unique domain identifier
  * `raw_content`: Unaltered normalized text string
  * `modality`: Enum (`text`, `voice_transcript`, `web_highlight`, `structured_prompt`, `image_annotation`)
  * `content_hash`: SHA-256 cryptographic hash of raw content
  * `captured_at`: ISO-8601 timestamp
* **Optional Fields:** `source_url`, `device_context`, `user_applied_tags`
* **Relationships:** Belongs to 1 User; Maps to 1 `Memory Node`.
* **Validation Rules:** `raw_content` must not be empty; `content_hash` must match hash of content.
* **Immutability:** 100% Immutable.
* **Example Conceptual Instance:**
  ```json
  {
    "fragment_id": "frag_987f6543-e21b-4567-89ab-424242424242",
    "raw_content": "I realized today that decision fatigue sets in whenever I schedule more than 3 strategic meetings before noon.",
    "modality": "text",
    "content_hash": "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
    "captured_at": "2026-07-28T09:15:00Z",
    "source_url": null,
    "user_applied_tags": ["productivity", "decisions"]
  }
  ```

---

## 2. Memory Node

* **Purpose:** Encoded representation of a Cognitive Fragment containing vector embeddings and decay tracking metadata.
* **Owned By Engine:** `Memory Engine`
* **Created By:** `Memory Engine`
* **Consumed By:** `Knowledge Graph Engine`, `Cognitive Engine`, `Reasoning Engine`
* **Lifecycle:** `Encoded` → `Active` → `Decaying` → `Consolidated` / `Archived`
* **Required Fields:**
  * `memory_id`: Domain identifier
  * `fragment_id`: Reference to source `Cognitive Fragment`
  * `embedding_id`: Reference to associated `Embedding`
  * `memory_type`: Enum (`working`, `episodic`, `semantic`)
  * `decay_score`: Float (0.0 to 1.0; 1.0 = fresh, 0.0 = completely decayed)
  * `access_count`: Integer (retrieval count)
  * `created_at`: Timestamp
* **Optional Fields:** `last_accessed_at`, `consolidated_into_node_id`
* **Relationships:** References 1 `Cognitive Fragment`; References 1 `Embedding`; Maps to 1..* `Graph Nodes`.
* **Validation Rules:** `decay_score` must stay within [0.0, 1.0].
* **Immutability:** Content is immutable; decay metadata updates in-place.
* **Example Conceptual Instance:**
  ```json
  {
    "memory_id": "mem_11223344-5566-7788-9900-aabbccddeeff",
    "fragment_id": "frag_987f6543-e21b-4567-89ab-424242424242",
    "embedding_id": "emb_55555555-4444-3333-2222-111111111111",
    "memory_type": "episodic",
    "decay_score": 0.95,
    "access_count": 3,
    "created_at": "2026-07-28T09:15:02Z"
  }
  ```

---

## 3. Embedding

* **Purpose:** Mathematical vector representation of a Memory Node for semantic similarity search.
* **Owned By Engine:** `Memory Engine`
* **Created By:** `Memory Engine`
* **Consumed By:** `Memory Engine`, `Cognitive Engine`
* **Lifecycle:** `Generated` → `Immutable`
* **Required Fields:**
  * `embedding_id`: Identifier
  * `memory_id`: Target Memory Node
  * `dimensions`: Integer (e.g., 1536)
  * `vector`: Array of Float
  * `model_signature`: String identifier of embedding model version
* **Relationships:** Belongs to 1 `Memory Node`.
* **Validation Rules:** Vector array length must equal `dimensions`.
* **Immutability:** 100% Immutable. Re-embedding creates a new `Embedding` object.

---

## 4. Graph Node (Entity)

* **Purpose:** Canonical representations of distinct concepts, actors, tools, topics, or events in the user's thought model.
* **Owned By Engine:** `Knowledge Graph Engine`
* **Created By:** `Knowledge Graph Engine`
* **Consumed By:** `Cognitive Engine`, `Reasoning Engine`, `Reflection Engine`
* **Lifecycle:** `Extracted` → `Active` → `Versioned`
* **Required Fields:**
  * `graph_node_id`: Unique identifier
  * `canonical_name`: String (standardized name, e.g., "Decision Fatigue")
  * `entity_type`: Enum (`concept`, `person`, `tool`, `event`, `location`, `project`)
  * `supporting_memory_ids`: List of Memory Node UUIDs providing evidence
  * `version`: Integer
* **Optional Fields:** `aliases`, `attributes`
* **Relationships:** Linked to 1..* `Memory Nodes`; Connects via 1..* `Graph Edges`.
* **Validation Rules:** `supporting_memory_ids` must contain at least 1 valid Memory Node ID.
* **Immutability:** Versioned. Structural changes spawn a new node version.

---

## 5. Graph Edge (Relationship)

* **Purpose:** Directional, typed relationship linking two Graph Nodes with explicit structural evidence.
* **Owned By Engine:** `Knowledge Graph Engine`
* **Created By:** `Knowledge Graph Engine`
* **Consumed By:** `Cognitive Engine`, `Reasoning Engine`
* **Lifecycle:** `Created` → `Active` → `Versioned`
* **Required Fields:**
  * `edge_id`: Unique identifier
  * `source_node_id`: Source Graph Node ID
  * `target_node_id`: Target Graph Node ID
  * `relationship_type`: Enum (`causes`, `contradicts`, `precedes`, `relates_to`, `part_of`, `influences`)
  * `weight`: Float (0.0 to 1.0, calculated mathematically)
  * `evidence_memory_ids`: List of Memory Node UUIDs supporting this exact edge
* **Relationships:** Links 2 `Graph Nodes`; References 1..* `Memory Nodes`.
* **Validation Rules:** `source_node_id` != `target_node_id` (no self-referential loops); `evidence_memory_ids` must not be empty.
* **Immutability:** Versioned. Edge weight changes create a new immutable version.

---

## 6. Knowledge Graph Subgraph

* **Purpose:** A coherent slice of the knowledge graph representing a connected neighborhood of entities and relationships.
* **Owned By Engine:** `Knowledge Graph Engine`
* **Created By:** `Knowledge Graph Engine`
* **Consumed By:** `Cognitive Engine`, `Reasoning Engine`
* **Lifecycle:** `Assembled` → `Transient`
* **Required Fields:** `subgraph_id`, `node_ids`, `edge_ids`, `root_node_id`, `depth`

---

## 7. Cluster

* **Purpose:** Algorithmically grouped collection of Memory Nodes and Graph Nodes based on vector space density and topological graph proximity.
* **Owned By Engine:** `Cognitive Engine` (Deterministic)
* **Created By:** `Cognitive Engine` (via HDBSCAN / graph algorithms)
* **Consumed By:** `Reasoning Engine`
* **Lifecycle:** `Computed` → `Active` → `Superseded`
* **Required Fields:**
  * `cluster_id`: Unique identifier
  * `member_node_ids`: List of Memory and Graph Node UUIDs
  * `density_score`: Float (0.0 to 1.0)
  * `centroid_vector`: Array of Float
  * `computed_at`: Timestamp
* **Invariants:** Computed 100% deterministically. Zero LLM involvement.

---

## 8. Temporal Sequence

* **Purpose:** An ordered time-series sequence of events, thoughts, or entity state changes.
* **Owned By Engine:** `Cognitive Engine` (Deterministic)
* **Created By:** `Cognitive Engine`
* **Consumed By:** `Reasoning Engine`, `Reflection Engine`
* **Lifecycle:** `Calculated` → `Immutable`
* **Required Fields:**
  * `sequence_id`: Identifier
  * `ordered_node_ids`: Ordered list of `MemoryNode` UUIDs sorted by `captured_at`
  * `time_span_seconds`: Float
  * `frequency_delta`: Float (mathematical rate of occurrence)

---

## 9. Pattern

* **Purpose:** A recurring structural, causal, or temporal configuration detected deterministically across memory clusters and graph sequences.
* **Owned By Engine:** `Cognitive Engine` (Deterministic)
* **Created By:** `Cognitive Engine`
* **Consumed By:** `Reasoning Engine`, `Reflection Engine`
* **Lifecycle:** `Discovered` → `Validated` → `Archived`
* **Required Fields:**
  * `pattern_id`: Unique identifier
  * `pattern_type`: Enum (`recurring_sequence`, `cluster_co_occurrence`, `temporal_spike`, `structural_loop`)
  * `supporting_cluster_ids`: List of Cluster IDs
  * `supporting_sequence_ids`: List of Temporal Sequence IDs
  * `occurrence_count`: Integer (must be ≥ 3)
  * `confidence_id`: Reference to `Algorithmic Confidence`
* **Validation Rules:** Must have `occurrence_count` ≥ 3 to prevent false positives.

---

## 10. Algorithmic Confidence

* **Purpose:** Mathematically computed confidence score for patterns, edges, and clusters based on sample size, variance, and vector distance.
* **Owned By Engine:** `Cognitive Engine`
* **Created By:** `Cognitive Engine`
* **Consumed By:** `Reasoning Engine`, `Reflection Engine`
* **Lifecycle:** `Calculated` → `Immutable`
* **Required Fields:**
  * `confidence_id`: Identifier
  * `score`: Float (0.00 to 1.00)
  * `sample_size`: Integer
  * `vector_variance`: Float
  * `graph_density`: Float
  * `formula_signature`: String (identifier of math formula applied)
* **Invariant:** **CONSTRAINED.** Cannot originate from or be modified by an LLM.

---

## 11. Reasoning Artifact

* **Purpose:** A verified logical evaluation or relationship discovery that has passed formal graph logic and evidence validation.
* **Owned By Engine:** `Reasoning Engine`
* **Created By:** `Reasoning Engine`
* **Consumed By:** `Reflection Engine`
* **Lifecycle:** `Verified` → `Active` → `Archived`
* **Required Fields:**
  * `artifact_id`: Identifier
  * `reasoning_type`: Enum (`analogical_proof`, `causal_chain`, `contradiction_pair`, `thematic_alignment`)
  * `pattern_id`: Source `Pattern` reference
  * `evidence_chain_id`: Mandatory reference to verified `Evidence Chain`
  * `confidence_score`: Float (inherited from `Algorithmic Confidence`)
  * `created_at`: Timestamp
* **Validation Rules:** Cannot exist without a valid, verified `evidence_chain_id`.

---

## 12. Evidence Chain

* **Purpose:** The ordered, unbroken chain of proofs linking high-level patterns down to raw Cognitive Fragments.
* **Owned By Engine:** `Reasoning Engine`
* **Created By:** `Reasoning Engine`
* **Consumed By:** `Reflection Engine`, `Presentation Layer`
* **Lifecycle:** `Constructed` → `Verified` → `Immutable`
* **Required Fields:**
  * `chain_id`: Identifier
  * `root_pattern_id`: Source Pattern ID
  * `evidence_references`: List of `Evidence Reference` objects
  * `is_verified`: Boolean (true if 100% of underlying nodes exist and are valid)
  * `verified_at`: Timestamp

---

## 13. Evidence Reference

* **Purpose:** Individual link within an Evidence Chain mapping a single assertion to a Graph Node/Edge and Memory Node.
* **Owned By Engine:** `Reasoning Engine`
* **Created By:** `Reasoning Engine`
* **Required Fields:** `reference_id`, `graph_node_id`, `graph_edge_id`, `memory_node_id`, `fragment_id`

---

## 14. Evidence Provenance

* **Purpose:** Immutable audit record documenting the exact timestamp, engine versions, and algorithm signatures that produced an Evidence Chain.
* **Owned By Engine:** `Reasoning Engine`
* **Required Fields:** `provenance_id`, `chain_id`, `computed_by_engine_version`, `hash_signature`, `timestamp`

---

## 15. Metacognitive Reflection

* **Purpose:** Natural language explanation of a validated `Reasoning Artifact` and `Evidence Chain`, describing how the user thinks without giving advice or recommendations.
* **Owned By Engine:** `Reflection Engine`
* **Created By:** `Reflection Engine` (LLM-assisted text synthesis strictly constrained by Evidence Chain)
* **Consumed By:** User Output / Presentation Layer
* **Lifecycle:** `Generated` → `Active` → `Archived`
* **Required Fields:**
  * `reflection_id`: Identifier
  * `reasoning_artifact_id`: Source Reasoning Artifact ID
  * `evidence_chain_id`: Source Evidence Chain ID
  * `explanation_text`: Human prose explaining the pattern
  * `reflection_type`: Enum (`pattern_mirror`, `temporal_evolution`, `contradiction_highlight`, `blind_spot_map`)
  * `created_at`: Timestamp
* **Invariants:**
  * Must NOT contain recommendations, action items, or advice.
  * Must link directly to `evidence_chain_id`.

---

## 16. Reflection Report

* **Purpose:** A structured collection of Metacognitive Reflections covering a specific temporal window (e.g., weekly or monthly summary).
* **Owned By Engine:** `Reflection Engine`
* **Created By:** `Reflection Engine`
* **Required Fields:** `report_id`, `time_window_start`, `time_window_end`, `reflection_ids`, `summary_prose`

---

## 17. Source Reference

* **Purpose:** Attribution metadata capturing the origin of a Cognitive Fragment (e.g., URL, book title, recording device).
* **Owned By Engine:** `Capture Engine`
* **Required Fields:** `source_id`, `fragment_id`, `origin_type`, `uri`

---

## 18. Context

* **Purpose:** Scoped execution frame containing active working memory nodes for an analysis pass.
* **Owned By Engine:** `Memory Engine`
* **Required Fields:** `context_id`, `active_memory_node_ids`, `created_at`

---

## 19. Session

* **Purpose:** Temporal boundary defining an active period of user interaction.
* **Owned By Engine:** `Capture Engine`
* **Required Fields:** `session_id`, `user_id`, `started_at`, `ended_at`
