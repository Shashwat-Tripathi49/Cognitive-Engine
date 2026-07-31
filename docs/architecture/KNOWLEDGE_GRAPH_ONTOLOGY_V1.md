# Knowledge Graph Ontology & Domain Model Architecture (v1.0)

> **Document Status:** Conceptual Ontology Specification (Phase 2 Architecture Baseline)  
> **Target Engine:** Engine 3 — Knowledge Graph Engine  
> **Effective Date:** 2026-07-31  
> **Version:** 1.0.0  
> **Scope:** Defines the first-class node types, rejected node types, relationship vocabulary, graph invariants, canonical identity principles, provenance model, graph growth philosophy, and explicit phase boundaries for the Knowledge Graph Engine.  
> **Mandatory Constraint:** Architecture only. No SQL, Drizzle schemas, TypeScript interfaces, APIs, migrations, or production code.

---

## Executive Purpose & Ontology Philosophy

The **Knowledge Graph Ontology** defines the conceptual vocabulary of human thought structures represented within the Cognitive Engine.

### Core Philosophy
1. **The Graph is NOT the Source of Truth:** Immutable `CognitiveFragments` (Engine 1) and derived `Memory` items (Engine 2) remain the sole source of truth. The Knowledge Graph is an indexed, relational lens over that source evidence.
2. **Provenance is Mandatory:** No graph element (Node or Edge) can exist in isolation. Every node and edge must point to verifiable source memories, fragment IDs, timestamps, and confidence scores.
3. **Experiment 003 Binding Constraint:** Raw, un-guided LLM entity extraction is **DISQUALIFIED**. No extracted candidate entity can enter the active Knowledge Graph without passing through a future validation stage (human confirmation or a user-verified canonical dictionary match).

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  ONTOLOGY BOUNDARY                                      │
│                                                                                         │
│  SOURCE MEMORY EVIDENCE              CONCEPTUAL ONTOLOGY              DISQUALIFIED      │
│  [CognitiveFragment]    ──►   ┌──────────────────────────┐    ◄───   [Un-guided LLM     │
│  [Memory Item]                │ Node & Edge Taxonomy     │           Entity Output]     │
│  [SHA-256 Hash]               │ Provenance Links         │           (38.1% Hallucination│
│  [User Validation]      ──►   │ Canonical Identity Rules │            Rate Excluded)    │
│                               └──────────────────────────┘                              │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Workstream 1 — First-Class Node Taxonomy (Included in Phase 2 v1)

The following 7 first-class node types represent the primary concrete entities of human experience. Each inclusion is strictly justified by domain requirements, evidence sources, and validation rules.

### 1.1 `Person`
* **Definition:** An individual human being with whom the user interacts, collaborates, or maintains a social/professional relationship.
* **Justification for v1:** Human relationships form the primary anchor of episodic personal memory (*"Met Rahul"*, *"Call with Priya"*).
* **Originating Evidence:** Mentions of proper names in journal entries, communication logs, meeting notes.
* **Human Confirmation Requirement:** **MANDATORY.** Proposed person entities enter a candidate queue to prevent name collision and hallucination.

### 1.2 `Project`
* **Definition:** A bounded, goal-oriented engineering, personal, or professional initiative spanning multiple activities over time (e.g. *"Expense Tracker"*, *"Cognitive Engine Monorepo"*).
* **Justification for v1:** Projects group temporal actions and technical artifacts into meaningful thematic units.
* **Originating Evidence:** Repeated project references in work notes, task updates, repository commits.
* **Human Confirmation Requirement:** **MANDATORY.** Required to map generic terms (*"the app"*, *"the project"*) to canonical project entities.

### 1.3 `Topic` / `Domain`
* **Definition:** A subject matter area, field of study, or conceptual domain (e.g. *"Vector Search"*, *"System Design"*, *"Quantitative Aptitude"*).
* **Justification for v1:** Enables conceptual linking between learning activities, interview prep, and project execution.
* **Originating Evidence:** Technical terms, study logs, domain keywords present in memory items.
* **Human Confirmation Requirement:** **MANDATORY.** Canonical dictionary matching or user confirmation required to prevent duplicate topic nodes.

### 1.4 `Goal` / `Milestone`
* **Definition:** An explicit, target objective or career/personal milestone (e.g. *"CAT 2026 Preparation"*, *"Placement Preparation"*).
* **Justification for v1:** Provides directional context for why specific activities and study habits occur.
* **Originating Evidence:** Explicit goal statements, exam preparation entries, career roadmap notes.
* **Human Confirmation Requirement:** **MANDATORY.**

### 1.5 `Organization` / `Company`
* **Definition:** A legal entity, corporate workplace, academic institution, or group (e.g. *"University"*, *"Tech Corp"*).
* **Justification for v1:** Grounds professional context, employment history, and academic prep.
* **Originating Evidence:** Workplace mentions, company references, interview logs.
* **Human Confirmation Requirement:** **MANDATORY.**

### 1.6 `Place` / `Location`
* **Definition:** A physical geographic location, city, venue, or trip destination (e.g. *"Himachal"*, *"Kyoto"*, *"Local Cafe"*).
* **Justification for v1:** Provides spatial grounding for travel memories, outdoor activities, and social meetups.
* **Originating Evidence:** Location names, travel itineraries, venue mentions.
* **Human Confirmation Requirement:** **MANDATORY.**

### 1.7 `Tool` / `Technology`
* **Definition:** A specific software library, framework, tool, language, or technical instrument (e.g. *"React"*, *"Node.js"*, *"PostgreSQL"*, *"Drizzle ORM"*).
* **Justification for v1:** Essential for technical knowledge management, skill mapping, and stack tracking.
* **Originating Evidence:** Tech stack mentions, codebase documentation, library references.
* **Human Confirmation Requirement:** **MANDATORY.** Match against verified tech canonical list or user approval.

---

## 2. Workstream 2 — Explicitly Rejected Node Types (Phase 2 Exclusions)

To maintain strict scope boundaries and single-responsibility principles, the following node types are **EXPLICITLY REJECTED** from Phase 2 v1.

### 2.1 `Emotion` / `Mood` (e.g. *Frustrated*, *Positive*)
* **Reason for Exclusion:** Emotions are transient, subjective metadata attributes of individual memory fragments, not long-term structural knowledge entities.
* **Target Engine / Phase:** Belongs to **Memory Metadata** (Engine 2) and **Reflection Engine** (Engine 6).
* **Boundary Violation if Included:** Creating nodes for transient feelings causes extreme graph bloat and confuses structural knowledge with emotional state tracking.

### 2.2 `Task` / `Action Item` (e.g. *"Fix bug #42"*)
* **Reason for Exclusion:** Tasks are transient operational directives managed by task trackers, not permanent nodes in a long-term knowledge graph.
* **Target Engine / Phase:** Belongs to external Task Systems or Capture Metadata.
* **Boundary Violation if Included:** Treating short-lived to-dos as knowledge nodes degrades sub-graph traversal quality.

### 2.3 `Habit` / `Routine` (e.g. *"Daily 5km run"*)
* **Reason for Exclusion:** Habits are statistical behavioral patterns discovered across time, not static discrete entities.
* **Target Engine / Phase:** Belongs strictly to **Cognitive Pattern Engine** (Engine 4).
* **Boundary Violation if Included:** Introducing habit nodes in Phase 2 requires unsupervised temporal clustering, violating Engine 3 scope boundaries.

### 2.4 `Document` / `File` (e.g. `resume.pdf`, `notes.md`)
* **Reason for Exclusion:** Files are source containers, not knowledge entities. The graph indexes the *entities contained within documents*, not the document files themselves.
* **Target Engine / Phase:** Belongs strictly to **Capture Engine** (Engine 1) modality metadata.
* **Boundary Violation if Included:** Confounding source containers with knowledge entities violates provenance separation.

### 2.5 `Insight` / `Reflective Prompt`
* **Reason for Exclusion:** Reflective insights are high-order syntheses produced by reasoning over evidence.
* **Target Engine / Phase:** Belongs strictly to **Reflection Engine** (Engine 6).
* **Boundary Violation if Included:** Injecting AI-generated insights as raw graph nodes violates Principle 1 (Evidence-First Design) and risks feedback loops.

---

## 3. Workstream 3 — Relationship Vocabulary & Taxonomy

Relationships (Edges) define the semantic structure connecting nodes. Every relationship in Phase 2 must adhere to the following taxonomy:

| Relationship Type | Source Node $\rightarrow$ Target Node | Directionality | Symmetry | Evidence Required? | Confidence Range | Auto-Inference Policy |
|---|---|---|---|---|---|---|
| **`WORKED_ON`** | `Person` $\rightarrow$ `Project` | Directed | Asymmetric | **YES** | $0.0 - 1.0$ | Disqualified without candidate validation |
| **`COLLABORATED_WITH`** | `Person` $\leftrightarrow$ `Person` | Bidirectional | **Symmetric** | **YES** | $0.0 - 1.0$ | Disqualified without candidate validation |
| **`PREPARED_FOR`** | `Person` / `Topic` $\rightarrow$ `Goal` | Directed | Asymmetric | **YES** | $0.0 - 1.0$ | Disqualified without candidate validation |
| **`USES_TECHNOLOGY`** | `Project` $\rightarrow$ `Tool` / `Technology` | Directed | Asymmetric | **YES** | $0.0 - 1.0$ | Canonical dictionary matching allowed |
| **`BELONGS_TO`** | `Project` / `Topic` $\rightarrow$ `Organization` / `Topic` | Directed | Asymmetric | **YES** | $0.0 - 1.0$ | Canonical hierarchy matching allowed |
| **`LOCATED_AT`** | `Event` / `Person` $\rightarrow$ `Place` | Directed | Asymmetric | **YES** | $0.0 - 1.0$ | Disqualified without candidate validation |
| **`MENTIONED_WITH`** | `Entity` $\leftrightarrow$ `Entity` | Bidirectional | **Symmetric** | **YES** | $0.0 - 1.0$ | Co-occurrence count derived from source text |

### Relationship Semantics Rules:
1. **Mandatory Evidence:** An edge cannot exist unless supported by at least one explicit source `memoryId`.
2. **Confidence Score:** Every edge holds a confidence score based on validation quality (e.g., Explicit Human Confirmed = $1.0$, Canonical Dictionary Match = $0.90$, Co-occurrence tie = $0.50$).
3. **No Un-Guided Inferencing:** Edges can **never** be generated by autonomous LLM speculation.

---

## 4. Workstream 4 — Permanent Graph Invariants

The Knowledge Graph must permanently obey these 7 non-negotiable invariants:

1. **Memory is the Sole Source of Truth:** The graph is a derived index. If source memories are unavailable, the graph cannot fabricate data.
2. **Mandatory Provenance for Every Element:** Every node and edge MUST maintain explicit references to `originatingMemoryId`, `originatingFragmentId`, `sourceContentHash`, and `creationTimestamp`.
3. **No Orphan Nodes or Edges:** 
   * A node must connect to at least one valid memory evidence link.
   * An edge must connect two valid active nodes and point to valid source evidence.
4. **Zero Un-Guided LLM Entity Injection (Experiment 003 Binding Constraint):** No entity extracted by an un-guided generative model may enter the active graph without passing through candidate validation (human approval or canonical dictionary verification).
5. **Immutability of Source Evidence:** Creating, merging, or modifying graph nodes or edges must **NEVER** mutate, alter, or delete underlying `CognitiveFragment` or `Memory` records.
6. **Confidence Ceiling Bound to Evidence Quality:** The confidence score of a graph element can never exceed the verification quality of its underlying evidence (e.g., Unconfirmed Candidate $\le 0.40$, Human Confirmed $= 1.00$).
7. **Strict Multi-Tenant Isolation:** Every node, edge, and candidate queue item is strictly scoped to a single `userId`. Cross-tenant edge linking is impossible.

---

## 5. Workstream 5 — Canonical Identity Principles

Canonical identity governs when two entity references represent the same real-world object versus when they must remain separate.

```
"Rahul" (Text A)  ┐
                  ├─► [Matching Engine] ─► Context Check ─► Merge into Canonical "Rahul"
"Rahul Sharma"    ┘
```

### 5.1 When Nodes Should Merge (Canonical Equivalence)
Nodes are merged into a single canonical node with an alias list when:
1. **Exact Canonical Alias Match:** The names match an entry in the user's verified Canonical Entity Dictionary (e.g. *"Rahul Sharma"* and *"Rahul"* listed under the same user entity profile).
2. **User Explicit Confirmation:** The user explicitly approves a candidate merge recommendation in the validation queue.
3. **Unambiguous Contextual Anchor:** Both entries reference identical co-occurring entities, dates, and projects with $100\%$ overlapping evidence lineage.

### 5.2 When Nodes Should Remain Separate
Nodes must remain separate when:
1. **Contextual Disambiguation Conflict:** Entry A refers to *"Rahul"* (Co-worker at Tech Corp) and Entry B refers to *"Rahul"* (College friend in Himachal). Disparate domain contexts force separate nodes.
2. **Distinct Entity Types:** *"React"* (the Technology) vs *"React Project"* (a specific user app). They represent different node types (`Tool` vs `Project`).

### 5.3 When Ambiguity Must Remain Unresolved
When an entity reference is ambiguous (e.g., *"RS"*, *"the client"*):
* The reference **MUST NOT** be forcefully merged or guessed.
* It remains staged in the `PENDING_CONFIRMATION` Candidate Queue or retained as a weak evidence link until unambiguous evidence or user input resolves the identity.

---

## 6. Workstream 6 — Provenance Model

Conceptually, every graph element maintains a complete provenance ledger:

### 6.1 Node Provenance Model
* `originatingMemoryIds`: Array of supporting memory entity IDs.
* `originatingFragmentIds`: Array of source cognitive fragment IDs.
* `sourceContentHashes`: Array of SHA-256 hashes of the source fragments.
* `firstObservedAt`: Timestamp of first appearance in memory.
* `lastObservedAt`: Timestamp of most recent memory evidence.
* `confidenceScore`: Float value ($0.0 - 1.0$).
* `validationStatus`: State enum (`CANONICAL_DICTIONARY_MATCH`, `HUMAN_CONFIRMED`, `PENDING_CONFIRMATION`).

### 6.2 Edge Provenance Model
* `sourceNodeId`: Originating node ID.
* `targetNodeId`: Destination node ID.
* `supportingMemoryIds`: Array of memory IDs asserting this relationship.
* `evidenceCount`: Total number of distinct source memories confirming the edge.
* `relationConfidence`: Float value ($0.0 - 1.0$).
* `creationReason`: Audit trail explanation (e.g., *"Direct co-occurrence in Memory #mem_01 validated by User"*).

---

## 7. Workstream 7 — Graph Growth Philosophy

The Knowledge Graph evolves organically alongside human thought capture based on four growth principles:

1. **Incremental Monotonic Growth:** New memories add evidence to existing nodes/edges or stage new candidate entities. The graph grows iteratively without requiring full-graph re-indexing.
2. **Evidence Reinforcement:** Repeated mentions of a relationship across multiple distinct memories increase edge `evidenceCount` and elevate `relationConfidence`.
3. **Contradictory Evidence Handling:** If a new memory contradicts an existing edge (e.g., *"Left Expense Tracker project"* vs past *"Working on Expense Tracker"*), the old edge is NOT deleted. Its `validTo` timestamp is closed, and a new status edge is created, preserving historical truth.
4. **Impact of Source Memory Deletion:** If a user deletes a source `CognitiveFragment`, the graph recalculates evidence links. If a node or edge loses all supporting memory links, it is marked `UNGROUNDED` and safely soft-removed, preserving Invariant 3 (No Orphan Nodes).

---

## 8. Workstream 8 — Explicit Out-of-Scope Boundaries (Phase 2 Exclusions)

The following high-order cognitive capabilities are **DELIBERATELY EXCLUDED** from Phase 2 and reserved for future engines:

* **Reasoning & Multi-Hop Logic Chains:** Belongs to **Reasoning Engine (Engine 5)**.
* **Reflective Prompting & Mirroring:** Belongs to **Reflection Engine (Engine 6)**.
* **Unsupervised Spatial/Vector Theme Clustering:** Belongs to **Cognitive Pattern Engine (Engine 4)**.
* **Automated Memory Decay & Forgetting Algorithms:** Deferred beyond Phase 1/2 as documented in Section 7 of `ARCHITECTURE_BASELINE_V1.md`.
* **Autonomous Entity Graph Mutation without User Validation:** Disqualified by **Experiment 003 Constraint**.

---

## 9. Open Conceptual Questions

The following conceptual questions remain open for architectural evaluation in Sprint 2A.3:

1. **Entity Hierarchy Granularity:** Should `Tool` (e.g. *React*) be modeled as a sub-type of `Topic` or maintain its own top-level node classification?
2. **Co-Occurrence Edge Thresholds:** What minimum co-occurrence frequency ($N \ge 2$ vs $N \ge 3$) should trigger a candidate `MENTIONED_WITH` edge in the candidate queue?

---

## 10. Summary & Transition to Sprint 2A.3

### Ontology Summary:
* **7 First-Class Node Types:** `Person`, `Project`, `Topic`, `Goal`, `Organization`, `Place`, `Tool`.
* **5 Rejected Node Types:** `Emotion`, `Task`, `Habit`, `Document`, `Insight`.
* **7 Relationship Types:** `WORKED_ON`, `COLLABORATED_WITH`, `PREPARED_FOR`, `USES_TECHNOLOGY`, `BELONGS_TO`, `LOCATED_AT`, `MENTIONED_WITH`.
* **Non-Negotiable Invariants:** Evidence provenance, zero un-guided LLM entity injection, memory as sole truth.

### Maturity Assessment:
The ontology is conceptually complete, rigorous, fully bounded, and compliant with all Phase 1 baseline decisions and Experiment 003 constraints. It is **100% mature and ready for Sprint 2A.3 (Relational Schema Design)**.
