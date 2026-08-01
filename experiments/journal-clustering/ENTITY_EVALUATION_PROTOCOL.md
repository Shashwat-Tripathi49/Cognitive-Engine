# Entity Extraction Evaluation Protocol (v1.0)

> **Workspace:** `experiments/journal-clustering/`  
> **Date:** 2026-08-01  
> **Status:** Standard Operating Procedure  
> **Scope:** Establishes the reproducible, scientific evaluation pipeline for real LLM entity extraction benchmarks against canonical ground-truth annotations.

---

## 1. Overview & Objective

This document defines the formal protocol for running and scoring entity extraction experiments in the Cognitive Engine project. It guarantees that model evaluations (whether using Groq Llama 3.3, OpenAI GPT-4o, local Ollama models, or regex heuristics) produce fair, directly comparable, and scientifically rigorous metrics.

---

## 2. Evaluation Datasets

1. **Input Text Corpus:** `synthetic_journal_entries.json` (100 synthetic journal entries spanning work, personal finance, health, travel, learning, and family).
2. **Canonical Ground Truth Dataset:** `synthetic_journal_entities_ground_truth.json` (Exhaustive entity annotations following `ENTITY_ANNOTATION_GUIDELINES.md`).

---

## 3. Metric Calculations & Protocols

### 3.1 Strict vs. Surface Scoring

* **Strict Match (Primary Metric):** A predicted entity is scored as a **True Positive ($TP$)** if and only if:
  1. The predicted entity name matches the Ground Truth canonical name, text span, or an approved alias.
  2. The predicted entity `type` matches the Ground Truth `type` exactly (`Person`, `Project`, `Organization`, `Place`, `Tool`, `Topic`, `Goal`).
* **Type Mismatch Penalty:** An entity with the correct text span but wrong entity type is scored as a **False Positive ($FP$)** for the predicted type and a **False Negative ($FN$)** for the ground truth type.

### 3.2 Key Formulas

* **Precision ($P$):** $\frac{TP}{TP + FP}$
* **Recall ($R$):** $\frac{TP}{TP + FN}$
* **F1 Score ($F_1$):** $\frac{2 \cdot P \cdot R}{P + R}$
* **False Positive Rate ($FPR$):** $\frac{FP}{TP + FP + FN}$
* **False Negative Rate ($FNR$):** $\frac{FN}{TP + FN}$
* **Hallucination Rate:** $\frac{\text{Hallucinated Entities}}{\text{Total Predictions}}$
  * *Hallucinated Entity:* A predicted entity whose string or key token components do NOT appear in the source journal entry text and have zero textual grounding.
* **Parse Failure Rate:** $\frac{\text{Malformed Responses}}{\text{Total API Calls}}$
  * *Parse Failure:* API call that returns non-JSON, unparseable markdown formatting, missing `"entities"` array key, or HTTP errors. Parse failures generate $FN$ for all ground truth entities in that entry.

---

## 4. API Benchmarking & Cost Tracking

For every API model evaluated, the pipeline MUST record:

1. **Average Latency per Entry (ms):** Wall-clock duration from request launch to response receipt.
2. **Prompt Tokens:** Total input tokens consumed.
3. **Completion Tokens:** Total output tokens generated.
4. **Total Cost (USD):** Calculated using standard provider API rates (e.g. Groq Llama 3.3 70B: $\$0.59 / 1\text{M}$ input, $\$0.79 / 1\text{M}$ output).

---

## 5. Standard Prompt Variant Definitions

When benchmarking a model, evaluate the following 4 standardized prompt philosophies:

| Variant ID | Name | Objective / Description |
|---|---|---|
| **V0** | Baseline Original | General extraction prompt requesting JSON structure. |
| **V1** | Exhaustive | Explicitly lists all 7 entity types and instructs model to extract every candidate entity mentioned. |
| **V2** | Conservative | Zero-inference rules: ONLY extract entities whose exact proper name appears as a literal text span. |
| **V3** | Confidence-Tiered | Instructs model to assign `HIGH`, `MEDIUM`, or `LOW` confidence; evaluated at `All` vs `HighOnly`. |

---

## 6. Scientific Reporting Template

All benchmark runs must be logged in `RESULTS.md` using the standard comparison format:

```
| Variant | Precision | Recall | F1 Score | Hallucination Rate | Parse Fail Rate | Avg Latency | Cost ($) | Verdict |
```
