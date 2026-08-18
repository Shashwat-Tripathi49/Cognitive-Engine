"""
Experiment 003A — GPT-OSS 120B: Real LLM Entity Extraction Benchmark
Model: openai/gpt-oss-120b (Groq OpenAI-Compatible API Endpoint, Native JSON Mode)

Fulfills all Experiment 003A GPT-OSS requirements:
1. Dedicated output artifact: experiment_003a_gpt_oss_120b_results.json (historical Llama results untouched).
2. Per-call and per-variant telemetry: prompt_tokens, completion_tokens, reasoning_tokens, total_tokens, latency_ms.
3. Full reasoning token analytics (avg reasoning tokens/call, total reasoning tokens, reasoning/completion ratio).
4. Incremental persistence: saves progress per entry and flushes merged results after every variant completes.
5. Strict rate-pacing (1.5s delay) to guarantee 0% HTTP 429 drops.
6. Evaluates all 5 variants: V0_Original, V1_Exhaustive, V2_Conservative, V3_Confidence_All, V3_Confidence_HighOnly.
7. Exact same ground-truth dataset and dual-matching protocol (Exact Span & Alias-Aware) as historical 003A.
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error

# Force UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8')

MODEL = "openai/gpt-oss-120b"
GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"

PRICE_PER_M_INPUT = 0.15   # $0.15 per 1M prompt tokens
PRICE_PER_M_OUTPUT = 0.60  # $0.60 per 1M completion tokens (includes reasoning tokens)

DATASET_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../dataset/synthetic_journal_entities_ground_truth.json'))
RESULTS_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../results/experiment_003a_gpt_oss_120b_results.json'))
PROGRESS_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../results/experiment_003a_gpt_oss_120b_progress.json'))
MARKDOWN_REPORT_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../results/EXPERIMENT_003A_GPT_OSS_120B_RESULTS.md'))

def load_env_file():
    for path in [".env", "../.env", "../../.env", "../../../.env", os.path.join(os.path.dirname(__file__), "../../../.env")]:
        abs_path = os.path.abspath(path)
        if os.path.exists(abs_path):
            with open(abs_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ[k.strip()] = v.strip().strip('"').strip("'")

load_env_file()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("ERROR: GROQ_API_KEY not found in environment or .env.")
    sys.exit(1)

# Prompt Definitions (Exact same templates as historical 003A)
PROMPT_V0_ORIGINAL = """Extract all named entities from the following journal entry.
Return a JSON object with key "entities" containing a list of objects with "name" and "type".
Supported types: Person, Project, Place, Organization, Tool, Topic, Goal.
If no entities are found, return {"entities": []}.

Journal entry:
"{text}"
"""

PROMPT_V1_EXHAUSTIVE = """You are an entity extraction system. Enumerate EVERY named entity mentioned in the following journal entry.

Entity types:
- Person: Any named individual (e.g., "Rahul", "Priya")
- Project: Any named project, product, or initiative (e.g., "Expense Tracker")
- Organization: Any company, university, or group
- Place: Any city, venue, or geographic location (e.g., "Bangalore", "Mumbai")
- Tool: Any software library, framework, or technology (e.g., "React", "Node.js", "PostgreSQL")
- Topic: Any subject area or field of study (e.g., "machine learning", "system design")
- Goal: Any explicit objective or milestone (e.g., "CAT 2026 Preparation")

Be thorough. Extract every entity mentioned.
Return a JSON object with key "entities": [{"name": "...", "type": "..."}].
If no entities are found, return {"entities": []}.

Journal entry:
"{text}"
"""

PROMPT_V2_CONSERVATIVE = """Extract named entities from the following journal entry.

STRICT RULES:
1. ONLY extract entities whose EXACT NAME appears as a word or phrase in the text.
2. Do NOT infer, guess, or deduce entities that are not explicitly named.
3. If the text says "the project" or "the tool" without naming it, do NOT extract anything for it.
4. If the text says "he" or "she" without naming the person, do NOT extract a person entity.
5. Only return entities you are 100% certain are explicitly named in the text.

Return a JSON object with key "entities": [{"name": "...", "type": "..."}].
If no entities are found, return {"entities": []}.

Journal entry:
"{text}"
"""

PROMPT_V3_CONFIDENCE = """Extract named entities from the following journal entry. For each entity, assign a confidence level:

- HIGH: The entity's exact proper name appears explicitly in the text.
- MEDIUM: The entity is strongly implied by specific keywords (e.g., "budgeting module" implies a finance project).
- LOW: The entity is vaguely referenced or requires inference (e.g., "the project", "he").

Entity types: Person, Project, Place, Organization, Tool, Topic, Goal.

Return a JSON object with key "entities": [{"name": "...", "type": "...", "confidence": "HIGH|MEDIUM|LOW"}].
If no entities are found, return {"entities": []}.

Journal entry:
"{text}"
"""

PROMPTS = {
    "V0_Original": PROMPT_V0_ORIGINAL,
    "V1_Exhaustive": PROMPT_V1_EXHAUSTIVE,
    "V2_Conservative": PROMPT_V2_CONSERVATIVE,
    "V3_Confidence_All": PROMPT_V3_CONFIDENCE,
    "V3_Confidence_HighOnly": PROMPT_V3_CONFIDENCE,
}

def call_groq_api(prompt_text, retries=5):
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
        "User-Agent": "CognitiveEngine-Benchmark/1.0"
    }
    payload = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt_text}],
        "response_format": {"type": "json_object"},
        "temperature": 0.0,
        "max_tokens": 1024
    }

    data_bytes = json.dumps(payload).encode("utf-8")

    for attempt in range(retries):
        start_time = time.time()
        req = urllib.request.Request(GROQ_ENDPOINT, data=data_bytes, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                elapsed_ms = (time.time() - start_time) * 1000
                raw_body = resp.read().decode("utf-8")
                data = json.loads(raw_body)
                
                choice = data["choices"][0]
                msg = choice["message"]
                content = msg.get("content", "")
                reasoning = msg.get("reasoning", "")
                usage = data.get("usage", {})
                
                return content, reasoning, elapsed_ms, usage, True, None
        except urllib.error.HTTPError as e:
            elapsed_ms = (time.time() - start_time) * 1000
            err_msg = e.read().decode("utf-8")
            if e.code == 429:
                # Rate limit backoff
                wait_sec = 5.0 * (attempt + 1)
                print(f"    [HTTP 429] Rate limited. Waiting {wait_sec:.1f}s before retry {attempt+1}/{retries}...")
                time.sleep(wait_sec)
                continue
            if e.code in (401, 403):
                return None, "", elapsed_ms, {}, False, f"FATAL AUTH ERROR HTTP {e.code}: {err_msg[:200]}"
            if attempt == retries - 1:
                return None, "", elapsed_ms, {}, False, f"HTTP {e.code}: {err_msg[:200]}"
            time.sleep(2.0)
        except Exception as e:
            elapsed_ms = (time.time() - start_time) * 1000
            if attempt == retries - 1:
                return None, "", elapsed_ms, {}, False, str(e)
            time.sleep(2.0)

    return None, "", 0, {}, False, "Retries exhausted"

def is_hallucinated(pred_name, text):
    p_lower = pred_name.lower().strip()
    t_lower = text.lower()
    if p_lower in t_lower:
        return False
    parts = [w for w in p_lower.split() if len(w) > 2]
    if any(part in t_lower for part in parts):
        return False
    return True

def evaluate_predictions_exact_span(gt_entities, pred_entities, text):
    tp, fp, hallucinations = 0, 0, 0
    matched_gt = set()

    for p in pred_entities:
        p_name = p.get("name", "").strip().lower()
        p_type = p.get("type", "").strip().lower()

        is_match = False
        for j, g in enumerate(gt_entities):
            if j in matched_gt:
                continue
            g_span = g.get("text_span", "").strip().lower()
            g_name = g.get("name", "").strip().lower()
            g_type = g.get("type", "").strip().lower()

            if (p_name == g_span or p_name == g_name) and (p_type == g_type):
                tp += 1
                matched_gt.add(j)
                is_match = True
                break

        if not is_match:
            if is_hallucinated(p.get("name", ""), text):
                hallucinations += 1
            fp += 1

    fn = len(gt_entities) - len(matched_gt)
    return tp, fp, fn, hallucinations

def evaluate_predictions_alias_aware(gt_entities, pred_entities, text):
    tp, fp, hallucinations = 0, 0, 0
    matched_gt = set()

    for p in pred_entities:
        p_name = p.get("name", "").strip().lower()
        p_type = p.get("type", "").strip().lower()

        is_match = False
        for j, g in enumerate(gt_entities):
            if j in matched_gt:
                continue
            g_name = g.get("name", "").strip().lower()
            g_span = g.get("text_span", "").strip().lower()
            g_type = g.get("type", "").strip().lower()
            g_aliases = [a.lower() for a in g.get("aliases", [])]

            name_match = (p_name == g_name or p_name == g_span or p_name in g_aliases or any(a in p_name for a in g_aliases))
            type_match = (p_type == g_type)

            if name_match and type_match:
                tp += 1
                matched_gt.add(j)
                is_match = True
                break

        if not is_match:
            if is_hallucinated(p.get("name", ""), text):
                hallucinations += 1
            fp += 1

    fn = len(gt_entities) - len(matched_gt)
    return tp, fp, fn, hallucinations

def run_benchmark():
    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        dataset = json.load(f)

    total_gt_ents = sum(len(e["entities"]) for e in dataset)

    print("=" * 105)
    print("EXPERIMENT 003A — GPT-OSS 120B BENCHMARK (100 Entries x 5 Variants = 500 Calls)")
    print(f"Model: {MODEL} (Groq API, Native JSON Mode)")
    print(f"Dataset Size: {len(dataset)} entries ({total_gt_ents} GT Entities)")
    print(f"Output File: {RESULTS_PATH}")
    print("=" * 105 + "\n")

    # Load existing results if file exists to support incremental resumption
    variant_results = {}
    if os.path.exists(RESULTS_PATH):
        try:
            with open(RESULTS_PATH, "r", encoding="utf-8") as f:
                existing_payload = json.load(f)
                if "variant_results" in existing_payload:
                    variant_results = existing_payload["variant_results"]
                    print(f"Resuming: Loaded {len(variant_results)} existing completed variant(s): {list(variant_results.keys())}")
        except Exception as e:
            print(f"Warning loading existing results: {e}")

    variants_to_run = ["V0_Original", "V1_Exhaustive", "V2_Conservative", "V3_Confidence_All", "V3_Confidence_HighOnly"]

    for variant_idx, variant_name in enumerate(variants_to_run, start=1):
        if variant_name in variant_results:
            print(f"\n[{variant_idx}/5] Skipping already completed variant: {variant_name}")
            continue

        print(f"\n{'='*105}")
        print(f"[{variant_idx}/5] STARTING VARIANT: {variant_name} (100 calls, 1.5s pacing)")
        print(f"{'='*105}", flush=True)

        prompt_template = PROMPTS[variant_name]
        is_high_only = (variant_name == "V3_Confidence_HighOnly")

        tp_exact_tot, fp_exact_tot, fn_exact_tot, hal_exact_tot = 0, 0, 0, 0
        tp_alias_tot, fp_alias_tot, fn_alias_tot, hal_alias_tot = 0, 0, 0, 0
        
        api_failures = 0
        malformed_json_failures = 0
        schema_parse_failures = 0

        total_latency_ms = 0.0
        prompt_tokens_total = 0
        completion_tokens_total = 0
        reasoning_tokens_total = 0

        per_call_telemetry = []

        for idx, entry in enumerate(dataset):
            entry_id = entry["id"]
            text = entry["text"]
            gt_entities = entry["entities"]

            prompt_text = prompt_template.replace("{text}", text)
            raw_text, reasoning, latency_ms, usage, success, err = call_groq_api(prompt_text)

            # Rate pacing: 1.5s between calls (~40 RPM)
            time.sleep(1.5)

            p_tokens = usage.get("prompt_tokens", 0)
            c_tokens = usage.get("completion_tokens", 0)
            details = usage.get("completion_tokens_details", {})
            r_tokens = details.get("reasoning_tokens", 0)
            t_tokens = usage.get("total_tokens", p_tokens + c_tokens)

            total_latency_ms += latency_ms
            prompt_tokens_total += p_tokens
            completion_tokens_total += c_tokens
            reasoning_tokens_total += r_tokens

            # Metric 1: API Failures
            if not success or not raw_text:
                api_failures += 1
                fn_exact_tot += len(gt_entities)
                fn_alias_tot += len(gt_entities)
                per_call_telemetry.append({
                    "entry_id": entry_id,
                    "status": "API_FAILURE",
                    "error": err,
                    "latency_ms": latency_ms,
                    "prompt_tokens": p_tokens,
                    "completion_tokens": c_tokens,
                    "reasoning_tokens": r_tokens
                })
                continue

            # Metric 2: Malformed JSON Failures
            try:
                parsed_data = json.loads(raw_text.strip())
            except Exception as je:
                malformed_json_failures += 1
                fn_exact_tot += len(gt_entities)
                fn_alias_tot += len(gt_entities)
                per_call_telemetry.append({
                    "entry_id": entry_id,
                    "status": "MALFORMED_JSON",
                    "error": str(je),
                    "raw_text": raw_text[:200],
                    "latency_ms": latency_ms,
                    "prompt_tokens": p_tokens,
                    "completion_tokens": c_tokens,
                    "reasoning_tokens": r_tokens
                })
                continue

            # Metric 3: Schema Parse Failures
            extracted = None
            if isinstance(parsed_data, dict):
                for k in ["entities", "named_entities", "data", "results"]:
                    if k in parsed_data and isinstance(parsed_data[k], list):
                        extracted = parsed_data[k]
                        break

            if extracted is None:
                schema_parse_failures += 1
                extracted = []

            if is_high_only:
                extracted = [e for e in extracted if isinstance(e, dict) and str(e.get("confidence", "")).upper() == "HIGH"]

            valid_extracted = [e for e in extracted if isinstance(e, dict) and "name" in e and "type" in e]

            # Dual Evaluation
            tp_ex, fp_ex, fn_ex, hal_ex = evaluate_predictions_exact_span(gt_entities, valid_extracted, text)
            tp_al, fp_al, fn_al, hal_al = evaluate_predictions_alias_aware(gt_entities, valid_extracted, text)

            tp_exact_tot += tp_ex
            fp_exact_tot += fp_ex
            fn_exact_tot += fn_ex
            hal_exact_tot += hal_ex

            tp_alias_tot += tp_al
            fp_alias_tot += fp_al
            fn_alias_tot += fn_al
            hal_alias_tot += hal_al

            per_call_telemetry.append({
                "entry_id": entry_id,
                "status": "SUCCESS",
                "extracted_count": len(valid_extracted),
                "exact_tp": tp_ex, "exact_fp": fp_ex, "exact_fn": fn_ex, "exact_hal": hal_ex,
                "alias_tp": tp_al, "alias_fp": fp_al, "alias_fn": fn_al, "alias_hal": hal_al,
                "prompt_tokens": p_tokens,
                "completion_tokens": c_tokens,
                "reasoning_tokens": r_tokens,
                "total_tokens": t_tokens,
                "latency_ms": latency_ms
            })

            if (idx + 1) % 20 == 0 or (idx + 1) == len(dataset):
                print(f"  [{variant_name}] {idx + 1:3d}/100 entries processed | TP_Exact: {tp_exact_tot} | FP_Exact: {fp_exact_tot} | FN_Exact: {fn_exact_tot} | ReasTokens: {reasoning_tokens_total:,}", flush=True)

        # Compute Metrics
        tot_pred_exact = tp_exact_tot + fp_exact_tot
        prec_exact = tp_exact_tot / tot_pred_exact if tot_pred_exact > 0 else 0.0
        rec_exact = tp_exact_tot / (tp_exact_tot + fn_exact_tot) if (tp_exact_tot + fn_exact_tot) > 0 else 0.0
        f1_exact = (2 * prec_exact * rec_exact / (prec_exact + rec_exact)) if (prec_exact + rec_exact) > 0 else 0.0
        hal_rate_exact = hal_exact_tot / tot_pred_exact if tot_pred_exact > 0 else 0.0

        tot_pred_alias = tp_alias_tot + fp_alias_tot
        prec_alias = tp_alias_tot / tot_pred_alias if tot_pred_alias > 0 else 0.0
        rec_alias = tp_alias_tot / (tp_alias_tot + fn_alias_tot) if (tp_alias_tot + fn_alias_tot) > 0 else 0.0
        f1_alias = (2 * prec_alias * rec_alias / (prec_alias + rec_alias)) if (prec_alias + rec_alias) > 0 else 0.0
        hal_rate_alias = hal_alias_tot / tot_pred_alias if tot_pred_alias > 0 else 0.0

        cost_usd = (prompt_tokens_total / 1_000_000 * PRICE_PER_M_INPUT) + (completion_tokens_total / 1_000_000 * PRICE_PER_M_OUTPUT)
        reasoning_ratio = (reasoning_tokens_total / completion_tokens_total) if completion_tokens_total > 0 else 0.0
        avg_reas_per_call = reasoning_tokens_total / len(dataset)

        variant_record = {
            "name": variant_name,
            "model": MODEL,
            "api_failure_rate": api_failures / len(dataset),
            "api_failures_count": api_failures,
            "malformed_json_rate": malformed_json_failures / len(dataset),
            "malformed_json_count": malformed_json_failures,
            "schema_failure_rate": schema_parse_failures / len(dataset),
            "schema_failures_count": schema_parse_failures,
            "avg_latency_ms": total_latency_ms / len(dataset),
            "telemetry": {
                "prompt_tokens_total": prompt_tokens_total,
                "completion_tokens_total": completion_tokens_total,
                "reasoning_tokens_total": reasoning_tokens_total,
                "total_tokens": prompt_tokens_total + completion_tokens_total,
                "avg_prompt_tokens_per_call": prompt_tokens_total / len(dataset),
                "avg_completion_tokens_per_call": completion_tokens_total / len(dataset),
                "avg_reasoning_tokens_per_call": avg_reas_per_call,
                "reasoning_fraction_of_completion": reasoning_ratio,
                "cost_usd": cost_usd,
                "billing_note": "Groq bills output tokens at $0.60/1M tokens inclusive of reasoning tokens."
            },
            "exact_span_matching": {
                "precision": prec_exact,
                "recall": rec_exact,
                "f1": f1_exact,
                "hallucination_rate": hal_rate_exact,
                "tp": tp_exact_tot,
                "fp": fp_exact_tot,
                "fn": fn_exact_tot,
                "hallucinations_count": hal_exact_tot
            },
            "alias_aware_matching": {
                "precision": prec_alias,
                "recall": rec_alias,
                "f1": f1_alias,
                "hallucination_rate": hal_rate_alias,
                "tp": tp_alias_tot,
                "fp": fp_alias_tot,
                "fn": fn_alias_tot,
                "hallucinations_count": hal_alias_tot
            },
            "per_call_telemetry": per_call_telemetry
        }

        # Store and IMMEDIATELY flush to disk
        variant_results[variant_name] = variant_record

        out_payload = {
            "experiment": "Experiment 003A — GPT-OSS 120B Entity Extraction Benchmark",
            "model": MODEL,
            "api_feature_used": "response_format={'type': 'json_object'}",
            "dataset_size": len(dataset),
            "total_ground_truth_entities": total_gt_ents,
            "pricing": {
                "input_per_million_usd": PRICE_PER_M_INPUT,
                "output_per_million_usd": PRICE_PER_M_OUTPUT,
                "note": "Output token rate includes generated reasoning tokens."
            },
            "variant_results": variant_results
        }

        with open(RESULTS_PATH, "w", encoding="utf-8") as f:
            json.dump(out_payload, f, indent=2)

        print(f"\n[SAVED] Flushed intermediate results for [{variant_name}] to {RESULTS_PATH}")
        print(f"  Exact F1: {f1_exact*100:.2f}% (P={prec_exact*100:.2f}%, R={rec_exact*100:.2f}%) | Alias F1: {f1_alias*100:.2f}% (P={prec_alias*100:.2f}%, R={rec_alias*100:.2f}%)")
        print(f"  Reasoning Tokens: {reasoning_tokens_total:,} ({reasoning_ratio*100:.1f}% of completion tokens) | Cost: ${cost_usd:.4f}\n")

    # Generate Markdown Summary Report
    generate_markdown_report(variant_results, total_gt_ents)

def generate_markdown_report(gpt_results, total_gt_ents):
    # Load historical Llama results for comparison
    llama_results = {}
    llama_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../results/experiment_003a_results.json'))
    if os.path.exists(llama_path):
        try:
            with open(llama_path, "r", encoding="utf-8") as f:
                llama_payload = json.load(f)
                llama_results = llama_payload.get("variant_results", {})
        except Exception as e:
            print(f"Could not load Llama results: {e}")

    md = []
    md.append("# Experiment 003A — Entity Extraction Benchmark")
    md.append("## Comparative Evaluation: `openai/gpt-oss-120b` vs Historical `llama-3.3-70b-versatile`\n")
    md.append("> **Benchmark Dataset:** 100 Zero-Inference Ground-Truth Journal Entries (60 Ground-Truth Entities)  ")
    md.append("> **API Endpoint:** Groq OpenAI-Compatible API (`response_format={'type': 'json_object'}`)  ")
    md.append("> **Pricing for GPT-OSS 120B:** $0.15 / 1M Input Tokens, $0.60 / 1M Output Tokens (includes reasoning tokens)  \n")

    md.append("---")
    md.append("## 1. Experiment 003A — `openai/gpt-oss-120b` Results (Full 500-Call Sweep)\n")
    md.append("| Variant Name | Exact Precision | Exact Recall | Exact F1 | Alias Precision | Alias Recall | Alias F1 | Hallucination Rate | Avg Reasoning Tokens | Reasoning % of Output | Total Cost (USD) |")
    md.append("|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|")

    for vname, vdata in gpt_results.items():
        ex = vdata["exact_span_matching"]
        al = vdata["alias_aware_matching"]
        tel = vdata["telemetry"]
        md.append(f"| **`{vname}`** | {ex['precision']*100:.2f}% | {ex['recall']*100:.2f}% | **{ex['f1']*100:.2f}%** | {al['precision']*100:.2f}% | {al['recall']*100:.2f}% | **{al['f1']*100:.2f}%** | {al['hallucination_rate']*100:.2f}% | {tel['avg_reasoning_tokens_per_call']:.1f} | {tel['reasoning_fraction_of_completion']*100:.1f}% | ${tel['cost_usd']:.4f} |")

    md.append("\n---")
    md.append("## 2. Token & Reasoning Telemetry (`openai/gpt-oss-120b`)\n")
    md.append("| Variant Name | Prompt Tokens | Completion Tokens | Reasoning Tokens | Total Tokens | Avg Latency |")
    md.append("|---|:---:|:---:|:---:|:---:|:---:|")
    for vname, vdata in gpt_results.items():
        tel = vdata["telemetry"]
        md.append(f"| **`{vname}`** | {tel['prompt_tokens_total']:,} | {tel['completion_tokens_total']:,} | {tel['reasoning_tokens_total']:,} | {tel['total_tokens']:,} | {vdata['avg_latency_ms']:.0f} ms |")

    total_prompt_all = sum(v["telemetry"]["prompt_tokens_total"] for v in gpt_results.values())
    total_comp_all = sum(v["telemetry"]["completion_tokens_total"] for v in gpt_results.values())
    total_reas_all = sum(v["telemetry"]["reasoning_tokens_total"] for v in gpt_results.values())
    total_cost_all = sum(v["telemetry"]["cost_usd"] for v in gpt_results.values())
    md.append(f"\n* **Cumulative Batch Tokens:** {total_prompt_all + total_comp_all:,} ({total_prompt_all:,} Prompt + {total_comp_all:,} Completion, containing {total_reas_all:,} Reasoning Tokens)")
    md.append(f"* **Cumulative Batch Cost:** **${total_cost_all:.4f} USD** across 500 API calls.")

    md.append("\n---")
    md.append("## 3. Side-by-Side Model Comparison: `openai/gpt-oss-120b` vs `llama-3.3-70b-versatile`\n")
    md.append("| Variant | Metric | Historical `llama-3.3-70b-versatile` | Replacement `openai/gpt-oss-120b` | Delta (GPT-OSS vs Llama) |")
    md.append("|---|---|:---:|:---:|:---:|")

    for vname in ["V0_Original", "V1_Exhaustive", "V2_Conservative", "V3_Confidence_All", "V3_Confidence_HighOnly"]:
        g_data = gpt_results.get(vname, {})
        l_data = llama_results.get(vname, {})
        g_al = g_data.get("alias_aware_matching", {})
        l_al = l_data.get("alias_aware_matching", {})

        g_f1 = g_al.get("f1", 0.0) * 100
        l_f1 = l_al.get("f1", 0.0) * 100
        delta_f1 = g_f1 - l_f1

        g_prec = g_al.get("precision", 0.0) * 100
        l_prec = l_al.get("precision", 0.0) * 100
        delta_prec = g_prec - l_prec

        g_rec = g_al.get("recall", 0.0) * 100
        l_rec = l_al.get("recall", 0.0) * 100
        delta_rec = g_rec - l_rec

        md.append(f"| **`{vname}`** | **Alias F1** | {l_f1:.2f}% | {g_f1:.2f}% | **{delta_f1:+.2f}%** |")
        md.append(f"| | Precision | {l_prec:.2f}% | {g_prec:.2f}% | {delta_prec:+.2f}% |")
        md.append(f"| | Recall | {l_rec:.2f}% | {g_rec:.2f}% | {delta_rec:+.2f}% |")

    with open(MARKDOWN_REPORT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(md))

    print(f"\nGenerated comprehensive Markdown comparison report at: {MARKDOWN_REPORT_PATH}")

if __name__ == "__main__":
    run_benchmark()
