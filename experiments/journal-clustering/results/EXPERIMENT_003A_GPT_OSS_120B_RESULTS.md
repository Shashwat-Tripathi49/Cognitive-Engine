# Experiment 003A — Entity Extraction Benchmark
## Comparative Evaluation: `openai/gpt-oss-120b` vs Historical `llama-3.3-70b-versatile`

> **Benchmark Dataset:** 100 Zero-Inference Ground-Truth Journal Entries (60 Ground-Truth Entities)  
> **API Endpoint:** Groq OpenAI-Compatible API (`response_format={'type': 'json_object'}`)  
> **Pricing for GPT-OSS 120B:** $0.15 / 1M Input Tokens, $0.60 / 1M Output Tokens (includes reasoning tokens)  

---
## 1. Experiment 003A — `openai/gpt-oss-120b` Results (Full 500-Call Sweep)

| Variant Name | Exact Precision | Exact Recall | Exact F1 | Alias Precision | Alias Recall | Alias F1 | Hallucination Rate | Avg Reasoning Tokens | Reasoning % of Output | Total Cost (USD) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **`V0_Original`** | 29.11% | 76.67% | **42.20%** | 29.11% | 76.67% | **42.20%** | 0.00% | 188.7 | 86.6% | $0.0158 |
| **`V1_Exhaustive`** | 47.42% | 76.67% | **58.60%** | 47.42% | 76.67% | **58.60%** | 0.00% | 155.1 | 86.8% | $0.0154 |
| **`V2_Conservative`** | 25.74% | 43.33% | **32.30%** | 25.74% | 43.33% | **32.30%** | 0.00% | 192.2 | 88.8% | $0.0170 |
| **`V3_Confidence_All`** | 20.87% | 80.00% | **33.10%** | 20.87% | 80.00% | **33.10%** | 1.74% | 274.7 | 85.7% | $0.0231 |
| **`V3_Confidence_HighOnly`** | 32.19% | 78.33% | **45.63%** | 32.19% | 78.33% | **45.63%** | 0.00% | 245.9 | 84.5% | $0.0214 |

---
## 2. Token & Reasoning Telemetry (`openai/gpt-oss-120b`)

| Variant Name | Prompt Tokens | Completion Tokens | Reasoning Tokens | Total Tokens | Avg Latency |
|---|:---:|:---:|:---:|:---:|:---:|
| **`V0_Original`** | 17,881 | 21,798 | 18,871 | 39,679 | 987 ms |
| **`V1_Exhaustive`** | 31,467 | 17,858 | 15,505 | 49,325 | 1112 ms |
| **`V2_Conservative`** | 26,781 | 21,646 | 19,219 | 48,427 | 1286 ms |
| **`V3_Confidence_All`** | 25,881 | 32,057 | 27,474 | 57,938 | 1565 ms |
| **`V3_Confidence_HighOnly`** | 25,881 | 29,122 | 24,594 | 55,003 | 1255 ms |

* **Cumulative Batch Tokens:** 250,372 (127,891 Prompt + 122,481 Completion, containing 105,663 Reasoning Tokens)
* **Cumulative Batch Cost:** **$0.0927 USD** across 500 API calls.

---
## 3. Side-by-Side Model Comparison: `openai/gpt-oss-120b` vs `llama-3.3-70b-versatile`

| Variant | Metric | Historical `llama-3.3-70b-versatile` | Replacement `openai/gpt-oss-120b` | Delta (GPT-OSS vs Llama) |
|---|---|:---:|:---:|:---:|
| **`V0_Original`** | **Alias F1** | 49.44% | 42.20% | **-7.24%** |
| | Precision | 37.29% | 29.11% | -8.17% |
| | Recall | 73.33% | 76.67% | +3.33% |
| **`V1_Exhaustive`** | **Alias F1** | 0.00% | 58.60% | **+58.60%** |
| | Precision | 0.00% | 47.42% | +47.42% |
| | Recall | 0.00% | 76.67% | +76.67% |
| **`V2_Conservative`** | **Alias F1** | 0.00% | 32.30% | **+32.30%** |
| | Precision | 0.00% | 25.74% | +25.74% |
| | Recall | 0.00% | 43.33% | +43.33% |
| **`V3_Confidence_All`** | **Alias F1** | 0.00% | 33.10% | **+33.10%** |
| | Precision | 0.00% | 20.87% | +20.87% |
| | Recall | 0.00% | 80.00% | +80.00% |
| **`V3_Confidence_HighOnly`** | **Alias F1** | 49.20% | 45.63% | **-3.57%** |
| | Precision | 36.22% | 32.19% | -4.03% |
| | Recall | 76.67% | 78.33% | +1.67% |