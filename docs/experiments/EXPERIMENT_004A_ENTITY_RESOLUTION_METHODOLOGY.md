# Experiment 004A — Entity Resolution Methodology & Evaluation Protocol
## Offline Research Phase — Evidence-Bound Entity Resolution & Disambiguation

> **Document Version:** 1.0.0  
> **Status:** Approved Research Protocol  
> **Phase:** Offline Research Spikes (Strictly 0 External API Calls, 0 Production Schema Changes)  
> **Scope:** Cognitive Engine Knowledge Graph Architecture (Engine 3 Pre-Sprint Methodology)  
> **Date:** 2026-08-18  

---

## 1. Executive Purpose & Research Objective

In the Cognitive Engine pipeline:
$$\text{Capture} \longrightarrow \text{Memory} \longrightarrow \text{Entity / Knowledge Graph} \longrightarrow \text{Cognitive Pattern} \longrightarrow \text{Reasoning} \longrightarrow \text{Reflection}$$

A model-extracted text candidate is **never** automatically a canonical entity in the Knowledge Graph. Rather, the architecture enforces an evidence-bound validation boundary:

$$\text{Grounded Mention} \longrightarrow \text{Resolution / Disambiguation} \longrightarrow \begin{cases} \text{Canonical Entity Link} & (\text{RESOLVED}) \\ \text{Candidate Pending Confirmation} & (\text{AMBIGUOUS}) \\ \text{Isolated New Candidate} & (\text{NO\_MATCH}) \end{cases}$$

### The Core Scientific Question of Experiment 004A:
> *"Given a grounded entity mention in a journal entry, can we determine whether it refers to an existing canonical entity, which canonical entity it refers to, or whether the mention should remain unresolved?"*

This experiment evaluates **Entity Resolution** (linking surface mentions to true entity identities), **not** entity extraction (finding text spans in text).

---

## 2. Core Definitions & Approved Taxonomy

### A. Canonical Entity
A **Canonical Entity** is a unique, persistent real-world entity identity stored in the user's Knowledge Graph. It possesses a distinct immutable identity identifier (`canonical_id`), an authoritative display name, an approved entity type, and a cluster of verified aliases and evidentiary provenance references.

The approved taxonomy strictly adheres to the 7 Cognitive Engine ontology types:
1. **`Person`**: Named individual with social or professional relationship (e.g., `Rahul`, `Priya`, `Dr. Rao`).
2. **`Project`**: Named product, codebase, venture, or creative initiative (e.g., `Expense Tracker`, `FitTrack`, `Portfolio CMS`).
3. **`Organization`**: Company, educational institution, agency, or team (e.g., `Google`, `Zerodha`, `IIT Bombay`).
4. **`Place`**: Geographic location, city, physical venue, or workspace (e.g., `Bangalore`, `Indiranagar`, `Cubbon Park`).
5. **`Tool`**: Specific software library, programming framework, database, or technical tool (e.g., `React`, `PostgreSQL`, `Docker`, `FastAPI`).
6. **`Topic`**: Conceptual domain, academic field, technical pattern, or subject of inquiry (e.g., `Race Condition`, `Machine Learning`, `ACID Transactions`).
7. **`Goal`**: Explicit, bounded milestone or personal objective (e.g., `CAT 2026 Preparation`, `Sub-25 Min 5K`).

*Constraint:* No new ontology types may be introduced during this research phase.

---

### B. Surface Mention
A **Surface Mention** is the verbatim or localized textual token sequence extracted from a specific raw journal entry (e.g., `"personal finance tool"`, `"Postgres"`, `"the budgeting module"`, `"Rahul"`). A mention is tied directly to source evidence (`entryId`, `charOffset`, `contextWindow`).

---

### C. Exact & Normalized Match

1. **Exact Match**: Verbatim byte-for-byte character equality ($s_1 == s_2$) against a canonical entity's primary name or verified alias.
2. **Normalized Match**: Equivalence after deterministic preprocessing rules:
   * **Case folding**: Unicode lowercasing (`"PostgreSQL"` $\rightarrow$ `"postgresql"`).
   * **Whitespace normalization**: Stripping leading/trailing whitespace and collapsing multiple spaces/newlines to single space (`"  Expense   Tracker "` $\rightarrow$ `"Expense Tracker"`).
   * **Punctuation stripping**: Removing surrounding or internal punctuation where semantics are preserved (`"React.js"` $\rightarrow$ `"react js"` / `"react"`).
   * **Unicode normalization**: NFKD decomposition (stripping accents/diacritics).
   * **Plural/Singular normalization**: Basic standard plural inflection handling (`"Race Conditions"` $\rightarrow$ `"race condition"`).

*Constraint:* Normalization must NOT silently broaden into fuzzy semantic equivalence or ungrounded synonym mapping.

---

### D. Alias vs. Generic Synonym

* **Legitimate Alias**: An alternative name, code name, acronym, or established informal handle that **demonstrably refers to the specific canonical entity** within the user's personal context (e.g., `"personal finance tool"` $\leftrightarrow$ `Expense Tracker`, `"K8s"` $\leftrightarrow$ `Kubernetes`, `"PG"` $\leftrightarrow$ `PostgreSQL`).
* **Generic Synonym (Not an Alias)**: A general category or synonym that does not uniquely pinpoint the entity (e.g., `"software"`, `"app"`, `"database"`, `"coding"`). These must **never** be registered as aliases for a single canonical entity.

---

### E. Ambiguity (`AMBIGUOUS` / `PENDING_CONFIRMATION`)
A mention must be classified as **`AMBIGUOUS`** whenever the resolver lacks sufficient deterministic evidence to select a single canonical entity:
1. **Polysemous Names**: Common names matching multiple graph entities (e.g., `"Rahul"` when the user knows two people named Rahul).
2. **Shared Aliases**: An alias associated with multiple canonical projects (e.g., `"dashboard"` when the user has both `Expense Tracker` and `FitTrack` dashboards).
3. **Pronominal / Deictic References**: Anaphora such as `"the project"`, `"the tool"`, `"he"`, or `"she"` where context is required to resolve identity.
4. **Sub-Threshold Confidence**: Cases where similarity scores fall within an uncertain band ($t_{\text{low}} \le \text{sim} < t_{\text{high}}$).

*Outcome Policy:* Ambiguous mentions are routed to `PENDING_CONFIRMATION` or preserved as unlinked candidates. They are **never** forced into an arbitrary canonical node.

---

### F. No Match (`NO_MATCH`)
A mention is classified as **`NO_MATCH`** when it represents a valid, grounded named entity that does **not** correspond to any existing canonical entity in the user's current Knowledge Graph (e.g., a newly introduced tool `"Supabase"` or a new colleague `"Vikram"`).

*Outcome Policy:* Distinct from ambiguity. `NO_MATCH` represents a pristine new candidate ready for node initiation, whereas `AMBIGUOUS` represents conflicting links to existing nodes.

---

### G. False Merge (Catastrophic Error Class)
A **False Merge** occurs when the resolver incorrectly links a surface mention to the **wrong** canonical entity (e.g., linking `"FitTrack mobile app"` $\rightarrow$ `Expense Tracker`, or `"Rahul Verma"` $\rightarrow$ `Rahul Sharma`).

> [!CAUTION]
> **Core Architectural Principle for Cognitive Engine:**  
> **A False Merge is far more destructive than a False Split or leaving a mention unresolved.**  
> A false merge contaminates the user's Knowledge Graph, crosses memory boundaries, corrupts pattern synthesis in Engine 4, and causes hallucinated reasoning in Engine 5. Therefore, the resolver's objective is to achieve **zero or strictly minimized False Merges**, even at the expense of lower recall.

---

### H. False Split
A **False Split** occurs when two mentions that refer to the same canonical entity are incorrectly treated as distinct, unrelated entities (e.g., creating separate nodes for `"Postgres"` and `"PostgreSQL"`). While undesirable, false splits can be remedied later via post-hoc entity reconciliation or user merges without corrupting existing ground-truth facts.

---

## 3. Comprehensive Scoring Methodology & Formal Metrics

To avoid the flaw of collapsing distinct failure modes into a single F1 number, the benchmark evaluates 7 independent metric dimensions:

### 1. Resolution Precision ($P_{\text{res}}$)
Of all mentions the resolver chose to resolve to a canonical entity, what fraction was linked to the correct canonical entity?
$$P_{\text{res}} = \frac{|\text{Correctly Resolved Matches}|}{|\text{Total Attempted Resolves}|} = \frac{TP_{\text{res}}}{TP_{\text{res}} + FP_{\text{res}} + \text{False Merges}}$$

### 2. Resolution Recall ($R_{\text{res}}$)
Of all benchmark mentions that have a true canonical target entity, what fraction was correctly resolved?
$$R_{\text{res}} = \frac{|\text{Correctly Resolved Matches}|}{|\text{Benchmark Resolvable Targets}|} = \frac{TP_{\text{res}}}{N_{\text{resolvable}}}$$

### 3. Resolution F1 ($F1_{\text{res}}$)
Harmonic mean of precision and recall:
$$F1_{\text{res}} = 2 \cdot \frac{P_{\text{res}} \cdot R_{\text{res}}}{P_{\text{res}} + R_{\text{res}}}$$

### 4. False-Merge Rate ($R_{\text{FM}}$) — Primary Safety Guardrail
The proportion of resolved attempts that resulted in a catastrophic wrong entity link:
$$R_{\text{FM}} = \frac{|\text{False Merges}|}{|\text{Total Attempted Resolves}|}$$

### 5. False-Split Rate ($R_{\text{FS}}$)
The proportion of resolvable entities incorrectly left as separate/unresolved:
$$R_{\text{FS}} = \frac{|\text{Resolvable Targets Left Unresolved}|}{N_{\text{resolvable}}}$$

### 6. Ambiguity Detection Accuracy ($Acc_{\text{amb}}$)
The proportion of genuinely ambiguous cases correctly routed to `AMBIGUOUS`:
$$Acc_{\text{amb}} = \frac{|\text{Correctly Flagged Ambiguities}|}{N_{\text{ambiguous}}}$$

### 7. No-Match Accuracy ($Acc_{\text{nomatch}}$)
The proportion of novel/unregistered entities correctly assigned `NO_MATCH` without being falsely merged into existing entities:
$$Acc_{\text{nomatch}} = \frac{|\text{Correctly Identified No-Matches}|}{N_{\text{nomatch}}}$$

---

## 4. Benchmark Dataset Architecture & Category Taxonomy

The gold standard benchmark (`entity_resolution_gold.json`) contains balanced, human-curated cases organized across 8 mandatory diagnostic categories:

| Category Code | Category Name | Description | Expected Outcome |
|---|---|---|---|
| **`CAT_A`** | **Exact Canonical Match** | Verbatim match to canonical display name | `RESOLVED` |
| **`CAT_B`** | **Normalized Match** | Match under case/whitespace/punctuation stripping | `RESOLVED` |
| **`CAT_C`** | **Verified Alias** | Verified domain alias or code name | `RESOLVED` |
| **`CAT_D`** | **Abbreviation / Short Form** | Standard technical abbreviation (e.g. `postgres`, `k8s`) | `RESOLVED` |
| **`CAT_E`** | **Paraphrase / Descriptive Mention** | Domain-specific descriptive mention (e.g. `budgeting dashboard`) | `RESOLVED` |
| **`CAT_F`** | **Ambiguous Reference** | Polysemous name or generic deictic reference (`the project`) | `AMBIGUOUS` |
| **`CAT_G`** | **Hard Negative / Similar but WRONG** | High surface/lexical similarity but distinct entity (False Merge Trap) | `NO_MATCH` or `RESOLVED` (to other) |
| **`CAT_H`** | **No Match (Novel Entity)** | Valid grounded entity with zero existing graph entry | `NO_MATCH` |

### Dataset Partitioning: Calibration vs. Evaluation
To uphold strict scientific integrity and prevent threshold overfitting:
* **Calibration Split ($40\%$)**: Used to tune similarity thresholds ($t_{\text{string}}$, $t_{\text{embed}}$) and normalization rules.
* **Evaluation Split ($60\%$)**: Held completely blind during parameter selection; used strictly for reporting final benchmark metrics.
