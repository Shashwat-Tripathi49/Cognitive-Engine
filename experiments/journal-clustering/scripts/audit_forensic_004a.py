import json
import os
import re
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from run_experiment_004a import *

BENCHMARK_PATH = os.path.join(os.path.dirname(__file__), '../dataset/entity_resolution_gold.json')
RESULTS_PATH = os.path.join(os.path.dirname(__file__), '../results/experiment_004a_results.json')

with open(BENCHMARK_PATH, 'r', encoding='utf-8') as f:
    bench = json.load(f)

cases = bench['cases']
canonical_entities = {e['id']: e for e in bench['canonical_entities']}
eval_cases = [c for c in cases if c['split'] == 'evaluation']
calib_cases = [c for c in cases if c['split'] == 'calibration']

embed_engine = LocalEmbeddingEngine()
canonical_embeddings = {}
for c_id, ent in canonical_entities.items():
    c_vec = embed_engine.encode([ent['canonical_name']])[0]
    a_vecs = embed_engine.encode(ent.get('aliases', [])) if ent.get('aliases') else []
    canonical_embeddings[c_id] = {'canonical': c_vec, 'aliases': a_vecs}

print("=================================================================")
print("FORENSIC 1: TRACING METHOD 7 ON ALL 48 EVALUATION CASES")
print("=================================================================")
mismatches = []
for c in eval_cases:
    m = c['surfaceMention']
    t = c['entityType']
    exp_out = c['expectedOutcome']
    exp_cid = c['canonicalEntityId']
    cid = c['caseId']
    m_class = c['matchClass']
    
    # Layer 1
    norm_m = normalize_text(m)
    l1_anaphora = any(re.match(p, norm_m) for p in GENERIC_ANAPHORA_PATTERNS)
    
    # Matching entities
    matching_ents = []
    for cur_id, ent in canonical_entities.items():
        if ent['type'] == t:
            if norm_m == normalize_text(ent['canonical_name']) or any(norm_m == normalize_text(a) for a in ent.get('aliases', [])):
                matching_ents.append(cur_id)
    l1_multi = len(matching_ents) > 1
    
    # Layer 2
    res_norm, cid_norm, _ = resolve_method_2_normalized(m, t, canonical_entities)
    # Layer 3
    res_alias, cid_alias, _ = resolve_method_3_alias(m, t, canonical_entities)
    # Layer 4 trap
    l4_trap = False
    for cur_id, ent in canonical_entities.items():
        c_norm = normalize_text(ent['canonical_name'])
        if c_norm in norm_m and len(norm_m) > len(c_norm) + 3:
            l4_trap = True
            break
            
    final_out, final_cid, final_score = resolve_method_7_layered(m, t, canonical_entities, embed_engine, canonical_embeddings)
    
    match = (final_out == exp_out) and (final_cid == exp_cid)
    print(f"[{cid}] '{m}' ({t}, {m_class}) -> Expected: {exp_out} ({exp_cid}) | Final: {final_out} ({final_cid}) | Match: {match}")
    if not match:
        mismatches.append((cid, m, t, m_class, exp_out, exp_cid, final_out, final_cid, final_score))

print(f"\nTotal Mismatches in Method 7: {len(mismatches)}")
for m_item in mismatches:
    print(f"  --> {m_item}")

print("\n=================================================================")
print("FORENSIC 2: PER-CATEGORY BREAKDOWN ON EVALUATION SET")
print("=================================================================")
# Map each case to its Category (from metadata or case notes/matchClass)
# Let's inspect categories
cat_map = {}
for c in eval_cases:
    cid_num = int(c['caseId'].split('_')[1])
    # Determine category
    if 33 <= cid_num <= 44:
        cat = "CAT_A_Exact"
    elif 45 <= cid_num <= 52:
        cat = "CAT_B_Normalized"
    elif 53 <= cid_num <= 60:
        cat = "CAT_C_Alias"
    elif 61 <= cid_num <= 65:
        cat = "CAT_D_Abbreviation"
    elif 66 <= cid_num <= 69:
        cat = "CAT_E_Paraphrase"
    elif 70 <= cid_num <= 75:
        cat = "CAT_F_Ambiguous"
    elif 76 <= cid_num <= 78:
        cat = "CAT_G_Hard_Negative"
    elif 79 <= cid_num <= 80:
        cat = "CAT_H_No_Match_Novel"
    else:
        cat = "UNKNOWN"
    cat_map[c['caseId']] = cat

categories = ["CAT_A_Exact", "CAT_B_Normalized", "CAT_C_Alias", "CAT_D_Abbreviation", "CAT_E_Paraphrase", "CAT_F_Ambiguous", "CAT_G_Hard_Negative", "CAT_H_No_Match_Novel"]

for cat in categories:
    cat_cases = [c for c in eval_cases if cat_map[c['caseId']] == cat]
    print(f"\n--- {cat} ({len(cat_cases)} cases) ---")
    for meth_name, meth_fn in [
        ("M1 Exact", lambda m,t: resolve_method_1_exact(m,t,canonical_entities)),
        ("M2 Norm", lambda m,t: resolve_method_2_normalized(m,t,canonical_entities)),
        ("M3 Alias", lambda m,t: resolve_method_3_alias(m,t,canonical_entities)),
        ("M5 Embed", lambda m,t: resolve_method_5_embedding_sim(m,t,canonical_entities, embed_engine, canonical_embeddings, threshold=0.80)),
        ("M7 Hybrid", lambda m,t: resolve_method_7_layered(m,t,canonical_entities, embed_engine, canonical_embeddings)),
    ]:
        correct = 0
        fm = 0
        fs = 0
        for c in cat_cases:
            out, cid, _ = meth_fn(c['surfaceMention'], c['entityType'])
            if out == c['expectedOutcome'] and cid == c['canonicalEntityId']:
                correct += 1
            elif out == "RESOLVED" and (c['expectedOutcome'] != "RESOLVED" or cid != c['canonicalEntityId']):
                fm += 1
            elif out != "RESOLVED" and c['expectedOutcome'] == "RESOLVED":
                fs += 1
        print(f"  {meth_name:<10}: Correct={correct}/{len(cat_cases)}, FalseMerges={fm}, FalseSplits={fs}")

print("\n=================================================================")
print("FORENSIC 3: EMBEDDING METHOD 5 FAILURES ON HARD NEGATIVES")
print("=================================================================")
hard_neg_cases = [c for c in cases if "Hard negative" in c.get('notes', '') or "trap" in c.get('notes', '').lower()]
for c in hard_neg_cases:
    m = c['surfaceMention']
    t = c['entityType']
    exp_out = c['expectedOutcome']
    cid = c['caseId']
    split = c['split']
    
    # Method 5
    m5_out, m5_cid, m5_sim = resolve_method_5_embedding_sim(m, t, canonical_entities, embed_engine, canonical_embeddings, threshold=0.80)
    print(f"[{split}] {cid} '{m}' ({t}) -> Exp: {exp_out} | M5: {m5_out} to '{m5_cid}' (Sim={m5_sim:.4f})")
