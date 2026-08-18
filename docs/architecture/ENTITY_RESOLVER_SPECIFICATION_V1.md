# Entity Resolver Specification & Operating Protocol (v1.0)
## Knowledge Graph Engine (Engine 3) — Canonical Identity & Disambiguation Service

> **Document Status:** Authoritative Engineering Specification (Phase 2 Component Specification)  
> **Target Component:** Engine 3 — Entity Resolution Service (`packages/shared/src/entities/resolver.ts`)  
> **Effective Date:** 2026-08-18  
> **Version:** 1.0.0  
> **Evidence Foundation:** Empirically validated via Experiments 003A, 004A, 004B, and 004C.  

---

## 1. Architectural Purpose & Pipeline Boundary

In the Cognitive Engine pipeline:
$$\text{Capture (Engine 1)} \longrightarrow \text{Memory (Engine 2)} \longrightarrow \mathbf{Entity \; Resolver \; (Engine \; 3)} \longrightarrow \text{Knowledge Graph} \longrightarrow \text{Cognitive Pattern (Engine 4)}$$

### Core Mandate
Raw model-extracted entity mentions are **untrusted candidates**. The **Entity Resolver** is the deterministic gatekeeper that determines whether a grounded surface mention refers to an existing canonical entity, should prompt user confirmation, or represents a novel entity candidate.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     ENTITY RESOLVER PIPELINE                                     │
│                                                                                                  │
│   Grounded Mention ──► [ Layer 1: Anaphora & Ambiguity Filter ] ───────► PENDING_CONFIRMATION    │
│                                      │ (Pass)                                                    │
│                        [ Layer 2: Exact & Normalized Match ]  ─────────► RESOLVED (Canonical)    │
│                                      │ (Miss)                                                    │
│                        [ Layer 3: Verified Alias Lookup ]     ─────────► RESOLVED (Canonical)    │
│                                      │ (Miss)                                                    │
│                        [ Layer 4: Modifier Trap Gatekeeper ]  ─────────► NO_MATCH (New Entity)   │
│                                      │ (Pass)                                                    │
│                        [ Layer 5: High-Precision String Sim ] ─────────► RESOLVED (Canonical)    │
│                                      │ (Miss)                                                    │
│                        [ Layer 6: Guarded Embedding & Margin] ─────────► RESOLVED (Canonical)    │
│                                      │ (Miss)                                                    │
│                        [ Layer 7: Semantic Confirmation Band] ─────────► PENDING_CONFIRMATION    │
│                                      │ (Miss)                                                    │
│                                 [ Fallback ]                  ─────────► NO_MATCH (New Entity)   │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. The 3-State Decision Model

Every resolution attempt must terminate in exactly one of three states:

| Outcome State | Description | Action in Knowledge Graph |
|---|---|---|
| **`RESOLVED`** | High-confidence match ($100\%$ precision on benchmark) | Direct canonical entity linking; provenance edge inserted. |
| **`AMBIGUOUS`** | Borderline semantic candidate or deictic reference | Staged in `candidate_confirmation_queue` for interactive confirmation. |
| **`NO_MATCH`** | Pristine grounded mention with no existing node | Preserved as new entity candidate; available for node initiation. |

> [!IMPORTANT]
> **Safety Invariant:** A resolver must **never** force an uncertain mention into an existing canonical node.  
> $$\text{False Merge (Catastrophic)} \gg \text{False Split (Recoverable)} > \text{Safe Unresolved (Acceptable)}$$

---

## 3. The 6-Layer Resolution Algorithm

### Layer 1: Anaphora & Ambiguity Gatekeeper
* **Action:** Intercepts deictic nouns, pronouns, and polysemous handles.
* **Filter Patterns:**
  * Generic roles/nouns: `^(the|a|an)\s+(project|tool|app|system|database|client|manager|module)$`
  * Relational roles: `^(my|our)\s+(manager|boss|client|professor|roommate|friend|mom|dad)$`
  * Pronouns: `^(he|she|they|it|this|that|these|those)$`
  * Polysemous handles: Mentions matching $>1$ active entity in the user's graph (e.g. `"dashboard"`).
* **Output:** `AMBIGUOUS` ($1.0$ confidence).

### Layer 2: Exact & Normalized Canonical Match
* **Action:** Compares against canonical display names using deterministic preprocessing:
  1. Unicode NFKD decomposition.
  2. Lowercasing.
  3. Punctuation stripping (`.`, `-`, `_`, `/`, quotes).
  4. Collapsing whitespace.
  5. Singularization of standard plural inflections (`"race conditions"` $\rightarrow$ `"race condition"`).
* **Condition:** $\text{norm}(mention) == \text{norm}(canonical\_name) \land type(mention) == type(canonical)$
* **Output:** `RESOLVED` ($1.0$ confidence).

### Layer 3: User-Verified Alias Registry Match
* **Action:** Matches against per-tenant verified alias records in `entity_aliases`.
* **Condition:** $\text{norm}(mention) \in \{\text{norm}(a) \mid a \in canonical.aliases\} \land type(mention) == type(canonical)$
* **Output:** `RESOLVED` ($1.0$ confidence).

### Layer 4: Modifier Trap & Substring Gatekeeper
* **Action:** Prevents extension/sibling tools from being absorbed into parent nodes (e.g. `"Postgres Operator"` $\neq$ `"PostgreSQL"`, `"FastAPI CLI"` $\neq$ `"FastAPI"`, `"React Native"` $\neq$ `"React"`).
* **Rule:** If $\text{norm}(canonical\_name)$ is a substring of $\text{norm}(mention)$ and $\text{len}(\text{norm}(mention)) > \text{len}(\text{norm}(canonical\_name)) + 2$ without an explicit alias registration:
* **Output:** `NO_MATCH` ($0.20$ score).

### Layer 5: High-Precision String Similarity
* **Action:** SequenceMatcher ratio across normalized canonical names and verified aliases.
* **Threshold:** $t_{\text{string}} \ge 0.85$ (captures harmless spacing/suffix variants like `"Tailwind CSS"` or `"ReactJS"`).
* **Output:** `RESOLVED` (similarity score).

### Layer 6: Guarded Local Embedding & Margin Check
* **Model:** Local `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions, normalized cosine similarity).
* **Condition:**
  $$\text{sim}(\vec{m}, \vec{c}_{\text{top1}}) \ge 0.80 \quad \land \quad (\text{sim}(\vec{m}, \vec{c}_{\text{top1}}) - \text{sim}(\vec{m}, \vec{c}_{\text{top2}})) \ge 0.04$$
* **Output:** `RESOLVED` (cosine similarity score).

### Layer 7: Semantic Confirmation Band
* **Condition:** $0.75 \le \text{sim}(\vec{m}, \vec{c}_{\text{top1}}) < 0.80$
* **Action:** Routes uncertain paraphrases (e.g. `"ledger module"`, `"workout logger"`) to the user queue.
* **Output:** `AMBIGUOUS` (top candidate attached as suggested resolution).

### Layer 8: Default Fallback
* **Condition:** Top similarity $< 0.75$.
* **Output:** `NO_MATCH`.

---

## 4. Validated Production Constants

These parameters are empirically frozen based on Experiment 004C Pareto frontier analysis:

| Constant Identifier | Value | Empirical Purpose & Invariant |
|---|:---:|---|
| `STRING_SIM_THRESHOLD` | **`0.85`** | Captures minor spacing, hyphenation, and suffix variations without false merges. |
| `EMBED_SIM_THRESHOLD` | **`0.80`** | Minimum dense vector similarity for autonomous canonical linking. |
| `SEPARATION_MARGIN` | **`0.04`** | Minimum cosine lead required over the second-best candidate. |
| `CONFIRMATION_BAND_LOWER`| **`0.75`** | Lower bound for staging candidates into `candidate_confirmation_queue`. |
| `MODIFIER_TRAP_MIN_DELTA`| **`3`** | Extra character length threshold triggering modifier trap rejection. |

---

## 5. Storage Schema & Relationship Contracts

### A. `canonical_entities` Table
```sql
CREATE TABLE canonical_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    canonical_name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(64) NOT NULL, -- Person, Project, Organization, Place, Tool, Topic, Goal
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_user_entity_type_name UNIQUE (user_id, entity_type, canonical_name)
);
```

### B. `entity_aliases` Table
```sql
CREATE TABLE entity_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_id UUID NOT NULL REFERENCES canonical_entities(id) ON DELETE CASCADE,
    alias_name VARCHAR(255) NOT NULL,
    normalized_alias VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT TRUE,
    source_provenance_id UUID, -- References memory_item or capture fragment
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_canonical_alias UNIQUE (canonical_id, normalized_alias)
);
```

### C. `candidate_confirmation_queue` Table
```sql
CREATE TABLE candidate_confirmation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    surface_mention VARCHAR(255) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    suggested_canonical_id UUID REFERENCES canonical_entities(id) ON DELETE SET NULL,
    similarity_score REAL,
    source_memory_id UUID NOT NULL,
    status VARCHAR(32) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, DISMISSED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 6. Implementation Checklist for Sprint 2A.3

When implementing the resolver in `packages/shared/src/entities/`:

- [ ] Implement `normalizeText(str: string): string` with Unicode NFKD decomposition and whitespace collapse.
- [ ] Implement `AnaphoraGatekeeper` regex module.
- [ ] Implement `ModifierTrapFilter` checking substring delta against known canonicals.
- [ ] Implement `LocalEmbeddingMatcher` utilizing pre-computed vectors from Engine 2 (`pgvector`).
- [ ] Implement three-state return type: `{ outcome: 'RESOLVED' | 'AMBIGUOUS' | 'NO_MATCH', canonicalId?: string, confidence: number, suggestedId?: string }`.
- [ ] Implement confirmation staging service when `outcome === 'AMBIGUOUS'`.
- [ ] Add unit test suite validating zero false merges against the `entity_resolution_004b_gold.json` benchmark cases.
