"""
Experiment 004A -- Entity Resolution Offline Benchmark Runner
Evaluates 7 offline entity resolution methods against the gold-standard benchmark.
Strictly OFFLINE: 0 external API calls, 0 network dependencies, 0 database writes.
"""

import json
import os
import re
import sys
import time
import unicodedata
import difflib

# Strict offline flags for HuggingFace / PyTorch
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

import numpy as np

# Force UTF-8 stdout
sys.stdout.reconfigure(encoding='utf-8')

BENCHMARK_PATH = os.path.join(os.path.dirname(__file__), '../dataset/entity_resolution_gold.json')
RESULTS_PATH = os.path.join(os.path.dirname(__file__), '../results/experiment_004a_results.json')

# -----------------------------------------------------------------------------
# 1. Dataset Integrity Audit
# -----------------------------------------------------------------------------
def audit_dataset(benchmark_data):
    issues = []
    cases = benchmark_data.get("cases", [])
    canonical_entities = {e["id"]: e for e in benchmark_data.get("canonical_entities", [])}
    allowed_types = set(benchmark_data.get("benchmark_metadata", {}).get("ontology_types", []))
    
    seen_case_ids = set()
    for case in cases:
        cid = case.get("caseId")
        if not cid:
            issues.append("Missing caseId in record")
        elif cid in seen_case_ids:
            issues.append(f"Duplicate caseId found: {cid}")
        seen_case_ids.add(cid)
        
        etype = case.get("entityType")
        if etype not in allowed_types:
            issues.append(f"Case {cid} has invalid entityType: {etype}")
            
        outcome = case.get("expectedOutcome")
        if outcome not in ("RESOLVED", "AMBIGUOUS", "NO_MATCH"):
            issues.append(f"Case {cid} has invalid expectedOutcome: {outcome}")
            
        target_id = case.get("canonicalEntityId")
        if outcome == "RESOLVED":
            if not target_id or target_id not in canonical_entities:
                issues.append(f"Case {cid} marked RESOLVED but has missing/invalid canonicalEntityId: {target_id}")
            elif canonical_entities[target_id]["type"] != etype:
                issues.append(f"Case {cid} type ({etype}) mismatches canonical entity type ({canonical_entities[target_id]['type']})")
        else:
            if target_id is not None:
                issues.append(f"Case {cid} marked {outcome} but has non-null canonicalEntityId: {target_id}")
                
    return issues


# -----------------------------------------------------------------------------
# 2. String & Normalization Utilities
# -----------------------------------------------------------------------------
def normalize_text(text):
    if not text:
        return ""
    # Unicode decomposition
    t = unicodedata.normalize('NFKD', text)
    t = t.lower().strip()
    # Strip common punctuation (dots, hyphens, quotes)
    t = re.sub(r'[\.\-\_\,\/\(\)\"\']+', ' ', t)
    # Collapse whitespace
    t = re.sub(r'\s+', ' ', t).strip()
    # Handle basic plural 's' at end of multi-char words if not ending in 'ss'
    if len(t) > 3 and t.endswith('s') and not t.endswith('ss'):
        t = t[:-1]
    return t

def string_similarity(s1, s2):
    n1 = normalize_text(s1)
    n2 = normalize_text(s2)
    if not n1 or not n2:
        return 0.0
    if n1 == n2:
        return 1.0
    return difflib.SequenceMatcher(None, n1, n2).ratio()


# -----------------------------------------------------------------------------
# 3. Embedding Model Loader (Local Sentence-Transformers)
# -----------------------------------------------------------------------------
class LocalEmbeddingEngine:
    def __init__(self):
        self.model = None
        self._init_model()
        
    def _init_model(self):
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer("all-MiniLM-L6-v2")
            print("Loaded local SentenceTransformer (all-MiniLM-L6-v2).", flush=True)
        except Exception as e:
            print(f"Notice: local SentenceTransformer unavailable ({e}). Fallback to character n-gram vectors.", flush=True)
            self.model = None

    def encode(self, texts):
        if self.model is not None:
            return self.model.encode(texts, normalize_embeddings=True)
        # Deterministic character n-gram cosine fallback if PyTorch not available
        def char_ngrams(t, n=3):
            t = normalize_text(t)
            return set(t[i:i+n] for i in range(len(t)-n+1)) or {t}
        
        vecs = []
        for t in texts:
            vecs.append(char_ngrams(t))
        return vecs

    def cosine_sim(self, v1, v2):
        if self.model is not None:
            return float(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-9))
        # Jaccard overlap on fallback n-grams
        inter = len(v1.intersection(v2))
        union = len(v1.union(v2))
        return float(inter / union) if union > 0 else 0.0


# -----------------------------------------------------------------------------
# 4. Offline Baseline Method Implementations
# -----------------------------------------------------------------------------

# Method 1: Exact Canonical String Match
def resolve_method_1_exact(mention, entity_type, canonical_entities):
    for c_id, ent in canonical_entities.items():
        if ent["type"] == entity_type and mention.strip() == ent["canonical_name"].strip():
            return "RESOLVED", c_id, 1.0
    return "NO_MATCH", None, 0.0

# Method 2: Normalized String Match
def resolve_method_2_normalized(mention, entity_type, canonical_entities):
    norm_m = normalize_text(mention)
    for c_id, ent in canonical_entities.items():
        if ent["type"] == entity_type and norm_m == normalize_text(ent["canonical_name"]):
            return "RESOLVED", c_id, 1.0
    return "NO_MATCH", None, 0.0

# Method 3: Manually Verified Alias Dictionary
def resolve_method_3_alias(mention, entity_type, canonical_entities):
    norm_m = normalize_text(mention)
    for c_id, ent in canonical_entities.items():
        if ent["type"] != entity_type:
            continue
        if norm_m == normalize_text(ent["canonical_name"]):
            return "RESOLVED", c_id, 1.0
        for alias in ent.get("aliases", []):
            if norm_m == normalize_text(alias):
                return "RESOLVED", c_id, 1.0
    return "NO_MATCH", None, 0.0

# Method 4: String Similarity Matcher
def resolve_method_4_string_sim(mention, entity_type, canonical_entities, threshold=0.82):
    best_id = None
    best_sim = 0.0
    norm_m = normalize_text(mention)
    
    for c_id, ent in canonical_entities.items():
        if ent["type"] != entity_type:
            continue
        sim = string_similarity(mention, ent["canonical_name"])
        if sim > best_sim:
            best_sim = sim
            best_id = c_id
        for alias in ent.get("aliases", []):
            a_sim = string_similarity(mention, alias)
            if a_sim > best_sim:
                best_sim = a_sim
                best_id = c_id
                
    if best_sim >= threshold:
        return "RESOLVED", best_id, best_sim
    return "NO_MATCH", None, best_sim

# Method 5: Local Embedding Similarity Matcher
def resolve_method_5_embedding_sim(mention, entity_type, canonical_entities, embed_engine, canonical_embeddings, threshold=0.80):
    m_vec = embed_engine.encode([mention])[0]
    best_id = None
    best_sim = 0.0
    
    for c_id, ent in canonical_entities.items():
        if ent["type"] != entity_type:
            continue
        c_vec = canonical_embeddings[c_id]["canonical"]
        sim = embed_engine.cosine_sim(m_vec, c_vec)
        if sim > best_sim:
            best_sim = sim
            best_id = c_id
        for a_idx, a_vec in enumerate(canonical_embeddings[c_id]["aliases"]):
            a_sim = embed_engine.cosine_sim(m_vec, a_vec)
            if a_sim > best_sim:
                best_sim = a_sim
                best_id = c_id
                
    if best_sim >= threshold:
        return "RESOLVED", best_id, best_sim
    return "NO_MATCH", None, best_sim

# Method 6: Contextual / Anaphora Disambiguation Heuristic
GENERIC_ANAPHORA_PATTERNS = [
    r'^(the|a|an)\s+(project|tool|app|system|database|client|manager|module)$',
    r'^(my|our)\s+(manager|boss|client|professor|roommate|friend|mom|dad)$',
    r'^(he|she|they|it|this|that|these|those)$',
    r'^dashboard$'
]
def resolve_method_6_contextual(mention, entity_type, canonical_entities):
    norm_m = normalize_text(mention)
    for pat in GENERIC_ANAPHORA_PATTERNS:
        if re.match(pat, norm_m):
            return "AMBIGUOUS", None, 1.0
    # Fallback to normalized alias lookup
    return resolve_method_3_alias(mention, entity_type, canonical_entities)

# Method 7: Layered Hybrid Resolver Pipeline
def resolve_method_7_layered(mention, entity_type, canonical_entities, embed_engine, canonical_embeddings,
                             str_threshold=0.88, embed_threshold=0.84, margin=0.08):
    norm_m = normalize_text(mention)
    
    # Layer 1: Ambiguity & Generic Anaphora Gatekeeper
    for pat in GENERIC_ANAPHORA_PATTERNS:
        if re.match(pat, norm_m):
            return "AMBIGUOUS", None, 1.0
            
    # Check for polysemous / shared aliases across entities
    matching_entities = []
    for c_id, ent in canonical_entities.items():
        if ent["type"] == entity_type:
            if norm_m == normalize_text(ent["canonical_name"]) or any(norm_m == normalize_text(a) for a in ent.get("aliases", [])):
                matching_entities.append(c_id)
    if len(matching_entities) > 1:
        return "AMBIGUOUS", None, 0.95
        
    # Layer 2: Exact & Normalized Match
    res_norm, cid_norm, _ = resolve_method_2_normalized(mention, entity_type, canonical_entities)
    if res_norm == "RESOLVED":
        return "RESOLVED", cid_norm, 1.0
        
    # Layer 3: Verified Alias Dictionary Lookup
    res_alias, cid_alias, _ = resolve_method_3_alias(mention, entity_type, canonical_entities)
    if res_alias == "RESOLVED":
        return "RESOLVED", cid_alias, 1.0

    # Layer 4: Hard Negative Substring Trap Gatekeeper
    # Reject cases where the mention is a modifier extension of a tool/project (e.g. "React Native" vs "React", "FastAPI CLI" vs "FastAPI")
    # unless registered as an exact alias.
    for c_id, ent in canonical_entities.items():
        c_norm = normalize_text(ent["canonical_name"])
        if c_norm in norm_m and len(norm_m) > len(c_norm) + 3:
            # Suffix/prefix modifier added without registered alias -> Hard Negative Trap -> Safe NO_MATCH
            return "NO_MATCH", None, 0.30

    # Layer 5: High-Precision String Similarity Candidate Generation
    res_str, cid_str, sim_str = resolve_method_4_string_sim(mention, entity_type, canonical_entities, threshold=str_threshold)
    if res_str == "RESOLVED":
        return "RESOLVED", cid_str, sim_str

    # Layer 6: Local Embedding Similarity with Margin Confidence Check
    m_vec = embed_engine.encode([mention])[0]
    ranked = []
    for c_id, ent in canonical_entities.items():
        if ent["type"] != entity_type:
            continue
        c_sim = embed_engine.cosine_sim(m_vec, canonical_embeddings[c_id]["canonical"])
        ranked.append((c_id, c_sim))
        for a_vec in canonical_embeddings[c_id]["aliases"]:
            a_sim = embed_engine.cosine_sim(m_vec, a_vec)
            ranked.append((c_id, a_sim))
            
    ranked.sort(key=lambda x: x[1], reverse=True)
    if ranked:
        top_id, top_sim = ranked[0]
        second_sim = ranked[1][1] if len(ranked) > 1 else 0.0
        
        if top_sim >= embed_threshold and (top_sim - second_sim >= margin):
            return "RESOLVED", top_id, top_sim
        elif top_sim >= 0.70:
            # In the ambiguous/uncertain band -> Route to AMBIGUOUS rather than risking False Merge
            return "AMBIGUOUS", None, top_sim
            
    return "NO_MATCH", None, 0.0


# -----------------------------------------------------------------------------
# 5. Evaluation Harness & Formal Metric Calculation
# -----------------------------------------------------------------------------
def evaluate_method(method_fn, cases, canonical_entities):
    tp_res = 0
    fp_res = 0
    false_merges = 0
    false_splits = 0
    correct_ambiguous = 0
    correct_nomatch = 0
    
    total_resolvable = sum(1 for c in cases if c["expectedOutcome"] == "RESOLVED")
    total_ambiguous = sum(1 for c in cases if c["expectedOutcome"] == "AMBIGUOUS")
    total_nomatch = sum(1 for c in cases if c["expectedOutcome"] == "NO_MATCH")
    
    start_time = time.time()
    
    for case in cases:
        mention = case["surfaceMention"]
        etype = case["entityType"]
        expected_outcome = case["expectedOutcome"]
        expected_cid = case["canonicalEntityId"]
        
        pred_outcome, pred_cid, conf = method_fn(mention, etype, canonical_entities)
        
        if pred_outcome == "RESOLVED":
            if expected_outcome == "RESOLVED":
                if pred_cid == expected_cid:
                    tp_res += 1
                else:
                    # Linked to the WRONG canonical entity
                    false_merges += 1
                    fp_res += 1
            else:
                # Expected AMBIGUOUS or NO_MATCH, but forced into a canonical entity
                false_merges += 1
                fp_res += 1
        elif pred_outcome == "AMBIGUOUS":
            if expected_outcome == "AMBIGUOUS":
                correct_ambiguous += 1
            elif expected_outcome == "RESOLVED":
                false_splits += 1
        elif pred_outcome == "NO_MATCH":
            if expected_outcome == "NO_MATCH":
                correct_nomatch += 1
            elif expected_outcome == "RESOLVED":
                false_splits += 1
                
    elapsed_ms = (time.time() - start_time) * 1000.0
    avg_latency_us = (elapsed_ms / len(cases)) * 1000.0 if cases else 0.0
    
    total_attempted_resolves = tp_res + fp_res
    p_res = (tp_res / total_attempted_resolves) if total_attempted_resolves > 0 else 0.0
    r_res = (tp_res / total_resolvable) if total_resolvable > 0 else 0.0
    f1_res = (2 * p_res * r_res / (p_res + r_res)) if (p_res + r_res) > 0 else 0.0
    
    fm_rate = (false_merges / total_attempted_resolves) if total_attempted_resolves > 0 else 0.0
    fs_rate = (false_splits / total_resolvable) if total_resolvable > 0 else 0.0
    amb_acc = (correct_ambiguous / total_ambiguous) if total_ambiguous > 0 else 0.0
    nomatch_acc = (correct_nomatch / total_nomatch) if total_nomatch > 0 else 0.0
    
    return {
        "precision": p_res,
        "recall": r_res,
        "f1": f1_res,
        "false_merge_rate": fm_rate,
        "false_merges_count": false_merges,
        "false_split_rate": fs_rate,
        "false_splits_count": false_splits,
        "ambiguity_accuracy": amb_acc,
        "nomatch_accuracy": nomatch_acc,
        "tp_resolved": tp_res,
        "fp_resolved": fp_res,
        "total_cases_evaluated": len(cases),
        "avg_latency_us": avg_latency_us
    }


# -----------------------------------------------------------------------------
# 6. Main Execution
# -----------------------------------------------------------------------------
def run_benchmark():
    print("=" * 115)
    print("EXPERIMENT 004A -- OFFLINE ENTITY RESOLUTION BENCHMARK")
    print("Zero external API calls. Purely offline deterministic & local embedding evaluation.")
    print("=" * 115)
    
    with open(BENCHMARK_PATH, 'r', encoding='utf-8') as f:
        benchmark_data = json.load(f)
        
    print("\n--> Step 1: Performing Dataset Integrity Audit...")
    audit_issues = audit_dataset(benchmark_data)
    if audit_issues:
        print(f"X DATASET AUDIT FAILED with {len(audit_issues)} issue(s):")
        for iss in audit_issues:
            print(f"  - {iss}")
        sys.exit(1)
    else:
        print("✓ Dataset Integrity Audit Passed cleanly. 0 duplicate IDs, 0 type mismatches, 0 contradictory labels.")
        
    canonical_entities = {e["id"]: e for e in benchmark_data["canonical_entities"]}
    all_cases = benchmark_data["cases"]
    calib_cases = [c for c in all_cases if c["split"] == "calibration"]
    eval_cases = [c for c in all_cases if c["split"] == "evaluation"]
    
    print(f"Total benchmark cases: {len(all_cases)} (Calibration: {len(calib_cases)}, Evaluation: {len(eval_cases)})")
    print(f"Canonical entities: {len(canonical_entities)}")
    
    # Initialize Local Embedding Engine
    embed_engine = LocalEmbeddingEngine()
    print("--> Pre-computing local embeddings for canonical entities & registered aliases...")
    canonical_embeddings = {}
    for c_id, ent in canonical_entities.items():
        c_vec = embed_engine.encode([ent["canonical_name"]])[0]
        a_vecs = embed_engine.encode(ent.get("aliases", [])) if ent.get("aliases") else []
        canonical_embeddings[c_id] = {
            "canonical": c_vec,
            "aliases": a_vecs
        }
    print("✓ Embeddings computed.\n")
    
    methods = [
        ("Method 1 (Exact Match)", lambda m, t, c: resolve_method_1_exact(m, t, c)),
        ("Method 2 (Normalized Match)", lambda m, t, c: resolve_method_2_normalized(m, t, c)),
        ("Method 3 (Alias Dictionary)", lambda m, t, c: resolve_method_3_alias(m, t, c)),
        ("Method 4 (String Similarity t=0.82)", lambda m, t, c: resolve_method_4_string_sim(m, t, c, threshold=0.82)),
        ("Method 5 (Local Embedding t=0.80)", lambda m, t, c: resolve_method_5_embedding_sim(m, t, c, embed_engine, canonical_embeddings, threshold=0.80)),
        ("Method 6 (Contextual Heuristic)", lambda m, t, c: resolve_method_6_contextual(m, t, c)),
        ("Method 7 (Layered Hybrid Resolver)", lambda m, t, c: resolve_method_7_layered(m, t, c, embed_engine, canonical_embeddings)),
    ]
    
    calib_results = {}
    eval_results = {}
    
    print("=" * 115)
    print("EVALUATION RESULTS TABLE (BLIND EVALUATION SPLIT - 48 Cases)")
    print("=" * 115)
    print(f"{'Method':<35} | {'Prec':<7} | {'Recall':<7} | {'F1':<7} | {'FalseMerge':<10} | {'FalseSplit':<10} | {'AmbAcc':<7} | {'NoMatch':<7} | {'Latency':<8}")
    print("-" * 115)
    
    for name, fn in methods:
        c_res = evaluate_method(fn, calib_cases, canonical_entities)
        e_res = evaluate_method(fn, eval_cases, canonical_entities)
        
        calib_results[name] = c_res
        eval_results[name] = e_res
        
        print(f"{name:<35} | {e_res['precision']*100:6.1f}% | {e_res['recall']*100:6.1f}% | {e_res['f1']*100:6.1f}% | {e_res['false_merge_rate']*100:9.1f}% | {e_res['false_split_rate']*100:9.1f}% | {e_res['ambiguity_accuracy']*100:6.1f}% | {e_res['nomatch_accuracy']*100:6.1f}% | {e_res['avg_latency_us']:6.1f}µs")
        
    out_payload = {
        "benchmark": "Experiment 004A: Entity Resolution Offline Benchmark",
        "date": "2026-08-18",
        "dataset_metadata": benchmark_data["benchmark_metadata"],
        "calibration_results": calib_results,
        "evaluation_results": eval_results
    }
    
    os.makedirs(os.path.dirname(RESULTS_PATH), exist_ok=True)
    with open(RESULTS_PATH, 'w', encoding='utf-8') as f:
        json.dump(out_payload, f, indent=2)
        
    print(f"\n✓ Complete Experiment 004A benchmark artifact saved to: {RESULTS_PATH}")

if __name__ == "__main__":
    run_benchmark()
