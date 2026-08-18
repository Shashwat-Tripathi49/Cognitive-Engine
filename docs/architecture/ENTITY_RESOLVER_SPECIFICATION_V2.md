# Entity Resolver Specification & Operating Protocol (v2.0)
## Knowledge Graph Engine (Engine 3) — Canonical Identity, Disambiguation & Lifecycle Service

> **Document Status:** Authoritative Engineering Specification (Phase 2 Component Specification)  
> **Target Component:** Engine 3 — Entity Resolution Service (`packages/shared/src/entities/resolver.ts`)  
> **Effective Date:** 2026-08-18  
> **Version:** 2.0.0 (Corrective Remediation Pass)  
> **Evidence Foundation:** Empirically validated via Experiments 003A, 004A, 004B, and 004C.  
> **Historical Predecessor:** Preserved unchanged at [`docs/architecture/ENTITY_RESOLVER_SPECIFICATION_V1.md`](file:///c:/Users/SHASHWAT%20TRIPATHI/OneDrive/Documents/Desktop/cognitive-engine/Cognitive-Engine/docs/architecture/ENTITY_RESOLVER_SPECIFICATION_V1.md)  

---

## 1. Architectural Purpose & Pipeline Boundary

In the Cognitive Engine architecture:
$$\text{Capture (Engine 1)} \longrightarrow \text{Memory (Engine 2)} \longrightarrow \mathbf{Entity \; Resolver \; (Engine \; 3)} \longrightarrow \text{Knowledge Graph} \longrightarrow \text{Cognitive Pattern (Engine 4)}$$

### Core Mandate
Raw model-extracted entity mentions are **untrusted candidates**. The **Entity Resolver** is the deterministic, evidence-bound gatekeeper that determines whether a grounded surface mention refers to an existing canonical entity, requires interactive human confirmation, or should remain an unresolved text annotation.

### Non-Negotiable Core Invariants
1. **Provenance & Historical Immutability:** Historical resolution decisions, reference edges, and source mentions are immutable. Corrections, splits, and merges create auditable mutation events rather than destructively rewriting history.
2. **Zero Evidence-Free Linking:** An entity cannot be linked to a canonical node without grounded source evidence and passing verified deterministic/semantic criteria.
3. **No Automatic Graph Node Creation from `NO_MATCH`:** Negative resolution (`NO_MATCH_UNRESOLVED`) simply means no existing canonical match was found; it never automatically generates a new Knowledge Graph node.
4. **Tenant Isolation:** All identity lookups, alias namespaces, confirmation queues, and mutation logs are strictly user-scoped (`user_id`). Cross-tenant lookup is architecturally impossible.
5. **Separation of Normalization from Persistent Alias Creation:** Lexical normalization is run-time resolution evidence; it never automatically creates persistent alias database records without explicit user confirmation.
6. **No Destructive Cascades:** Database `ON DELETE CASCADE` or in-place destructive FK modifications are strictly prohibited for identity histories. Current canonical state is projected through non-destructive successor pointers.

---

## 2. Grounded Mention Contract

The resolver must never operate on ungrounded, detached strings. Every input to the resolver must satisfy the `GroundedMention` contract:

```typescript
export type EntityType = 
  | 'Person' 
  | 'Project' 
  | 'Organization' 
  | 'Place' 
  | 'Tool' 
  | 'Topic' 
  | 'Goal';

export interface GroundedMention {
  id: string;                         // Unique mention UUID
  userId: string;                     // Tenant identifier
  sourceFragmentId: string;           // Provenance link to CognitiveFragment (Engine 1)
  sourceMemoryId: string;             // Provenance link to Memory Item (Engine 2)
  surfaceText: string;                // Exact substring extracted from text (e.g. "FastAPI")
  extractedType: EntityType;          // Candidate classification from extractor
  spanReference: {
    startCharOffset: number;          // Character offset within source fragment text
    endCharOffset: number;            // End character offset within source fragment text
    sentenceIndex?: number;           // Index of containing sentence
  };
  extractionConfidence: number;       // Confidence score from extraction pipeline
  extractorVersion: string;           // E.g., 'v3_high_only'
  extractedAt: string;                // ISO 8601 Timestamp
}

export interface ResolutionContext {
  temporalReferenceTime?: string;     // Creation timestamp of source journal entry
  recentFragmentIds?: string[];       // Recency window (Deferred for cross-document resolution)
  conversationScopeId?: string;       // Thread/session identifier if available
  activeEntityFocusIds?: string[];    // Entities actively discussed in immediate context
}
```

### Verification Invariant
Before resolution begins, the resolver validates that:
1. `sourceFragmentId` exists and belongs to `userId`.
2. The substring in `sourceFragment.content` from `startCharOffset` to `endCharOffset` matches `surfaceText` (modulo whitespace trimming).
3. If span verification fails, resolution is aborted with `UNGROUNDED_MENTION_ERROR`. Such mentions are **ineligible for automatic canonical linking**.

---

## 3. The 5-State Resolution Decision Model

Resolution attempts terminate in one of five mutually exclusive states:

```
                                  [ Grounded Mention Extracted ]
                                                │
                                                ▼
                                    [ Entity Resolver Service ]
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 ▼                              ▼                              ▼
          [ RESOLVED ]                  [ AMBIGUOUS ]                    [ NO_MATCH ]
                 │                              │                              │
                 ▼                              ▼                              ▼
    ┌────────────────────────┐    ┌───────────────────────────┐   ┌──────────────────────────┐
    │ High Confidence Match  │    │ Staged in Confirmation    │   │ Unresolved Mention       │
    │ Link to Canonical Node │    │ Queue (Suggested Match)   │   │ No Action / Isolated Ref │
    └────────────────────────┘    └─────────────┬─────────────┘   └────────────┬─────────────┘
                                                │                              │
                                   ┌────────────┴────────────┐                 │ User Initiates
                                   ▼                         ▼                 ▼ New Entity
                             [ Approved ]              [ Rejected ]   ┌──────────────────────┐
                                   │                         │        │ NEW_ENTITY_STAGED    │
                                   ▼                         ▼        └──────────┬───────────┘
                             (Link Entity)            (Dismiss/Split)            │ User Confirms
                                                                                 ▼
                                                                      (Create Canonical Node)
```

| Resolution State | Empirical Meaning | Knowledge Graph Mutation | User Confirmation Required? |
|---|---|---|:---:|
| **`RESOLVED`** | High-confidence match ($100.0\%$ precision on 64-case blind benchmark) | Immediate creation of `(MemoryItem)-[REFERENCES]->(CanonicalEntity)` with provenance | No |
| **`AMBIGUOUS_PENDING_CONFIRMATION`** | Semantic candidate ($0.75 \le \text{sim} < 0.80$), deictic noun, alias collision, or type conflict | **Zero graph mutation.** Staged in `candidate_confirmation_queue` | **Yes** |
| **`NO_MATCH_UNRESOLVED`** | Sub-threshold ($< 0.75$), structural modifier trap, or novel term | **Zero graph mutation.** Stored as unlinked text annotation on source fragment | No |
| **`NEW_ENTITY_STAGED`** | User-initiated or discovery-prompted proposal for a new canonical node | **Zero graph mutation** until user validates name, type, and uniqueness | **Yes** |
| **`REJECTED_DISMISSED`** | Suggested candidate rejected by user during review | **Zero graph mutation.** Recorded in audit log to suppress repeated suggestions | No |

---

## 4. Separation of Entity Identity from Entity Type

Entity identity (which real-world entity is referenced) and entity type (how the entity is categorized in the ontology) are separate evidence dimensions:

```
                           ┌────────────────────────┐
                           │ Grounded Surface Match │
                           └───────────┬────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
        [ Strong Identity Match ]             [ Weak / No Identity Match ]
                    │                                     │
          ┌─────────┴─────────┐                           ▼
          ▼                   ▼                       [ NO_MATCH ]
    [ Type Agrees ]     [ Type Disagrees ]
          │                   │
          ▼                   ▼
    [ RESOLVED ]     [ AMBIGUOUS_PENDING_CONFIRMATION ]
                     (Reason: TYPE_MISMATCH_CANDIDATE)
```

### Definitions & Policy Rules
1. **Type-Consistent Match:** Strong identity match where `extractedType == canonicalEntity.entityType`. Proceeds directly to `RESOLVED`.
2. **Type-Conflicting Candidate:** Strong identity match (e.g. Exact Canonical or Active Verified Alias) where `extractedType != canonicalEntity.entityType` (e.g., mention `"FastAPI"` extracted as `Topic`, but canonical entity `FastAPI` is registered as `Tool`).
   * **Rule:** A type mismatch **MUST NOT** force a strong identity match into `NO_MATCH_UNRESOLVED`.
   * **Action:** The resolver routes the mention to **`AMBIGUOUS_PENDING_CONFIRMATION`** with metadata:
     `{ routingReason: 'TYPE_MISMATCH_CANDIDATE', suggestedCanonicalId, extractedType, canonicalType }`.
3. **Type-Ambiguous Candidate:** Mention matches canonical entities across multiple types with equal confidence. Routes to `AMBIGUOUS_PENDING_CONFIRMATION`.
4. **User Resolution of Type Conflict:** When reviewing in UI, the user can:
   * Confirm the link retaining current canonical type (`Tool`).
   * Confirm the link and update canonical type to new type (`Topic`).
   * Reject the link as an unrelated entity.

---

## 5. Type-Aware 6-Layer Resolution Algorithm

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  LAYERED RESOLUTION WATERFALL                                    │
│                                                                                                  │
│  Grounded Mention ──► [ Layer 1: Anaphora & Ambiguity Filter ] ────────► PENDING_CONFIRMATION    │
│                                     │ (Pass)                                                     │
│                       [ Layer 2: Exact & Normalized Match ]   ─────────► RESOLVED (Type Checked) │
│                                     │ (Miss)                                                     │
│                       [ Layer 3: Active Verified Alias Lookup]─────────► RESOLVED (Type Checked) │
│                                     │ (Miss)                                                     │
│                       [ Layer 4: Structural Modifier Policy ] ─────────► NO_MATCH / PENDING      │
│                                     │ (Pass)                                                     │
│                       [ Layer 5: High-Precision String Sim ]  ─────────► RESOLVED (Type Checked) │
│                                     │ (Miss)                                                     │
│                       [ Layer 6: Type-Aware Embedding & Margin]───────► RESOLVED / PENDING       │
│                                     │ (Miss)                                                     │
│                       [ Layer 7: Semantic Confirmation Band ] ─────────► PENDING_CONFIRMATION    │
│                                     │ (Miss)                                                     │
│                                [ Fallback ]                   ─────────► NO_MATCH                │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Layer 1: Anaphora & Ambiguity Gatekeeper
* **Action:** Intercepts deictic nouns, pronouns, relational roles, and polysemous aliases.
* **Filter Patterns:**
  * Generic roles/nouns: `^(the|a|an)\s+(project|tool|app|system|database|client|manager|module|codebase)$`
  * Relational roles: `^(my|our)\s+(manager|boss|client|professor|roommate|friend|colleague|mom|dad)$`
  * Pronouns: `^(he|she|they|it|this|that|these|those|him|her|them)$`
  * Alias Collisions: Mentions matching an alias in `entity_aliases` where `status = 'AMBIGUOUS'`.
* **Output:** `AMBIGUOUS_PENDING_CONFIRMATION` ($1.0$ confidence).

### Layer 2: Exact & Normalized Canonical Match
* **Action:** Compares mention against canonical display names after standardizing:
  1. Unicode NFKD normalization.
  2. Lowercasing.
  3. Punctuation stripping (`.`, `-`, `_`, `/`, quotes).
  4. Collapsing whitespace.
  5. Singularization of standard plural inflections.
* **Output:**
  * If types match $\rightarrow$ `RESOLVED` ($1.0$ confidence).
  * If types conflict $\rightarrow$ `AMBIGUOUS_PENDING_CONFIRMATION` (`TYPE_MISMATCH_CANDIDATE`).

### Layer 3: Active Verified Alias Lookup
* **Action:** Queries `entity_aliases` where `user_id = :uid AND normalized_alias = :norm AND status = 'ACTIVE'`.
* **Output:**
  * Exactly 1 active match & types match $\rightarrow$ `RESOLVED` ($1.0$ confidence).
  * Exactly 1 active match & types conflict $\rightarrow$ `AMBIGUOUS_PENDING_CONFIRMATION` (`TYPE_MISMATCH_CANDIDATE`).
  * Multiple matches or status `AMBIGUOUS` $\rightarrow$ `AMBIGUOUS_PENDING_CONFIRMATION` (`ALIAS_COLLISION`).

### Layer 4: Structural Modifier & Extension Policy
* **Policy Mandate:** Additional lexical material representing a version, plugin, wrapper, backend, operator, extension, or sibling technology must prevent automatic canonical linking unless explicit alias evidence exists.
* **Evaluated Forms:**
  * Suffix extensions: `"FastAPI CLI"`, `"FitTrack Web"`, `"Postgres Operator"`, `"Docker Swarm"`, `"Expense Tracker v2"`.
  * Prepositional wrappers: `"CLI for FastAPI"`, `"Operator for Postgres"`, `"Backend for Expense Tracker"`.
  * Inverted / Sibling tool prefixes: `"Native React"` (vs `"React"`), `"React Native"` (vs `"React"`), `"Google Cloud Engine"` (vs `"Google"`).
* **Action:**
  * If the surface mention contains a canonical name alongside structural modifier tokens $\rightarrow$ **`NO_MATCH_UNRESOLVED`** (or `AMBIGUOUS_PENDING_CONFIRMATION` if similarity is high).
  * Automatic canonical linking is **strictly prohibited**.

### Layer 5: High-Precision String Similarity
* **Action:** SequenceMatcher ratio across normalized canonical names and active verified aliases.
* **Default Threshold:** $t_{\text{string}} \ge 0.85$ (captures harmless spacing/suffix variants like `"Tailwind CSS"` or `"ReactJS"`).
* **Output:**
  * If types match $\rightarrow$ `RESOLVED` (similarity score).
  * If types conflict $\rightarrow$ `AMBIGUOUS_PENDING_CONFIRMATION`.

### Layer 6: Type-Aware Embedding & Margin Evaluation
* **Model:** Local `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions, normalized cosine similarity).
* **Type-Specific Safety Policies:**

| Entity Type Category | Ontology Types | Embedding Auto-Resolution Policy | Default Thresholds |
|---|---|---|---|
| **High-Risk Identity** | `Person`, `Organization` | **Candidate Generation Only (No Auto-Resolve)**. Semantic embeddings cannot safely distinguish distinct individuals sharing social context. | All similarity $\ge 0.75$ routes to `PENDING_CONFIRMATION`. |
| **Technical / Operational** | `Project`, `Tool`, `Place` | **Guarded Auto-Resolution Permitted** only if: $\text{sim} \ge 0.80 \land (\text{top}_1 - \text{top}_2) \ge 0.04 \land \text{Layer 4 passed}$. | $t_{\text{embed}} = 0.80, \text{margin} = 0.04$. |
| **Conceptual / Semantic** | `Topic`, `Goal` | **Guarded Auto-Resolution Permitted** with standard defaults. | $t_{\text{embed}} = 0.80, \text{margin} = 0.04$. |

### Layer 7: Semantic Confirmation Band
* **Condition:** $0.75 \le \text{sim}(\vec{m}, \vec{c}_{\text{top1}}) < 0.80$
* **Output:** `AMBIGUOUS_PENDING_CONFIRMATION` (Top-1 and Top-2 candidate IDs attached as suggested matches).

### Layer 8: Default Fallback
* **Condition:** Top similarity $< 0.75$.
* **Output:** `NO_MATCH_UNRESOLVED`.

---

## 6. Alias Collision Data Model & Lifecycle

### A. The Alias Data Model & Uniqueness Strategy
To allow multiple entities to claim the same alias while guaranteeing that only unambiguous aliases can be `ACTIVE`, the database uses a **Partial Unique Index**:

```sql
CREATE TABLE entity_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    canonical_id UUID NOT NULL REFERENCES canonical_entities(id),
    alias_name VARCHAR(255) NOT NULL,
    normalized_alias VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- PROPOSED, ACTIVE, AMBIGUOUS, REVOKED, SUPERSEDED
    verification_actor VARCHAR(32) NOT NULL DEFAULT 'USER', -- USER, SYSTEM_PROPOSAL
    source_memory_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_canonical_alias_entry UNIQUE (canonical_id, normalized_alias)
);

-- PARTIAL UNIQUE INDEX: Guarantees at most ONE ACTIVE alias per normalized name per user
CREATE UNIQUE INDEX idx_uq_active_alias_per_user 
ON entity_aliases (user_id, normalized_alias) 
WHERE status = 'ACTIVE';

CREATE INDEX idx_entity_aliases_user_lookup 
ON entity_aliases (user_id, normalized_alias, status);
```

### B. Concrete Alias Collision Example
Suppose User A creates alias `"dashboard"` for `Expense Tracker` (`ent_01`), and later adds alias `"dashboard"` for `FitTrack` (`ent_02`):

#### 1. Initial State (Unambiguous Alias for `ent_01`):
| id | user_id | canonical_id | alias_name | normalized_alias | status |
|---|---|---|---|---|---|
| `alias_1` | `user_A` | `ent_01` (Expense Tracker) | `"Dashboard"` | `"dashboard"` | **`ACTIVE`** |

*Lookup `resolve("dashboard")`:*
* Query finds 1 record with `status = 'ACTIVE'`.
* **Result:** `RESOLVED` $\rightarrow$ `ent_01` (Expense Tracker).

#### 2. Collision State (User adds `"dashboard"` to `ent_02`):
The transaction detects that `"dashboard"` already exists for `user_A`. It executes:
1. `UPDATE entity_aliases SET status = 'AMBIGUOUS' WHERE user_id = 'user_A' AND normalized_alias = 'dashboard';`
2. `INSERT INTO entity_aliases (user_id, canonical_id, alias_name, normalized_alias, status) VALUES ('user_A', 'ent_02', 'Dashboard', 'dashboard', 'AMBIGUOUS');`

| id | user_id | canonical_id | alias_name | normalized_alias | status |
|---|---|---|---|---|---|
| `alias_1` | `user_A` | `ent_01` (Expense Tracker) | `"Dashboard"` | `"dashboard"` | **`AMBIGUOUS`** |
| `alias_2` | `user_A` | `ent_02` (FitTrack) | `"Dashboard"` | `"dashboard"` | **`AMBIGUOUS`** |

*Lookup `resolve("dashboard")`:*
* Query returns 2 records, both with `status = 'AMBIGUOUS'`.
* **Result:** **`AMBIGUOUS_PENDING_CONFIRMATION`**
  * `routingReason: 'ALIAS_COLLISION'`
  * `suggestedMatches: [{ id: 'ent_01', name: 'Expense Tracker' }, { id: 'ent_02', name: 'FitTrack' }]`
* **Invariant:** The resolver **NEVER** silently chooses one entity.

#### 3. Disambiguation / Resolution of Ambiguity:
If the user later revokes `"dashboard"` from `FitTrack` (`alias_2.status = 'REVOKED'`), the system evaluates remaining candidates for `"dashboard"`. Since only `ent_01` remains, `alias_1.status` is safely restored to **`ACTIVE`** (satisfying the partial unique index).

---

## 7. Non-Destructive Mutation & Immutability Protocols

> [!IMPORTANT]
> **The Immutability Invariant:**  
> Historical identity and resolution provenance are immutable. Database `ON DELETE CASCADE` or in-place edge rewrites are **strictly prohibited** for identity mutations. All corrections create new state records.

### A. Canonical Identity Rules
* **`canonical_id` (UUID):** Permanently immutable. Never changes for the lifetime of the graph.
* **`canonical_name` (Display Name):** Mutable. Updating display name creates an audit record in `entity_mutation_log` and automatically stages the previous name as a candidate alias.
* **`entity_type` (Ontology Category):** Mutable only with explicit user confirmation and audit record.

### B. Non-Destructive Entity Merge Protocol
When `Entity_B` is merged into `Entity_A` (survivor):
1. `Entity_B.status` is updated to `'MERGED'` with `merged_into_id = Entity_A.id`.
2. Historical edges `(MemoryItem)-[REFERENCES]->(Entity_B)` **remain physically untouched in the database**.
3. All graph traversal queries project current identity through a canonical resolution view (`COALESCE(merged_into_id, id)`).
4. `Entity_B`'s `ACTIVE` aliases are migrated to `Entity_A` with provenance `migration_reason = 'MERGE'`.
5. An immutable event is written to `entity_mutation_log`.

### C. Non-Destructive Entity Split Protocol
When `Entity_A` is split into `Entity_A` and `Entity_C` (new):
1. `Entity_C` is created with a fresh `canonical_id`.
2. An audit record `SPLIT_ENTITY` is inserted into `entity_mutation_log` referencing `source_entity_id = Entity_A.id` and `target_entity_id = Entity_C.id`.
3. Selected reference edges are marked with a reclassification pointer in `entity_reference_reclassifications`. The original edge and original resolution method are preserved.
4. Any alias shared by both entities is updated to `status = 'AMBIGUOUS'`.

### D. Concrete Temporal Merge / Split Example

#### Scenario:
* **Day 1:** System processes Journal Entry (`mem_123`) containing `"Rahul"`. Resolver creates edge `(mem_123)-[REFERENCES]->(ent_rahul_A)`. Provenance record `prov_001` logs `method = 'EXACT'`.
* **Day 30:** User identifies that `mem_123` was actually `"Rahul Verma"` (`ent_rahul_C`), not `"Rahul Sharma"` (`ent_rahul_A`), and performs a **Split Action**.

#### Audit Trail Representation (Zero Data Loss):
1. **Historical State Record (Preserved):**
   * `entity_resolution_provenance`: `id = prov_001`, `memory_id = mem_123`, `canonical_id = ent_rahul_A`, `decided_at = 'Day 1'`.
2. **Mutation Event Record:**
   * `entity_mutation_log`: `mutation_type = 'SPLIT'`, `primary_entity_id = ent_rahul_A`, `secondary_entity_id = ent_rahul_C`, `affected_reference_ids = ['ref_123']`, `actor = 'USER'`, `decided_at = 'Day 30'`.
3. **Current Projection Record:**
   * `entity_reference_reclassifications`: `original_reference_id = ref_123`, `previous_canonical_id = ent_rahul_A`, `new_canonical_id = ent_rahul_C`.

#### Dual-Temporal Query Answers:
* **"What did the system believe on Day 1?"**
  `SELECT canonical_id FROM entity_resolution_provenance WHERE memory_id = 'mem_123';`  
  $\longrightarrow$ **`ent_rahul_A`** (Original belief preserved).
* **"What is the current canonical interpretation on Day 30?"**
  `SELECT COALESCE(r.new_canonical_id, e.canonical_id) FROM entity_references e LEFT JOIN entity_reference_reclassifications r ON e.id = r.original_reference_id WHERE e.memory_id = 'mem_123';`  
  $\longrightarrow$ **`ent_rahul_C`** (Corrected interpretation projected).

---

## 8. Relational Storage Schema Contracts

### A. `canonical_entities` Table
```sql
CREATE TABLE canonical_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    canonical_name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(64) NOT NULL, -- Person, Project, Organization, Place, Tool, Topic, Goal
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, MERGED, ARCHIVED
    merged_into_id UUID REFERENCES canonical_entities(id) ON DELETE RESTRICT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_user_entity_type_name UNIQUE (user_id, entity_type, canonical_name)
);
CREATE INDEX idx_canonical_entities_user_status ON canonical_entities(user_id, status);
```

### B. `candidate_confirmation_queue` Table
```sql
CREATE TABLE candidate_confirmation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    mention_id UUID NOT NULL,
    source_memory_id UUID NOT NULL,
    surface_mention VARCHAR(255) NOT NULL,
    extracted_type VARCHAR(64) NOT NULL,
    suggested_canonical_id UUID REFERENCES canonical_entities(id) ON DELETE RESTRICT,
    secondary_canonical_id UUID REFERENCES canonical_entities(id) ON DELETE RESTRICT,
    similarity_score REAL,
    separation_margin REAL,
    routing_reason VARCHAR(64) NOT NULL, -- 'CONFIRMATION_BAND', 'TYPE_MISMATCH_CANDIDATE', 'DEICTIC_ANAPHORA', 'ALIAS_COLLISION', 'HIGH_RISK_TYPE'
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, DISMISSED
    decided_by VARCHAR(32),
    decided_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_confirmation_queue_user_status ON candidate_confirmation_queue(user_id, status);
```

### C. `entity_resolution_provenance` (Immutable Decision Log)
```sql
CREATE TABLE entity_resolution_provenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    mention_id UUID NOT NULL,
    source_fragment_id UUID NOT NULL,
    source_memory_id UUID NOT NULL,
    canonical_id UUID REFERENCES canonical_entities(id) ON DELETE RESTRICT,
    surface_mention VARCHAR(255) NOT NULL,
    resolution_method VARCHAR(64) NOT NULL, -- 'EXACT', 'NORMALIZED', 'VERIFIED_ALIAS', 'EMBEDDING', 'USER_CONFIRMED'
    similarity_score REAL,
    separation_margin REAL,
    resolver_version VARCHAR(32) NOT NULL DEFAULT 'v2.0.0',
    decided_by VARCHAR(32) NOT NULL, -- 'SYSTEM_AUTO', 'USER'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_provenance_user_memory ON entity_resolution_provenance(user_id, source_memory_id);
```

### D. `entity_mutation_log` (Immutable Event Log)
```sql
CREATE TABLE entity_mutation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    mutation_type VARCHAR(32) NOT NULL, -- 'MERGE', 'SPLIT', 'RENAME', 'TYPE_CHANGE', 'ALIAS_REVOCATION'
    primary_entity_id UUID NOT NULL REFERENCES canonical_entities(id) ON DELETE RESTRICT,
    secondary_entity_id UUID REFERENCES canonical_entities(id) ON DELETE RESTRICT,
    affected_reference_ids JSONB,
    mutation_payload JSONB NOT NULL,
    actor VARCHAR(32) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_mutation_log_user_entity ON entity_mutation_log(user_id, primary_entity_id);
```

### E. `entity_reference_reclassifications` (Non-Destructive Projection Table)
```sql
CREATE TABLE entity_reference_reclassifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    original_provenance_id UUID NOT NULL REFERENCES entity_resolution_provenance(id) ON DELETE RESTRICT,
    memory_id UUID NOT NULL,
    previous_canonical_id UUID NOT NULL REFERENCES canonical_entities(id) ON DELETE RESTRICT,
    new_canonical_id UUID NOT NULL REFERENCES canonical_entities(id) ON DELETE RESTRICT,
    mutation_event_id UUID NOT NULL REFERENCES entity_mutation_log(id) ON DELETE RESTRICT,
    authorized_by VARCHAR(32) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_reclass_user_memory ON entity_reference_reclassifications(user_id, memory_id);
```

---

## 9. Research-Derived Operating-Point Defaults & Recalibration Policy

These parameters are **provisional operating-point defaults** derived from Experiment 004C. They are exposed via `EntityResolverConfig` and must be dynamically monitored:

```typescript
export interface EntityResolverConfig {
  stringSimThreshold: number;         // Default: 0.85
  embedSimThreshold: number;          // Default: 0.80
  separationMargin: number;           // Default: 0.04
  confirmationBandLower: number;      // Default: 0.75
  highRiskTypesRequireConfirmation: EntityType[]; // ['Person', 'Organization']
}
```

### Initial Monitoring Hypotheses (Subject to Production Telemetry)
* `auto_resolution_rate`: Initial hypothesis $\sim 40\% - 60\%$
* `confirmation_queue_rate`: Initial hypothesis $\sim 10\% - 20\%$
* `user_acceptance_rate`: Initial hypothesis $\ge 90\%$
* `user_rejection_rate`: Initial hypothesis $< 5\%$
* `false_merge_reports`: Target $= 0$

---

## 10. Service Interface & Extensibility Contract

```typescript
export interface ResolutionResult {
  outcome: 'RESOLVED' | 'AMBIGUOUS_PENDING_CONFIRMATION' | 'NO_MATCH_UNRESOLVED';
  canonicalId?: string;
  confidence: number;
  routingReason: string;
  suggestedMatches?: Array<{
    canonicalId: string;
    canonicalName: string;
    similarityScore: number;
    entityType: EntityType;
  }>;
  provenance: {
    method: 'EXACT' | 'NORMALIZED' | 'VERIFIED_ALIAS' | 'EMBEDDING' | 'ANAPHORA_GATE' | 'MODIFIER_TRAP' | 'NONE';
    similarityScore?: number;
    separationMargin?: number;
    resolverVersion: string;
  };
}

export interface IEntityResolverService {
  resolve(
    mention: GroundedMention,
    context?: ResolutionContext
  ): Promise<ResolutionResult>;
}
```

---

## 11. Verification & Acceptance Criteria for Sprint 2A.3

When implementing the resolver in `packages/shared/src/entities/`:

- [ ] `GroundedMention` contract validated at service boundary (span offsets cross-checked against source text).
- [ ] 5-state return model implemented with zero automatic node creation from `NO_MATCH`.
- [ ] Layer 1 through Layer 8 waterfall implemented with type-aware embedding policies (`Person`/`Organization` require confirmation).
- [ ] Partial unique index on `(user_id, normalized_alias) WHERE status = 'ACTIVE'` deployed for alias collision handling.
- [ ] Non-destructive merge and split projection views (`entity_reference_reclassifications`) deployed.
- [ ] Strict tenant isolation (`user_id`) verified across all entity, alias, queue, and mutation tables.
- [ ] Unit test suite achieving $100.0\%$ precision and $0.0\%$ false merges against `entity_resolution_004b_gold.json`.
