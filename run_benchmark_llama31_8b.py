"""
Experiment 003A Baseline -- llama-3.1-8b-instant Benchmark
Executes all 5 prompt variants across 100 zero-inference ground truth entries.
Uses Groq Native JSON mode (response_format={'type': 'json_object'}).
"""

import json
import os
import sys
import time
import requests

sys.stdout.reconfigure(encoding='utf-8')

env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '.env'))
with open(env_path, 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            os.environ[k.strip()] = v.strip()

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.1-8b-instant"

DATASET_PATH = os.path.join(os.path.dirname(__file__), 'experiments/journal-clustering/dataset/synthetic_journal_entities_ground_truth.json')

PROMPTS = {
    "V0_Original": """Extract all named entities from the following journal entry.
Return a JSON object with key "entities" containing a list of objects with "name" and "type".
Supported types: Person, Project, Place, Organization, Tool, Topic, Goal.
If no entities are found, return {"entities": []}.

Journal entry:
"{text}"
""",

    "V1_Exhaustive": """You are an entity extraction system. Enumerate EVERY named entity mentioned in the following journal entry.

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
""",

    "V2_Conservative": """Extract named entities from the following journal entry.

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
""",

    "V3_Confidence": """Extract named entities from the following journal entry. For each entity, assign a confidence level:

- HIGH: The entity's exact proper name appears explicitly in the text.
- MEDIUM: The entity is strongly implied by specific keywords (e.g., "budgeting module" implies a finance project).
- LOW: The entity is vaguely referenced or requires inference (e.g., "the project", "he").

Entity types: Person, Project, Place, Organization, Tool, Topic, Goal.

Return a JSON object with key "entities": [{"name": "...", "type": "...", "confidence": "HIGH|MEDIUM|LOW"}].
If no entities are found, return {"entities": []}.

Journal entry:
"{text}"
"""
}

def is_hallucinated(pred_name, text):
    p_lower = pred_name.lower().strip()
    t_lower = text.lower()
    if p_lower in t_lower:
        return False
    parts = [w for w in p_lower.split() if len(w) > 2]
    if any(part in t_lower for part in parts):
        return False
    return True

def evaluate_predictions(gt_entities, pred_entities, text):
    tp_ex, fp_ex, hal_ex = 0, 0, 0
    tp_al, fp_al, hal_al = 0, 0, 0
    matched_gt_ex = set()
    matched_gt_al = set()

    for p in pred_entities:
        p_name = p.get("name", "").strip().lower()
        p_type = p.get("type", "").strip().lower()

        # Exact Match
        m_ex = False
        for j, g in enumerate(gt_entities):
            if j in matched_gt_ex: continue
            if (p_name == g.get("text_span", "").strip().lower() or p_name == g.get("name", "").strip().lower()) and (p_type == g.get("type", "").strip().lower()):
                tp_ex += 1
                matched_gt_ex.add(j)
                m_ex = True
                break
        if not m_ex:
            if is_hallucinated(p.get("name", ""), text): hal_ex += 1
            fp_ex += 1

        # Alias-Aware Match
        m_al = False
        for j, g in enumerate(gt_entities):
            if j in matched_gt_al: continue
            g_name = g.get("name", "").strip().lower()
            g_span = g.get("text_span", "").strip().lower()
            g_type = g.get("type", "").strip().lower()
            g_aliases = [a.lower() for a in g.get("aliases", [])]

            if (p_name == g_name or p_name == g_span or p_name in g_aliases or any(a in p_name for a in g_aliases)) and (p_type == g_type):
                tp_al += 1
                matched_gt_al.add(j)
                m_al = True
                break
        if not m_al:
            if is_hallucinated(p.get("name", ""), text): hal_al += 1
            fp_al += 1

    fn_ex = len(gt_entities) - len(matched_gt_ex)
    fn_al = len(gt_entities) - len(matched_gt_al)
    return tp_ex, fp_ex, fn_ex, hal_ex, tp_al, fp_al, fn_al, hal_al

def run():
    with open(DATASET_PATH, 'r', encoding='utf-8') as f:
        dataset = json.load(f)

    print("=" * 110)
    print(f"EXPERIMENT 003A (LLAMA-3.1-8B-INSTANT) -- 100 ENTRY BENCHMARK")
    print("=" * 110)

    cached_responses = {}
    variant_results = {}

    variant_keys = ["V0_Original", "V1_Exhaustive", "V2_Conservative", "V3_Confidence_All", "V3_Confidence_HighOnly"]

    for vk in variant_keys:
        p_template = PROMPTS["V3_Confidence"] if "V3" in vk else PROMPTS[vk]
        is_high_only = (vk == "V3_Confidence_HighOnly")

        print(f"Running [{vk}] across 100 entries...", flush=True)

        tp_ex_tot, fp_ex_tot, fn_ex_tot, hal_ex_tot = 0, 0, 0, 0
        tp_al_tot, fp_al_tot, fn_al_tot, hal_al_tot = 0, 0, 0, 0
        api_fails, json_fails, schema_fails = 0, 0, 0

        for entry in dataset:
            eid = entry["id"]
            text = entry["text"]
            gt = entry["entities"]

            if is_high_only:
                raw, success = cached_responses.get(("V3_Confidence_All", eid), (None, False))
            else:
                resp = requests.post(
                    GROQ_ENDPOINT,
                    headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                    json={
                        "model": MODEL,
                        "messages": [{"role": "user", "content": p_template.replace("{text}", text)}],
                        "response_format": {"type": "json_object"},
                        "temperature": 0.0,
                        "max_tokens": 1024
                    },
                    timeout=15
                )
                success = (resp.status_code == 200)
                raw = resp.json()["choices"][0]["message"]["content"] if success else None
                cached_responses[(vk, eid)] = (raw, success)
                time.sleep(0.4) # Fast pacing for 8b-instant

            if not success or not raw:
                api_fails += 1
                fn_ex_tot += len(gt)
                fn_al_tot += len(gt)
                continue

            try:
                data = json.loads(raw)
            except Exception:
                json_fails += 1
                fn_ex_tot += len(gt)
                fn_al_tot += len(gt)
                continue

            extracted = data.get("entities") if isinstance(data, dict) else None
            if extracted is None:
                schema_fails += 1
                extracted = []

            if is_high_only:
                extracted = [e for e in extracted if isinstance(e, dict) and str(e.get("confidence", "")).upper() == "HIGH"]

            extracted = [e for e in extracted if isinstance(e, dict) and "name" in e and "type" in e]

            tp_ex, fp_ex, fn_ex, h_ex, tp_al, fp_al, fn_al, h_al = evaluate_predictions(gt, extracted, text)
            tp_ex_tot += tp_ex; fp_ex_tot += fp_ex; fn_ex_tot += fn_ex; hal_ex_tot += h_ex
            tp_al_tot += tp_al; fp_al_tot += fp_al; fn_al_tot += fn_al; hal_al_tot += h_al

        ex_p = tp_ex_tot / (tp_ex_tot + fp_ex_tot) if (tp_ex_tot + fp_ex_tot) > 0 else 0
        ex_r = tp_ex_tot / (tp_ex_tot + fn_ex_tot) if (tp_ex_tot + fn_ex_tot) > 0 else 0
        ex_f1 = (2 * ex_p * ex_r / (ex_p + ex_r)) if (ex_p + ex_r) > 0 else 0

        al_p = tp_al_tot / (tp_al_tot + fp_al_tot) if (tp_al_tot + fp_al_tot) > 0 else 0
        al_r = tp_al_tot / (tp_al_tot + fn_al_tot) if (tp_al_tot + fn_al_tot) > 0 else 0
        al_f1 = (2 * al_p * al_r / (al_p + al_r)) if (al_p + al_r) > 0 else 0
        hal_rate = hal_al_tot / (tp_al_tot + fp_al_tot) if (tp_al_tot + fp_al_tot) > 0 else 0

        variant_results[vk] = {
            "api_fail_rate": api_fails / len(dataset),
            "json_fail_rate": json_fails / len(dataset),
            "exact_p": ex_p, "exact_r": ex_r, "exact_f1": ex_f1,
            "alias_p": al_p, "alias_r": al_r, "alias_f1": al_f1,
            "hal_rate": hal_rate
        }

    print("\n" + "=" * 110)
    print(f"BENCHMARK RESULTS: {MODEL} (100 ENTRIES)")
    print("=" * 110)
    print(f"{'Variant':<22} | {'APIFail':<7} | {'JsonFail':<8} | {'EXACT P':<7} | {'EXACT R':<7} | {'EXACT F1':<8} | {'ALIAS P':<7} | {'ALIAS R':<7} | {'ALIAS F1':<8} | {'HalRate':<7}")
    print("-" * 110)
    for vk, res in variant_results.items():
        print(f"{vk:<22} | {res['api_fail_rate']*100:6.1f}% | {res['json_fail_rate']*100:7.1f}% | {res['exact_p']*100:6.2f}% | {res['exact_r']*100:6.2f}% | {res['exact_f1']*100:7.2f}% | {res['alias_p']*100:6.2f}% | {res['alias_r']*100:6.2f}% | {res['alias_f1']*100:7.2f}% | {res['hal_rate']*100:6.2f}%")

if __name__ == "__main__":
    run()
