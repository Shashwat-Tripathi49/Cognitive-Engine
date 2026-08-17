"""
Experiment 003A -- Run ONLY V3_Confidence_HighOnly Variant
Model: llama-3.3-70b-versatile (Groq API Endpoint, Native JSON Mode)
Dataset: 100 entries, 68 Ground-Truth Entities
"""

import json
import os
import sys
import time
import requests

sys.stdout.reconfigure(encoding='utf-8')

# 1. Environment Loading
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
env_path = os.path.join(repo_root, '.env')
if os.path.exists(env_path):
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ[k.strip()] = v.strip()

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("ERROR: GROQ_API_KEY not found in .env")
    sys.exit(1)

GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"

PRICE_PER_M_INPUT = 0.59
PRICE_PER_M_OUTPUT = 0.79

DATASET_PATH = os.path.join(os.path.dirname(__file__), '../dataset/synthetic_journal_entities_ground_truth.json')
RESULTS_PATH = os.path.join(os.path.dirname(__file__), '../results/experiment_003a_results.json')
PROGRESS_PATH = os.path.join(os.path.dirname(__file__), '../results/v3_high_only_progress.json')

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

def call_groq_json_mode(prompt_text, retries=6):
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
                raise RuntimeError(f"AUTH ERROR HTTP {resp.status_code}: {resp.text[:200]}")

            if resp.status_code == 429:
                wait_time = 12.0 * (attempt + 1)
                print(f"    [Rate limit 429] Waiting {wait_time}s before retry {attempt+1}/{retries}...")
                time.sleep(wait_time)
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

def run_v3_high_only():
    with open(DATASET_PATH, 'r', encoding='utf-8') as f:
        dataset = json.load(f)[:100]

    total_gt_ents = sum(len(e["entities"]) for e in dataset)

    print("=" * 90)
    print(f"STARTING EVALUATION: V3_Confidence_HighOnly ({len(dataset)} entries, {total_gt_ents} GT entities)")
    print(f"Model: {MODEL} | JSON Mode: True | Delay: 2.2s")
    print("=" * 90)

    # Resume from progress if available
    progress_entries = []
    if os.path.exists(PROGRESS_PATH):
        try:
            with open(PROGRESS_PATH, 'r', encoding='utf-8') as f:
                progress_entries = json.load(f)
            print(f"Loaded existing progress: {len(progress_entries)}/100 entries.")
        except Exception:
            progress_entries = []

    start_idx = len(progress_entries)

    tp_exact_tot = sum(p["tp_exact"] for p in progress_entries)
    fp_exact_tot = sum(p["fp_exact"] for p in progress_entries)
    fn_exact_tot = sum(p["fn_exact"] for p in progress_entries)
    hal_exact_tot = sum(p["hal_exact"] for p in progress_entries)

    tp_alias_tot = sum(p["tp_alias"] for p in progress_entries)
    fp_alias_tot = sum(p["fp_alias"] for p in progress_entries)
    fn_alias_tot = sum(p["fn_alias"] for p in progress_entries)
    hal_alias_tot = sum(p["hal_alias"] for p in progress_entries)

    api_failures = sum(1 for p in progress_entries if not p["api_success"])
    malformed_json_failures = sum(1 for p in progress_entries if not p["json_success"])
    schema_parse_failures = sum(1 for p in progress_entries if not p["schema_success"])

    total_latency = sum(p["latency"] for p in progress_entries)
    prompt_tokens_total = sum(p.get("prompt_tokens", 0) for p in progress_entries)
    completion_tokens_total = sum(p.get("completion_tokens", 0) for p in progress_entries)

    for idx in range(start_idx, len(dataset)):
        entry = dataset[idx]
        text = entry["text"]
        gt_entities = entry["entities"]

        prompt_text = PROMPT_V3_CONFIDENCE.replace("{text}", text)
        raw_text, latency, usage, success, err = call_groq_json_mode(prompt_text)
        time.sleep(2.2)  # Strict 2.2s delay to respect 30 RPM limit

        total_latency += latency
        p_tok = usage.get("prompt_tokens", 0)
        c_tok = usage.get("completion_tokens", 0)
        prompt_tokens_total += p_tok
        completion_tokens_total += c_tok

        json_success = False
        schema_success = False
        extracted_high = []

        if not success or not raw_text:
            api_failures += 1
            tp_ex, fp_ex, fn_ex, hal_ex = 0, 0, len(gt_entities), 0
            tp_al, fp_al, fn_al, hal_al = 0, 0, len(gt_entities), 0
        else:
            try:
                parsed_data = json.loads(raw_text.strip())
                json_success = True

                extracted = None
                if isinstance(parsed_data, dict):
                    for k in ["entities", "named_entities", "data", "results"]:
                        if k in parsed_data and isinstance(parsed_data[k], list):
                            extracted = parsed_data[k]
                            break

                if extracted is None:
                    schema_parse_failures += 1
                    extracted = []
                else:
                    schema_success = True

                # Filter HIGH only
                extracted_high = [
                    e for e in extracted
                    if isinstance(e, dict) and str(e.get("confidence", "")).upper() == "HIGH"
                    and "name" in e and "type" in e
                ]

                tp_ex, fp_ex, fn_ex, hal_ex = evaluate_predictions_exact_span(gt_entities, extracted_high, text)
                tp_al, fp_al, fn_al, hal_al = evaluate_predictions_alias_aware(gt_entities, extracted_high, text)

            except Exception:
                malformed_json_failures += 1
                tp_ex, fp_ex, fn_ex, hal_ex = 0, 0, len(gt_entities), 0
                tp_al, fp_al, fn_al, hal_al = 0, 0, len(gt_entities), 0

        tp_exact_tot += tp_ex
        fp_exact_tot += fp_ex
        fn_exact_tot += fn_ex
        hal_exact_tot += hal_ex

        tp_alias_tot += tp_al
        fp_alias_tot += fp_al
        fn_alias_tot += fn_al
        hal_alias_tot += hal_al

        # Record progress item
        progress_entries.append({
            "idx": idx,
            "id": entry["id"],
            "api_success": success,
            "json_success": json_success,
            "schema_success": schema_success,
            "latency": latency,
            "prompt_tokens": p_tok,
            "completion_tokens": c_tok,
            "extracted_high_count": len(extracted_high),
            "tp_exact": tp_ex,
            "fp_exact": fp_ex,
            "fn_exact": fn_ex,
            "hal_exact": hal_ex,
            "tp_alias": tp_al,
            "fp_alias": fp_al,
            "fn_alias": fn_al,
            "hal_alias": hal_al,
        })

        # Save incremental progress
        with open(PROGRESS_PATH, 'w', encoding='utf-8') as f:
            json.dump(progress_entries, f, indent=2)

        if (idx + 1) % 10 == 0 or (idx + 1) == len(dataset):
            print(f"  [V3_Confidence_HighOnly] {idx + 1}/100 processed | Exact TP: {tp_exact_tot}, FP: {fp_exact_tot}, FN: {fn_exact_tot} | Alias TP: {tp_alias_tot}, FP: {fp_alias_tot}, FN: {fn_alias_tot}")

    # Final Metric Calculations
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

    avg_lat = total_latency / len(dataset)
    tot_tokens = prompt_tokens_total + completion_tokens_total
    cost_usd = (prompt_tokens_total / 1_000_000 * PRICE_PER_M_INPUT) + (completion_tokens_total / 1_000_000 * PRICE_PER_M_OUTPUT)

    v3_high_metrics = {
        "name": "V3_Confidence_HighOnly",
        "api_failure_rate": api_failures / len(dataset),
        "api_failures_count": api_failures,
        "malformed_json_rate": malformed_json_failures / len(dataset),
        "malformed_json_count": malformed_json_failures,
        "schema_failure_rate": schema_parse_failures / len(dataset),
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

    # Update experiment_003a_results.json
    existing_results = {}
    if os.path.exists(RESULTS_PATH):
        with open(RESULTS_PATH, 'r', encoding='utf-8') as f:
            existing_results = json.load(f)

    if "variant_results" not in existing_results:
        existing_results["variant_results"] = {}

    existing_results["variant_results"]["V3_Confidence_HighOnly"] = v3_high_metrics

    with open(RESULTS_PATH, 'w', encoding='utf-8') as f:
        json.dump(existing_results, f, indent=2)

    print("\n" + "=" * 90)
    print("V3_CONFIDENCE_HIGHONLY COMPLETED SUCCESSFULLY (100/100 Real API Calls)")
    print("=" * 90)
    print(f"API Failures: {api_failures}/100")
    print(f"Malformed JSON: {malformed_json_failures}/100")
    print(f"Schema Parse Failures: {schema_parse_failures}/100")
    print(f"Total Tokens: {tot_tokens}")
    print(f"Total Cost: ${cost_usd:.6f}")
    print(f"Average Latency: {avg_lat:.2f} ms")
    print(f"EXACT MATCH -> Precision: {prec_exact*100:.2f}%, Recall: {rec_exact*100:.2f}%, F1: {f1_exact*100:.2f}%, Hallucinations: {hal_rate_exact*100:.2f}% (TP={tp_exact_tot}, FP={fp_exact_tot}, FN={fn_exact_tot})")
    print(f"ALIAS AWARE -> Precision: {prec_alias*100:.2f}%, Recall: {rec_alias*100:.2f}%, F1: {f1_alias*100:.2f}%, Hallucinations: {hal_rate_alias*100:.2f}% (TP={tp_alias_tot}, FP={fp_alias_tot}, FN={fn_alias_tot})")
    print(f"Updated results saved in: {RESULTS_PATH}\n")

if __name__ == "__main__":
    run_v3_high_only()
