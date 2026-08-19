# Experiment 003A — Forensic Reconciliation & Ground-Truth Analysis Report
> **Evaluation Scope:** 500 Real API Calls (100 Entries × 5 Variants) on `openai/gpt-oss-120b` (Groq Native JSON Mode)  
> **Auditor:** Staff AI Systems Engineer & Forensic Technical Auditor  
> **Status:** Final & Complete  
> **Target Dataset:** `synthetic_journal_entities_ground_truth.json` (100 Entries, 60 Ground-Truth Entities)  
> **Primary Raw Artifact:** `experiments/journal-clustering/results/experiment_003a_gpt_oss_120b_results.json`  

---

## 1. Reconciliation Verdict

`[VERIFIED FROM RAW DATA]`  
**Verdict: NUMERICALLY RECONCILED & VALIDATED.**

An independent, case-level recalculation of all 500 per-call records in `experiment_003a_gpt_oss_120b_results.json` against `synthetic_journal_entities_ground_truth.json` confirms that the published summary metrics are mathematically authentic and grounded in the raw call logs, with one noted transient network failure in `V1_Exhaustive` that was correctly accounted for:

1. **`V0_Original`**, **`V2_Conservative`**, **`V3_Confidence_All`**, and **`V3_Confidence_HighOnly`**:
   * Exactly 100/100 successful API calls each.
   * `sum(case-level TP) == reported TP` across all variants.
   * `sum(case-level FP) == reported FP` across all variants.
   * `sum(case-level FN) == reported FN` across all variants.
   * Total prompt, completion, and reasoning token sums match reported values to the single integer token.
   * Calculated costs match reported costs to 6 decimal places.

2. **`V1_Exhaustive` Network Call Reconciliation**:
   * 99/100 calls succeeded cleanly.
   * 1 call (`entry_093`: *"Rahul initiated code review on security compliance"*) encountered a transient DNS failure (`<urlopen error [Errno 11001] getaddrinfo failed>`).
   * The benchmark runner recorded `status: "API_FAILURE"` for `entry_093` and automatically assigned its 1 ground-truth entity (`"Rahul"`) as an explicit False Negative (`fn_exact_tot += len(gt_entities)`).
   * **Reconciliation Check**: Case-level `exact_fn` sum across the 99 successful calls is `13`. When adding the `1` FN from the failed call, the total is exactly `14` ($46\text{ TP} + 14\text{ FN} = 60\text{ GT entities}$, yielding Recall $= \frac{46}{60} = 76.67\%$).

---

## 2. Reconciled Master Five-Variant Table

`[VERIFIED FROM RAW DATA]` & `[DERIVED FROM RAW DATA]`

| Variant Name | Evaluated Entries | Successful Calls | API Failures | TP | FP | FN | Exact Precision | Exact Recall | Exact & Alias F1 | Hallucinations | Hallucination Rate | Avg Latency | Prompt Tokens | Completion Tokens | Reasoning Tokens | Total Cost (USD) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`V0_Original`** | 100 | 100 | 0 | 46 | 112 | 14 | 29.11% | 76.67% | **42.20%** | 0 | **0.00%** | 987 ms | 17,881 | 21,798 | 18,871 (86.6%) | $0.0158 |
| **`V1_Exhaustive`** | 100 | 99 | 1* | 46 | 51 | 14 | **47.42%** | 76.67% | **58.60%** | 0 | **0.00%** | 1,112 ms | 31,467 | 17,858 | 15,505 (86.8%) | $0.0154 |
| **`V2_Conservative`** | 100 | 100 | 0 | 26 | 75 | 34 | 25.74% | 43.33% | **32.30%** | 0 | **0.00%** | 1,286 ms | 26,781 | 21,646 | 19,219 (88.8%) | $0.0170 |
| **`V3_Confidence_All`** | 100 | 100 | 0 | 48 | 182 | 12 | 20.87% | **80.00%** | **33.10%** | 4 | **1.74%** | 1,565 ms | 25,881 | 32,057 | 27,474 (85.7%) | $0.0231 |
| **`V3_Confidence_HighOnly`** | 100 | 100 | 0 | 47 | 99 | 13 | 32.19% | 78.33% | **45.63%** | 0 | **0.00%** | 1,255 ms | 25,881 | 29,122 | 24,594 (84.5%) | $0.0214 |
| **TOTALS (500 Calls)** | **500** | **499** | **1** | **213** | **519** | **87** | — | — | — | **4** | — | **1,241 ms** | **127,891** | **122,481** | **105,663** | **$0.0927** |

*\*Note: 1 transient DNS getaddrinfo retry drop on entry_093. Exact mathematical consistency verified across all metrics.*

---

## 3. Hallucination Formula & Case-by-Case Audit

### 3.1 Mathematical Formula & Denominator Definition
`[VERIFIED FROM RAW DATA]`  
In the Experiment 003A benchmark codebase (`run_experiment_003a_gpt_oss_120b.py:L411`), **Hallucination Rate** is mathematically defined as:

$$\text{Hallucination Rate} = \frac{\text{Count of Ungrounded Extracted Entity Spans}}{\text{Total Extracted Entities (TP + FP)}} = \frac{\text{Hallucinations}}{\text{Total Model Predictions}}$$

* For `V3_Confidence_All`:
  $$\text{Hallucination Rate} = \frac{4}{48\text{ (TP)} + 182\text{ (FP)}} = \frac{4}{230} = 0.0173913 \longrightarrow \mathbf{1.74\%}$$
* Across `V0`, `V1`, `V2`, and `V3_HighOnly`: Hallucinations $= 0 \implies \mathbf{0.00\%}$.

### 3.2 Evaluator Classification Rule
`[VERIFIED FROM RAW DATA]`  
An entity candidate $E_{\text{pred}}$ is classified as **Ungrounded / Hallucinated** if and only if:
$$\text{normalize}(E_{\text{pred}}.\text{name}) \notin \text{normalize}(T_{\text{source}})$$
where $\text{normalize}(x)$ strips punctuation, trims whitespace, and converts to lowercase. If a predicted entity name does not appear verbatim anywhere in the source journal text, it violates the grounding boundary.

### 3.3 Verbatim Forensic Audit of the 4 Hallucinated Cases
`[VERIFIED FROM RAW DATA]`  
All 4 hallucination instances occurred exclusively in **`V3_Confidence_All`**, triggered by the prompt instruction allowing `MEDIUM` (*"strongly implied by keywords"*) and `LOW` (*"requires inference"*) confidence tiers:

1. **`entry_016`**:
   * **Source Text:** *"Feeling under the weather with a sore throat and mild fever. Resting all day and drinking hot chamomile tea."*
   * **Extracted Entity:** `{"name": "illness", "type": "Topic", "confidence": "MEDIUM"}`
   * **Why Ungrounded:** The word *"illness"* is nowhere in the text. The model performed semantic inference/abstraction from the idiom *"under the weather"*.
2. **`entry_040`**:
   * **Source Text:** *"Felt burnt out after continuous 14-hour workdays. Time to set boundaries. [Ref #40]"*
   * **Extracted Entity:** `{"name": "burnout", "type": "Topic", "confidence": "MEDIUM"}`
   * **Why Ungrounded:** The noun *"burnout"* is not present in the text. The model nominalized the verb phrase *"burnt out"*.
3. **`entry_075`**:
   * **Source Text:** *"Felt burnt out after continuous 14-hour workdays. Time to set boundaries. [Ref #75]"*
   * **Extracted Entity:** `{"name": "burnout", "type": "Topic", "confidence": "MEDIUM"}`
   * **Why Ungrounded:** Identical nominalization lemma inference on a repeated text sample.
4. **`entry_099`**:
   * **Source Text:** *"Cooked dinner for friends at home. [Ref #99]"*
   * **Extracted Entity:** `{"name": "cooking", "type": "Topic", "confidence": "MEDIUM"}`
   * **Why Ungrounded:** The gerund noun *"cooking"* is not present in the text. The model converted the past-tense verb *"Cooked"* to an abstract activity topic.

> **Key Grounding Finding:** Filtering by `HIGH` confidence (`V3_Confidence_HighOnly`) completely removed all 4 inferred lemmas, achieving **0.00% Hallucinations**.

---

## 4. False Positive Forensic Classification (A / B / C Taxonomy)

`[DERIVED FROM RAW DATA]` & `[INTERPRETIVE]`

Every False Positive across all 5 variants was evaluated and classified into one of three structural categories:
* **Category A — Genuine Extraction Error**: Extracted span represents a common generic noun, arbitrary everyday object, or non-entity phrase outside legitimate knowledge graph scope (e.g., *"dinner"*, *"home"*, *"friends"*, *"phone call"*, *"resting"*).
* **Category B — Grounded Legitimate Concept Excluded by Strict GT**: Extracted span occurs verbatim in the text and represents a valid technical tool, domain topic, or specific project concept that the strict benchmark intentionally did not annotate (e.g., *"Drizzle ORM"*, *"pgvector"*, *"Next.js"*, *"system design"*, *"quantitative aptitude"*).
* **Category C — Ungrounded / Inferred Hallucination**: Extracted concept does not appear verbatim in the source text (e.g., *"burnout"*, *"illness"*, *"cooking"*).

### 4.1 Aggregate Forensic Distribution Table

| Variant | Total FP Count | Category A (Genuine Errors) | Category B (Grounded Excluded Concepts) | Category C (Hallucinations) | Category B Fraction of FP |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **`V0_Original`** | 112 | 58 (51.8%) | 54 (48.2%) | 0 (0.0%) | 48.2% |
| **`V1_Exhaustive`** | **51** | **17 (33.3%)** | **34 (66.7%)** | **0 (0.0%)** | **66.7%** |
| **`V2_Conservative`** | 75 | 42 (56.0%) | 33 (44.0%) | 0 (0.0%) | 44.0% |
| **`V3_Confidence_All`** | 182 | 108 (59.3%) | 70 (38.5%) | 4 (2.2%) | 38.5% |
| **`V3_Confidence_HighOnly`** | 99 | 49 (49.5%) | 50 (50.5%) | 0 (0.0%) | 50.5% |

---

## 5. V1 Exhaustive Deep Dive (Top-Performing Prompt)

### 5.1 Analysis of the 51 V1 False Positives
`[DERIVED FROM RAW DATA]`
* **Category C (Hallucinations)**: `0` (0.0%)
* **Category B (Grounded Legitimate Concepts Excluded by GT)**: `34` (66.7%)
  * *Concrete Software Tools & Libraries:* `"Drizzle ORM"` (`entry_002`), `"pgvector"` (`entry_027`), `"PostgreSQL"` (`entry_027`), `"Docker"` (`entry_044`), `"FastAPI"` (`entry_047`), `"Tailwind CSS"` (`entry_052`), `"Framer Motion"` (`entry_052`).
  * *Specific Technical Domain Topics:* `"System Design"` (`entry_025`), `"Rate Limiters"` (`entry_025`), `"Load Balancing"` (`entry_025`), `"Graph Algorithms"` (`entry_026`), `"Dynamic Programming"` (`entry_026`), `"Linear Algebra"` (`entry_034`), `"Calculus"` (`entry_034`).
  * *Standardized Exam / Academic Goals:* `"CAT 2026"` (`entry_023`), `"Quantitative Aptitude"` (`entry_023`), `"VARC"` (`entry_024`), `"Data Interpretation"` (`entry_024`).
* **Category A (Genuine Extraction Errors)**: `17` (33.3%)
  * *Over-extracted descriptive activities & common objects:* `"dark-mode UI mockups"` (`entry_003`), `"database migration strategy"` (`entry_004`), `"component library"` (`entry_009`), `"heavy payload ingestion"` (`entry_007`), `"emergency fund"` (`entry_031`), `"index funds"` (`entry_032`).

### 5.2 Analysis of the 14 V1 False Negatives
`[VERIFIED FROM RAW DATA]` & `[INTERPRETIVE]`

| Entry ID | Source Text | Missing GT Entity | Root Cause Classification |
| :--- | :--- | :--- | :--- |
| `entry_001` | *"personal finance tool"* | `Expense Tracker (Project)` | **GT Zero-Shot Alias Assumption**: Ground truth expected canonical `"Expense Tracker"`, but text only stated `"personal finance tool"`. Model correctly did not invent `"Expense Tracker"`. |
| `entry_004` | *"strict ACID compliance"* | `ACID Compliance (Topic)` | **Exact Boundary Matching**: Model extracted `"ACID"` rather than `"ACID Compliance"`. |
| `entry_005` | *"Clerk as primary auth"* | `Clerk (Organization)` | **Ontology Ambiguity**: Model classified Clerk as `Tool` rather than `Organization`. |
| `entry_006` | *"Bank statement CSV imports"* | `CSV (Tool)` | **Sub-word Span Boundary**: CSV appeared adjectivally in `"CSV imports"`. |
| `entry_028` | *"vector indexing structures: HNSW vs IVFFlat"* | `Vector Indexing`, `HNSW Indexing`, `IVFFlat Indexing` (3 FN) | **GT Annotation Inconsistency**: GT inserted the word *"Indexing"* into 3 separate entity labels when the text only contained `"HNSW vs IVFFlat"`. |
| `entry_036` / `071` | *"graph Louvain community detection"* | `Community Detection (Topic)` (2 FN) | **Span Specificity**: Model extracted `"Louvain community detection"` or `"Louvain"`, missing generic GT label. |
| `entry_041` / `076` | *"10km marathon training run"* | `Marathon Training (Goal)` (2 FN) | **Span Adjectival Boundary**: Model extracted full span `"marathon training run"`. |
| `entry_065` / `100` | *"query execution plans using EXPLAIN ANALYZE"* | `Database Query Optimization` (2 FN) | **GT Synthetic Abstraction**: GT expected an abstract topic label not present verbatim in text. |
| `entry_093` | *"Rahul initiated code review"* | `Rahul (Person)` (1 FN) | **Transient Network Drop**: 1 failed API call due to DNS socket timeout. |

---

## 6. Cross-Variant Error Patterns

`[DERIVED FROM RAW DATA]`

1. **The Abstract Lemma Trap (Confidence Prompts)**:
   * Prompts allowing `MEDIUM` / `LOW` confidence (`V3_Confidence_All`) systematically trigger nominalization (`"burnt out"` $\to$ `"burnout"`) and verb-to-gerund transformations (`"Cooked"` $\to$ `"cooking"`).
   * Restricting output to `HIGH` confidence (`V3_Confidence_HighOnly`) or using exhaustive schema types (`V1_Exhaustive`) completely eliminates this pattern.
2. **Proper Noun Hyper-Filtering Penalty (`V2_Conservative`)**:
   * Directing the model to extract *"ONLY capitalized proper nouns"* drops recall by **33.3%** because modern software tooling (`node.js`, `pgvector`, `fastapi`, `drizzle`) and technical subjects (`system design`, `calculus`) are written in lowercase.
3. **Compound Span Boundary Disconnects**:
   * Evaluator span matching fails when the model extracts specific composite spans (e.g., `"Louvain community detection"`) while the GT expects a generic sub-span (`"Community Detection"`).

---

## 7. Ground-Truth Scope Audit

`[VERIFIED FROM RAW DATA]` & `[INTERPRETIVE]`

### 7.1 Direct Answers to the 7 Scope Questions

1. **Are legitimate lower-case technical concepts being excluded?**
   * **YES.** Tools like `pgvector`, `drizzle-orm`, `postgres`, `fastapi`, `node.js` are present in text but absent from 53 entries of the GT.
2. **Are recurring activities/goals being excluded?**
   * **YES.** Legitimate goals like `"CAT 2026 preparation"`, `"half marathon"`, `"10k run"` are largely unannotated in the strict GT.
3. **Are places/social units being excluded?**
   * **MIXED.** Major cities (`"Himachal"`, `"Mumbai"`) are captured; personal circles (`"family"`, `"parents"`, `"friends"`) are appropriately excluded.
4. **Are tools/projects/topics inconsistently represented?**
   * **YES.** In `entry_005`, `"Clerk"` is labeled as `Organization`; in `entry_007`, `"Node.js"` is labeled as `Tool`; in `entry_028`, synthetic suffixes (`"HNSW Indexing"`) were injected into ground truth.
5. **Are generic nouns correctly excluded?**
   * **YES.** The GT correctly excludes arbitrary common nouns (*"chair"*, *"lunch"*, *"coffee"*, *"headache"*).
6. **Does the current GT align with the stated 7-type ontology?**
   * **PARTIALLY.** The GT is biased toward `Person` (25/60 entities) and `Topic` (14/60 entities), while `Project` (2) and `Goal` (2) are under-represented.
7. **Are some GT omissions intentional benchmark boundaries rather than errors?**
   * **YES.** The zero-inference benchmark intentionally set an aggressive filter to test whether models hallucinate when given entries with 0 named entities.

---

## 8. Precise Precision Diagnostic (Dual-View Comparison)

`[DERIVED FROM RAW DATA]`

### Dual View: Strict Benchmark Metrics vs. Grounded Forensic Metric

* **Strict Benchmark Precision**: Measures exact agreement against the frozen 60-entity GT.
* **Grounded Precision Diagnostic**: Measures whether the extracted entity is a verified, grounded text span (excluding only Category A and Category C errors).

$$\text{Grounded Precision} = \frac{\text{TP} + \text{Category B}}{\text{Total Extracted Entities (TP + FP)}}$$

| Variant | Strict Precision | Strict Recall | Strict F1 | Forensic Grounded Precision | Hallucination Rate |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **`V0_Original`** | 29.11% | 76.67% | 42.20% | **63.29%** | 0.00% |
| **`V1_Exhaustive`** | **47.42%** | **76.67%** | **58.60%** | **82.47%** | **0.00%** |
| **`V2_Conservative`** | 25.74% | 43.33% | 32.30% | **58.42%** | 0.00% |
| **`V3_Confidence_All`** | 20.87% | 80.00% | 33.10% | **51.30%** | 1.74% |
| **`V3_Confidence_HighOnly`** | 32.19% | 78.33% | 45.63% | **66.44%** | 0.00% |

> **Diagnostic Insight:** Under `V1_Exhaustive`, **82.47%** of all model extractions are verified, grounded, legitimate cognitive concepts (46 TP + 34 Grounded Concepts out of 97 total extractions).

---

## 9. Required Ground-Truth Decision & V1 Conclusion

### 9.1 Ground-Truth Decision
`[INTERPRETIVE]`  
**Verdict: B. BROADEN GROUND TRUTH (FOR PHASE 2 BENCHMARKING ONLY — PRESERVE PHASE 1 FROZEN GT)**

* **Evidence Justification**: The current strict ground truth excludes 34 legitimate, grounded technical tools, libraries, and standardized domain topics (e.g., `Drizzle ORM`, `pgvector`, `CAT 2026`, `System Design`) across 28 entries. These are valid entities for a personal cognitive knowledge graph.
* **Scope Boundary Rule**: The Phase 1 historical baseline artifact (`synthetic_journal_entities_ground_truth.json`) MUST remain immutable. A new benchmark artifact (`synthetic_journal_entities_ground_truth_v2.json`) should be created for Phase 2 Knowledge Graph evaluation.
* **Risks of Broadening**: Expanding GT without strict guidelines risks capturing generic conversational phrases. Broadening must be restricted to explicit whitelisted technical tools, formal project names, and domain topics.

### 9.2 V1 Exhaustive Conclusion
`[VERIFIED FROM RAW DATA]` & `[DERIVED FROM RAW DATA]`
1. **Under the Strict Benchmark:** **`V1_Exhaustive` is definitively the strongest prompt** across all evaluated variants (**58.60% F1 vs 42.20% V0, 32.30% V2, 45.63% V3_High**).
2. **Under Forensic Analysis:** The forensic analysis **strongly reinforces this conclusion**. `V1_Exhaustive` achieved **82.47% Grounded Precision** and **0.00% Hallucinations**, generating the cleanest candidate set of any prompt tested.

---

## 10. Final Evidence Boundaries

`[UNRESOLVED]` & `[INTERPRETIVE]`

### What the Data Proves:
1. `openai/gpt-oss-120b` with native JSON mode has a **0.00% parse failure rate** and **0.00% hallucination rate** when prompted with explicit boundaries (`V1`) or `HIGH` confidence filtering (`V3_HighOnly`).
2. The model spends **84.5%–88.8% of its completion tokens on internal reasoning**, successfully preventing structural formatting breakdown.
3. Strict precision scores in the 20–47% range are largely driven by ground-truth scope truncation (excluding legitimate lowercase tools and topics) rather than ungrounded model fabrications.

### What the Data Does NOT Prove:
1. It does NOT prove that raw LLM extraction can be deployed without an entity resolution layer or human-in-the-loop confirmation.
2. It does NOT justify unconstrained extraction on open-ended user text without canonical entity dictionary reconciliation.
