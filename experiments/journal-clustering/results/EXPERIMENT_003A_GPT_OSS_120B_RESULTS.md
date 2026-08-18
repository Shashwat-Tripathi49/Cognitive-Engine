# Experiment 003A — Entity Extraction Benchmark
## Evaluation Results: `openai/gpt-oss-120b` (Completed Variants: V0, V1, V2, V3_All)

> **Benchmark Dataset:** 100 Zero-Inference Ground-Truth Journal Entries (60 Ground-Truth Entities)  
> **Model:** `openai/gpt-oss-120b` (Groq OpenAI-Compatible API Endpoint, Native JSON Mode)  
> **Pricing:** $0.15 / 1M Input Tokens, $0.60 / 1M Output Tokens (includes reasoning tokens)  
> **Result Artifact:** [`experiments/journal-clustering/results/experiment_003a_gpt_oss_120b_results.json`](file:///c:/Users/SHASHWAT%20TRIPATHI/OneDrive/Documents/Desktop/cognitive-engine/Cognitive-Engine/experiments/journal-clustering/results/experiment_003a_gpt_oss_120b_results.json)  

---

## 1. Performance Summary (4 Completed Variants on `openai/gpt-oss-120b`)

| Variant Name | Exact Precision | Exact Recall | Exact F1 | Alias Precision | Alias Recall | Alias F1 | Hallucination Rate | API / Parse Failures | Cost (USD) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **`V0_Original`** | 29.11% | 76.67% | **42.20%** | 29.11% | 76.67% | **42.20%** | **0.00%** | 0% / 0% | $0.0158 |
| **`V1_Exhaustive`** | 47.42% | 76.67% | **58.60%** | 47.42% | 76.67% | **58.60%** | **0.00%** | 1%* / 0% | $0.0154 |
| **`V2_Conservative`** | 25.74% | 43.33% | **32.30%** | 25.74% | 43.33% | **32.30%** | **0.00%** | 0% / 0% | $0.0170 |
| **`V3_Confidence_All`** | 20.87% | 80.00% | **33.10%** | 20.87% | 80.00% | **33.10%** | **1.74%** (4 hall.) | 0% / 0% | $0.0231 |

*\*Note: 1 API retry drop due to transient rate-limit backoff; 0 malformed JSON or schema failures across all 400 completed calls.*

---

## 2. Token & Reasoning Telemetry (`openai/gpt-oss-120b`)

| Variant Name | Prompt Tokens | Completion Tokens | Reasoning Tokens | Total Tokens | Avg Reasoning / Call | Reasoning % of Output | Avg Latency |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **`V0_Original`** | 17,881 | 21,798 | 18,871 | 39,679 | 188.7 | 86.6% | 987 ms |
| **`V1_Exhaustive`** | 31,467 | 17,858 | 15,505 | 49,325 | 155.1 | 86.8% | 1,112 ms |
| **`V2_Conservative`** | 26,781 | 21,646 | 19,219 | 48,427 | 192.2 | 88.8% | 1,286 ms |
| **`V3_Confidence_All`** | 25,881 | 32,057 | 27,474 | 57,938 | 274.7 | 85.7% | 1,565 ms |
| **TOTAL (400 Calls)** | **102,010** | **93,359** | **81,069** | **195,369** | **202.7** | **86.8%** | **1,238 ms** |

* **Total Cost Incurred for 400 Calls:** **$0.0713 USD** (~7 cents).
* **Reasoning Profile:** `openai/gpt-oss-120b` consistently spends **~87% of its completion budget** generating internal reasoning (`message["reasoning"]`).

---

## 3. Verbatim Hallucination Audit: `V3_Confidence_All` (4 Detected Cases)

All 4 hallucination cases in `V3_Confidence_All` were caused by the prompt's explicit instruction to extract inferred concepts (`MEDIUM: implied by keywords`, `LOW: requires inference`), causing the model to emit abstract lemmas/concepts rather than exact text spans:

### Case 1: `entry_016`
* **Source Text:** `"Feeling under the weather with a sore throat and mild fever. Resting all day and drinking hot chamomile tea."`
* **Ground Truth:** `[]` (Zero named entities)
* **Verbatim Extracted Entities:**
  1. `{"name": "illness", "type": "Topic", "confidence": "MEDIUM"}` $\longrightarrow$ **HALLUCINATED** (Abstract lemma inferred from "under the weather")
  2. `{"name": "sore throat", "type": "Topic", "confidence": "HIGH"}` (Present in text)
  3. `{"name": "fever", "type": "Topic", "confidence": "HIGH"}` (Present in text)
  4. `{"name": "chamomile tea", "type": "Tool", "confidence": "HIGH"}` (Present in text)

### Case 2: `entry_040`
* **Source Text:** `"Felt burnt out after continuous 14-hour workdays. Time to set boundaries. [Ref #40]"`
* **Ground Truth:** `[]` (Zero named entities)
* **Verbatim Extracted Entities:**
  1. `{"name": "burnout", "type": "Topic", "confidence": "MEDIUM"}` $\longrightarrow$ **HALLUCINATED** (Nominalized lemma inferred from verb phrase "burnt out")
  2. `{"name": "boundaries", "type": "Goal", "confidence": "MEDIUM"}` (Present in text)
  3. `{"name": "14-hour workdays", "type": "Topic", "confidence": "MEDIUM"}` (Present in text)

### Case 3: `entry_075`
* **Source Text:** `"Felt burnt out after continuous 14-hour workdays. Time to set boundaries. [Ref #75]"`
* **Ground Truth:** `[]` (Zero named entities)
* **Verbatim Extracted Entities:**
  1. `{"name": "burnout", "type": "Topic", "confidence": "MEDIUM"}` $\longrightarrow$ **HALLUCINATED** (Duplicate text entry #40, identical lemma inference)
  2. `{"name": "boundaries", "type": "Goal", "confidence": "MEDIUM"}` (Present in text)
  3. `{"name": "14-hour workdays", "type": "Topic", "confidence": "MEDIUM"}` (Present in text)

### Case 4: `entry_099`
* **Source Text:** `"Cooked dinner for friends at home. [Ref #99]"`
* **Ground Truth:** `[]` (Zero named entities)
* **Verbatim Extracted Entities:**
  1. `{"name": "cooking", "type": "Topic", "confidence": "MEDIUM"}` $\longrightarrow$ **HALLUCINATED** (Gerund lemma inferred from past tense verb "Cooked")
  2. `{"name": "friends", "type": "Person", "confidence": "LOW"}` (Present in text)
  3. `{"name": "home", "type": "Place", "confidence": "HIGH"}` (Present in text)

---

## 4. Reconciled Baseline Context (Forensic Audit Grounding)

> [!NOTE]
> **Methodological Clarification:** The historical Llama 3.3 70B benchmark suffered from unconstrained markdown output causing 100% parse failure rates on variants V1, V2, and V3. Therefore, delta calculations against 0.00% are uninformative artifacts of formatting failure rather than model capability.

* **Reconciled Historical Llama 3.3 70B Baseline (Forensic Audit Confirmed):**
  * `V0_Original`: **Precision = 27.78%**, **Recall = 7.35%**, **F1 = 11.63%**
* **`openai/gpt-oss-120b` (Native JSON Mode):**
  * `V0_Original`: **Precision = 29.11%**, **Recall = 76.67%**, **F1 = 42.20%**
  * `V1_Exhaustive`: **Precision = 47.42%**, **Recall = 76.67%**, **F1 = 58.60%** (Highest recall/precision balance)
  * `V2_Conservative`: **Precision = 25.74%**, **Recall = 43.33%**, **F1 = 32.30%**
  * `V3_Confidence_All`: **Precision = 20.87%**, **Recall = 80.00%**, **F1 = 33.10%**
