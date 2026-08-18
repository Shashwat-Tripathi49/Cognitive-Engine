# Experiment 004B — Corrected & Unseen-Alias Entity Resolution Methodology
## Offline Research Milestone Protocol — Strict Generalization & False-Merge Defense

> **Document Version:** 2.0.0  
> **Status:** Approved Research Specification  
> **Phase:** Offline Research Spikes (Strictly 0 External API Calls, 0 Production Schema Changes)  
> **Scope:** Cognitive Engine Knowledge Graph Architecture (Engine 3 Pre-Sprint Resolution Protocol)  
> **Date:** 2026-08-18  

---

## 1. Executive Purpose & Context Following Experiment 004A Audit

Experiment 004A established the foundation of offline entity resolution but was formally audited with the following findings:
1. **Alias Dictionary Contamination:** Evaluation-split aliases (e.g., `"Bombay"`, `"pgsql"`, `"workout logger"`) were pre-populated into the canonical dictionary, meaning the high $98.7\%$ F1 measured dictionary lookup rather than generalization to unseen aliases.
2. **False-Merge Misattribution:** The ambiguous mention `"5K goal"` was incorrectly registered in the dictionary under `Sub-25 Min 5K`, causing a $2.63\%$ False-Merge Rate across all attempted resolutions.
3. **Embedding Hard-Negative Failure:** Unconstrained cosine similarity on `all-MiniLM-L6-v2` caused severe False Merges on sibling/modifier entities (`PostgresML` $\rightarrow$ `PostgreSQL`, `FastAPI CLI` $\rightarrow$ `FastAPI`, `FitTrack Web` $\rightarrow$ `FitTrack`, `Rahul Verma` $\rightarrow$ `Rahul`).

### Core Research Objective of Experiment 004B:
> *"Can Cognitive Engine resolve a grounded surface mention to the correct canonical entity when the exact alias has NOT already been memorized in the resolver's active dictionary, while strictly avoiding catastrophic False Merges on hard negatives?"*

---

## 2. Strict Partitioning & Information Barrier

To enforce true generalization and eliminate dictionary leakage, Experiment 004B splits the data into three disjoint evaluation partitions and enforces an explicit **Information Barrier**:

```
                                  [Canonical Entity Registry]
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       ▼                                               ▼
          [Active Verified Aliases]                        [Ground-Truth Aliases]
       (Visible to Resolver Dictionary)               (Hidden from Resolver Dictionary)
                       │                                               │
                       ▼                                               ▼
           [Known-Alias Evaluation]                        [Unseen-Alias Evaluation]
         (Tests Dictionary Resolution)                     (Tests True Generalization)
```

### Partition Definitions:
1. **`CALIBRATION` ($30\%$ of cases):** Used strictly for tuning similarity thresholds ($t_{\text{string}}$, $t_{\text{embed}}$, $\text{margin}$) and modifier guard heuristics.
2. **`KNOWN_ALIAS_EVAL` ($35\%$ of cases):** Contains surface mentions whose aliases are deliberately registered in the active dictionary to measure baseline verified lookup recall.
3. **`UNSEEN_ALIAS_EVAL` ($35\%$ of cases):** Contains novel paraphrases, colloquial descriptive handles, and abbreviations **strictly excluded** from the resolver's active alias dictionary.

---

## 3. Approved Ontology & Diagnostic Categories (CAT_A through CAT_I)

The benchmark evaluates 9 diagnostic case categories:

| Category Code | Category Name | Description | Resolver Visibility | Expected Outcome |
|---|---|---|---|---|
| **`CAT_A`** | **Exact Canonical Match** | Verbatim match to canonical display name | In Canonical Registry | `RESOLVED` |
| **`CAT_B`** | **Normalized Match** | Match under casing, punctuation, and whitespace rules | In Canonical Registry | `RESOLVED` |
| **`CAT_C`** | **Known Verified Alias** | Pre-registered alias in active dictionary | In Active Dictionary | `RESOLVED` |
| **`CAT_D`** | **Unseen Alias / Handle** | Novel project/tool/person handle | **HIDDEN from Active Dictionary** | `RESOLVED` |
| **`CAT_E`** | **Abbreviation (Known & Unseen)** | Standard technical acronyms | Mixed (Documented) | `RESOLVED` |
| **`CAT_F`** | **Unseen Paraphrase** | Descriptive domain phrase | **HIDDEN from Active Dictionary** | `RESOLVED` |
| **`CAT_G`** | **Ambiguous Reference** | Generic anaphora (`the project`, `he`, `5K goal`) | None | `AMBIGUOUS` |
| **`CAT_H`** | **Hard Negative / Trap** | High surface similarity to distinct entity | None | `NO_MATCH` |
| **`CAT_I`** | **No Match (Novel Entity)** | Pristine grounded entity with no graph node | None | `NO_MATCH` |

---

## 4. Remediation of 004A Contamination

* **Removal of Contradictory Aliases:** `"5K goal"` is completely purged from `ent_sub25_5k.active_verified_aliases`.
* **Ambiguity Preservation:** `CASE_075` and all ambiguous mentions are verified to have `expectedOutcome: "AMBIGUOUS"` and `canonicalEntityId: null`.

---

## 5. Decision Policy & Safety Ranking

The resolver must output exactly one of three states:
1. **`RESOLVED`** $\rightarrow$ High-confidence link to specific `canonical_id`.
2. **`AMBIGUOUS`** $\rightarrow$ Routed to `PENDING_CONFIRMATION` staging table.
3. **`NO_MATCH`** $\rightarrow$ Isolated candidate ready for novel entity initiation.

### The Safety Ranking Principle:
$$\text{False Merge (Catastrophic Error)} \gg \text{False Split (Recoverable)} > \text{Safe Unresolved (Acceptable)}$$

---

## 6. Formal Scoring Metrics

Metrics are computed separately across the entire benchmark and broken down by **Known Aliases vs. Unseen Aliases vs. Hard Negatives**:

1. **Resolution Precision ($P_{\text{res}}$):** $TP / (TP + FP)$
2. **Resolution Recall ($R_{\text{res}}$):** $TP / N_{\text{resolvable}}$
3. **Resolution F1 ($F1_{\text{res}}$):** Harmonic mean of $P$ and $R$.
4. **Global False-Merge Rate ($R_{\text{FM\_global}}$):** $FM_{\text{total}} / (TP + FP)$
5. **Hard-Negative False-Merge Rate ($R_{\text{FM\_hardneg}}$):** $FM_{\text{hardneg}} / N_{\text{hardneg}}$
6. **False-Split Rate ($R_{\text{FS}}$):** $FS / N_{\text{resolvable}}$
7. **Ambiguity Accuracy ($Acc_{\text{amb}}$):** $Corr_{\text{amb}} / N_{\text{amb}}$
8. **No-Match Accuracy ($Acc_{\text{nomatch}}$):** $Corr_{\text{nm}} / N_{\text{nm}}$
