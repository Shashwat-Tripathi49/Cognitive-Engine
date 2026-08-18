# Experiment 004C — Entity Resolution Safety vs. Automation Operating-Point Methodology
## Offline Parameter Sweep & Pareto Frontier Analysis Protocol

> **Document Version:** 1.0.0  
> **Status:** Approved Research Protocol  
> **Phase:** Offline Parameter Sweep (Strictly 0 External API Calls, 0 Production Changes)  
> **Scope:** Knowledge Graph Engine 3 Pre-Sprint Resolution Operating-Point Analysis  
> **Date:** 2026-08-18  

---

## 1. Executive Purpose & Research Question

Following the validated baseline established in Experiment 004B, the system's Layered Hybrid Resolver demonstrated that verified aliases achieve $100.0\%$ precision and recall, but unseen aliases under conservative thresholds achieve $18.2\%$ automatic recall with zero false merges.

### The Core Research Question of Experiment 004C:
> *"At what operating point can Cognitive Engine maximize automatic entity resolution coverage while keeping the Global False-Merge Rate and Hard-Negative False-Merge Rate strictly at zero?"*

We formally analyze the multi-dimensional tradeoff between:
1. **Automatic Resolution Coverage ($R_{\text{auto}}$):** Mentions automatically canonicalized without user intervention.
2. **False-Merge Risk ($R_{\text{FM}}$):** Catastrophic wrong-entity links corrupting the Knowledge Graph.
3. **Pending-Confirmation Load ($R_{\text{pending}}$):** Mentions safely routed to the human confirmation staging queue.

---

## 2. Predeclared Safety Gates & Decision Policy

To maintain scientific integrity and prevent post-hoc rationalization, all decision gates and tie-breaking rules are locked prior to evaluation.

### Mandatory Pre-Declared Safety Gates:
* **Gate A (Zero Global False Merges):**
  $$\text{Global False-Merge Rate } (R_{\text{FM\_global}}) = \mathbf{0.0\%}$$
  *Rationale:* Any automated link to a wrong canonical entity violates the core Cognitive Engine evidence-bound invariant.
* **Gate B (Zero Hard-Negative False Merges):**
  $$\text{Hard-Negative False-Merge Rate } (R_{\text{FM\_hardneg}}) = \mathbf{0.0\%}$$
  *Rationale:* Modifier traps (e.g. `Postgres Operator`, `FastAPI Swagger Plugin`, `FitTrack Web`) must never be absorbed into parent entities.
* **Gate C (Ambiguity Safety):**
  $$\text{Ambiguity Accuracy } (Acc_{\text{amb}}) \ge \mathbf{90.0\%}$$
  *Rationale:* Generic references (`the project`, `he`, `my manager`, `5K goal`) must be routed to `AMBIGUOUS / PENDING_CONFIRMATION`.

### Primary Decision Rule:
> **Select the configuration that achieves the MAXIMUM Automatic Resolution Recall ($R_{\text{res}}$) across the evaluation set while strictly satisfying Safety Gates A, B, and C.**

### Tie-Breaking Hierarchy:
If multiple configurations satisfy all safety gates with equal recall:
1. **Higher Unseen-Alias Recall ($R_{\text{unseen}}$)**
2. **Lower Pending-Confirmation Rate ($R_{\text{pending}}$)**
3. **Lower False-Split Rate ($R_{\text{FS}}$)**
4. **Lower Average Compute Latency ($\mu\text{s}$)**

---

## 3. Parameter Sweep Grid Specifications

The Layered Hybrid Resolver parameters are systematically swept across the following discrete intervals:

1. **Embedding Acceptance Threshold ($t_{\text{embed}}$):**
   $$\mathcal{S}_{\text{embed}} \in \{0.78, 0.80, 0.82, 0.84, 0.86, 0.88, 0.90\}$$
   *Current Baseline:* $0.82$
2. **Candidate Separation Margin ($\text{margin} = \text{top}_1 - \text{top}_2$):**
   $$\mathcal{S}_{\text{margin}} \in \{0.04, 0.06, 0.08, 0.10, 0.12\}$$
   *Current Baseline:* $0.08$
3. **Confirmation Band Lower Threshold ($t_{\text{amb\_lower}}$):**
   $$\mathcal{S}_{\text{amb\_lower}} \in \{0.65, 0.70, 0.75\}$$
   *Current Baseline:* $0.70$ (Any similarity $t_{\text{amb\_lower}} \le \text{sim} < t_{\text{embed}}$ routes to `AMBIGUOUS`).
4. **Guarded String Similarity Threshold ($t_{\text{string}}$):**
   $$\mathcal{S}_{\text{string}} \in \{0.85, 0.88, 0.92\}$$
   *Current Baseline:* $0.88$

---

## 4. Evaluation Partitions & Metric Formulas

Evaluations are performed against the frozen **`entity_resolution_004b_gold.json`** dataset (90 cases total):
* **Calibration Split ($N=26$):** Used for parameter sensitivity tuning.
* **Known-Alias Evaluation Split ($N=32$):** 24 resolvable targets with active dictionary entries.
* **Unseen-Alias Evaluation Split ($N=32$):** 22 resolvable targets with strictly zero active dictionary entries.
* **Combined Blind Evaluation Set ($N=64$):** Complete benchmark test set.

### Core Output Metrics:
1. **Automatic Resolution Rate ($R_{\text{auto}}$):** $\frac{|\text{RESOLVED Decisions}|}{N_{\text{total}}}$
2. **Pending Confirmation Rate ($R_{\text{pending}}$):** $\frac{|\text{AMBIGUOUS Decisions}|}{N_{\text{total}}}$
3. **No-Match Rate ($R_{\text{nomatch\_rate}}$):** $\frac{|\text{NO\_MATCH Decisions}|}{N_{\text{total}}}$
4. **Global False-Merge Rate ($R_{\text{FM\_global}}$):** $\frac{|\text{False Merges}|}{|\text{RESOLVED Decisions}|}$
5. **Hard-Negative False-Merge Rate ($R_{\text{FM\_hardneg}}$):** $\frac{|\text{False Merges on CAT\_H}|}{N_{\text{CAT\_H}}}$
6. **Unseen-Alias Recall ($R_{\text{unseen}}$):** $\frac{TP_{\text{unseen}}}{N_{\text{unseen\_resolvable}}}$
7. **Resolution Precision ($P_{\text{res}}$):** $\frac{TP}{TP + FP}$
8. **Resolution Recall ($R_{\text{res}}$):** $\frac{TP}{N_{\text{resolvable}}}$
9. **Resolution F1 ($F1_{\text{res}}$):** $2 \cdot \frac{P \cdot R}{P + R}$
