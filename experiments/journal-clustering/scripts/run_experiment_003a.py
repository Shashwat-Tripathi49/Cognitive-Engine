"""
Experiment 003A (Revalidated Final) -- Real LLM Entity Extraction Benchmark
Model: llama-3.3-70b-versatile (Groq API Endpoint, Native JSON Mode)

Fulfills Workstream 3 & 5 Requirements:
1. GROQ_API_KEY loaded ONLY from .env / system env. ZERO hardcoded keys or fallbacks.
2. Native API JSON Mode (response_format={'type': 'json_object'}).
3. Independent failure metrics: API Failures, Malformed JSON Failures, Schema Parse Failures.
4. Dual-Scoring Protocol:
   a. EXACT TEXT SPAN MATCHING
   b. ALIAS-AWARE CANONICAL MATCHING
5. Paced rate limiting (2.2s delay) to guarantee 0% network 429 drops.
"""

import json
import os
import re
import sys
import time
import requests

# Force UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8')

def load_env_file():
    """Helper to load key-value pairs from repo-root .env file into os.environ."""
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
    env_path = os.path.join(repo_root, '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    os.environ[k.strip()] = v.strip()

load_env_file()
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("ERROR: GROQ_API_KEY not found in .env file or environment.")
    sys.exit(1)

GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"

PRICE_PER_M_INPUT = 0.59
PRICE_PER_M_OUTPUT = 0.79

DATASET_PATH = os.path.join(os.path.dirname(__file__), '../dataset/synthetic_journal_entities_ground_truth.json')
RESULTS_PATH = os.path.join(os.path.dirname(__file__), '../results/experiment_003a_results.json')

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

def call_groq_json_mode(prompt_text, retries=5):
    """
    Makes Groq API call with NATIVE JSON MODE.
    Enforces strict backoff pacing.
    """
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt_text}],
        "response_format": {"type": "json_object"},
        "temperature": 0.0,
        "max_tokens": 1024,
    }

    for attempt in range(retries):
        start = time.time()
        try:
            resp = requests.post(GROQ_ENDPOINT, headers=headers, json=payload, timeout=30)
            latency_ms = (time.time() - start) * 1000

            if resp.status_code in (401, 403):
                raise RuntimeError(f"FATAL AUTH ERROR HTTP {resp.status_code}: {resp.text[:200]}")

            if resp.status_code == 429:
                # HTTP 429 Rate Limit -- wait 10s backoff and retry
                time.sleep(10.0 * (attempt + 1))
                continue

            if resp.status_code != 200:
                return None, latency_ms, {}, False, f"HTTP {resp.status_code}: {resp.text[:150]}"

            data = resp.json()
            raw_text = data["choices"][0]["message"]["content"]
            usage = data.get("usage", {})
            return raw_text, latency_ms, usage, True, None
        except Exception as e:
            time.sleep(3.0)
            if attempt == retries - 1:
                return None, 0, {}, False, str(e)

    return None, 0, {}, False, "Retries exhausted"


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


def run_experiment_003a_final(max_entries=100):
    with open(DATASET_PATH, 'r', encoding='utf-8') as f:
        dataset = json.load(f)[:max_entries]

    print("=" * 95)
    print("EXPERIMENT 003A (REVALIDATED FINAL) -- CANONICAL REAL LLM BENCHMARK")
    print(f"Model: {MODEL} (Groq API, Native JSON Mode)")
    print(f"Dataset: {len(dataset)} Zero-Inference Ground-Truth Entries")
    total_gt_ents = sum(len(e["entities"]) for e in dataset)
    print(f"Total Ground-Truth Entities: {total_gt_ents}")
    print("=" * 95 + "\n")

    cached_responses = {}
    variant_results = {}

    variant_keys = ["V0_Original", "V1_Exhaustive", "V2_Conservative", "V3_Confidence_All", "V3_Confidence_HighOnly"]

    for variant_name in variant_keys:
        prompt_template = PROMPTS[variant_name]
        is_high_only = (variant_name == "V3_Confidence_HighOnly")

        print(f"Evaluating Variant: [{variant_name}] ({len(dataset)} entries)...", flush=True)

        tp_exact_tot, fp_exact_tot, fn_exact_tot, hal_exact_tot = 0, 0, 0, 0
        tp_alias_tot, fp_alias_tot, fn_alias_tot, hal_alias_tot = 0, 0, 0, 0
        
        api_failures = 0
        malformed_json_failures = 0
        schema_parse_failures = 0

        total_latency = 0.0
        prompt_tokens_total = 0
        completion_tokens_total = 0

        for idx, entry in enumerate(dataset):
            entry_id = entry["id"]
            text = entry["text"]
            gt_entities = entry["entities"]

            prompt_text = prompt_template.replace("{text}", text)
            raw_text, latency, usage, success, err = call_groq_json_mode(prompt_text)
            time.sleep(2.2)  # Strict 2.2s pacing (27.2 RPM) to guarantee 0% HTTP 429 rate limit drops

            total_latency += latency
            prompt_tokens_total += usage.get("prompt_tokens", 0)
            completion_tokens_total += usage.get("completion_tokens", 0)

            # Metric 1: API Failures
            if not success or not raw_text:
                api_failures += 1
                fn_exact_tot += len(gt_entities)
                fn_alias_tot += len(gt_entities)
                continue

            # Metric 2: Malformed JSON Failures
            try:
                parsed_data = json.loads(raw_text.strip())
            except Exception:
                malformed_json_failures += 1
                fn_exact_tot += len(gt_entities)
                fn_alias_tot += len(gt_entities)
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

            extracted = [e for e in extracted if isinstance(e, dict) and "name" in e and "type" in e]

            # Dual Evaluation
            tp_ex, fp_ex, fn_ex, hal_ex = evaluate_predictions_exact_span(gt_entities, extracted, text)
            tp_al, fp_al, fn_al, hal_al = evaluate_predictions_alias_aware(gt_entities, extracted, text)

            tp_exact_tot += tp_ex
            fp_exact_tot += fp_ex
            fn_exact_tot += fn_ex
            hal_exact_tot += hal_ex

            tp_alias_tot += tp_al
            fp_alias_tot += fp_al
            fn_alias_tot += fn_al
            hal_alias_tot += hal_al

            if (idx + 1) % 20 == 0 or (idx + 1) == len(dataset):
                print(f"  [{variant_name}] Processed {idx + 1}/{len(dataset)} entries (API Failures: {api_failures}, Malformed JSON: {malformed_json_failures}, Schema Failures: {schema_parse_failures})")

        # Exact Match Metrics
        tot_pred_exact = tp_exact_tot + fp_exact_tot
        prec_exact = tp_exact_tot / tot_pred_exact if tot_pred_exact > 0 else 0.0
        rec_exact = tp_exact_tot / (tp_exact_tot + fn_exact_tot) if (tp_exact_tot + fn_exact_tot) > 0 else 0.0
        f1_exact = (2 * prec_exact * rec_exact / (prec_exact + rec_exact)) if (prec_exact + rec_exact) > 0 else 0.0
        hal_rate_exact = hal_exact_tot / tot_pred_exact if tot_pred_exact > 0 else 0.0

        # Alias-Aware Metrics
        tot_pred_alias = tp_alias_tot + fp_alias_tot
        prec_alias = tp_alias_tot / tot_pred_alias if tot_pred_alias > 0 else 0.0
        rec_alias = tp_alias_tot / (tp_alias_tot + fn_alias_tot) if (tp_alias_tot + fn_alias_tot) > 0 else 0.0
        f1_alias = (2 * prec_alias * rec_alias / (prec_alias + rec_alias)) if (prec_alias + rec_alias) > 0 else 0.0
        hal_rate_alias = hal_alias_tot / tot_pred_alias if tot_pred_alias > 0 else 0.0

        api_fail_rate = api_failures / len(dataset)
        malformed_json_rate = malformed_json_failures / len(dataset)
        schema_fail_rate = schema_parse_failures / len(dataset)
        avg_lat = total_latency / len(dataset)
        tot_tokens = prompt_tokens_total + completion_tokens_total
        cost_usd = (prompt_tokens_total / 1_000_000 * PRICE_PER_M_INPUT) + (completion_tokens_total / 1_000_000 * PRICE_PER_M_OUTPUT)

        variant_results[variant_name] = {
            "name": variant_name,
            "api_failure_rate": api_fail_rate,
            "api_failures_count": api_failures,
            "malformed_json_rate": malformed_json_rate,
            "malformed_json_count": malformed_json_failures,
            "schema_failure_rate": schema_fail_rate,
            "schema_failures_count": schema_parse_failures,
            "avg_latency_ms": avg_lat,
            "total_tokens": tot_tokens,
            "total_cost_usd": cost_usd,
            "exact_span_matching": {
                "precision": prec_exact,
                "recall": rec_exact,
                "f1": f1_exact,
                "hallucination_rate": hal_rate_exact,
                "tp": tp_exact_tot,
                "fp": fp_exact_tot,
                "fn": fn_exact_tot,
            },
            "alias_aware_matching": {
                "precision": prec_alias,
                "recall": rec_alias,
                "f1": f1_alias,
                "hallucination_rate": hal_rate_alias,
                "tp": tp_alias_tot,
                "fp": fp_alias_tot,
                "fn": fn_alias_tot,
            }
        }

    # Print Revalidated Comparison Table
    print("\n" + "=" * 125)
    print("EXPERIMENT 003A REVALIDATED RESULTS -- CANONICAL REAL LLM BENCHMARK")
    print("=" * 125)
    print(f"{'Variant':<22} | {'APIFail':<7} | {'JsonFail':<8} | {'EXACT P':<7} | {'EXACT R':<7} | {'EXACT F1':<8} | {'ALIAS P':<7} | {'ALIAS R':<7} | {'ALIAS F1':<8} | {'HalRate':<7}")
    print("-" * 125)

    for vk, res in variant_results.items():
        ex = res["exact_span_matching"]
        al = res["alias_aware_matching"]
        print(f"{vk:<22} | {res['api_failure_rate']*100:6.1f}% | {res['malformed_json_rate']*100:7.1f}% | {ex['precision']*100:6.2f}% | {ex['recall']*100:6.2f}% | {ex['f1']*100:7.2f}% | {al['precision']*100:6.2f}% | {al['recall']*100:6.2f}% | {al['f1']*100:7.2f}% | {al['hallucination_rate']*100:6.2f}%")

    out_payload = {
        "experiment": "Experiment 003A (Revalidated Final): Real LLM Entity Extraction Benchmark",
        "model": MODEL,
        "api_feature_used": "response_format={'type': 'json_object'}",
        "dataset_size": len(dataset),
        "total_ground_truth_entities": total_gt_ents,
        "variant_results": variant_results
    }

    with open(RESULTS_PATH, 'w', encoding='utf-8') as f:
        json.dump(out_payload, f, indent=2)

    print(f"\nRevalidated results successfully saved to {RESULTS_PATH}")

if __name__ == "__main__":
    import sys
    max_e = 100
    if len(sys.argv) > 1:
        max_e = int(sys.argv[1])
    run_experiment_003a_final(max_entries=max_e)
