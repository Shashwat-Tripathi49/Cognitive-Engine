import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

dataset_path = 'experiments/journal-clustering/dataset/synthetic_journal_entities_ground_truth.json'
progress_path = 'experiments/journal-clustering/results/v3_high_only_progress.json'
results_path = 'experiments/journal-clustering/results/experiment_003a_results.json'

with open(dataset_path, 'r', encoding='utf-8') as f:
    dataset = json.load(f)

with open(progress_path, 'r', encoding='utf-8') as f:
    progress = json.load(f)

with open(results_path, 'r', encoding='utf-8') as f:
    results = json.load(f)

print("=== 1. GROUND TRUTH DENOMINATOR ANALYSIS ===")
total_gt_entities = 0
entries_with_entities = 0
entity_type_counts = {}

for entry in dataset:
    ents = entry.get("entities", [])
    total_gt_entities += len(ents)
    if ents:
        entries_with_entities += 1
    for e in ents:
        etype = e.get("type", "Unknown")
        entity_type_counts[etype] = entity_type_counts.get(etype, 0) + 1

print(f"Total entries in dataset: {len(dataset)}")
print(f"Total ground truth entity occurrences: {total_gt_entities}")
print(f"Entries with at least 1 entity: {entries_with_entities}")
print(f"Entity counts by type: {entity_type_counts}")

print("\n=== 2. PROGRESS METRICS CHECK ===")
tp_total = sum(p["tp_exact"] for p in progress)
fp_total = sum(p["fp_exact"] for p in progress)
fn_total = sum(p["fn_exact"] for p in progress)
hal_total = sum(p["hal_exact"] for p in progress)
extracted_high_total = sum(p["extracted_high_count"] for p in progress)

print(f"Total High-Confidence Extracted: {extracted_high_total}")
print(f"TP: {tp_total}")
print(f"FP: {fp_total}")
print(f"FN: {fn_total}")
print(f"TP + FN (Denominator): {tp_total + fn_total}")
print(f"TP + FP (Total Predictions): {tp_total + fp_total}")
print(f"Hallucinations: {hal_total}")

print("\n=== 3. RAW JSON 5-VARIANT TABLE ===")
variants = results.get("variant_results", {})
for vname, vdata in variants.items():
    ex = vdata.get("exact_span_matching", {})
    al = vdata.get("alias_aware_matching", {})
    print(f"{vname:<24} | Latency: {vdata.get('avg_latency_ms', 0):.1f}ms | Tokens: {vdata.get('total_tokens', 0)} | Exact P: {ex.get('precision', 0)*100:.2f}% | Exact R: {ex.get('recall', 0)*100:.2f}% | Exact F1: {ex.get('f1', 0)*100:.2f}% | TP: {ex.get('tp', 0)}, FP: {ex.get('fp', 0)}, FN: {ex.get('fn', 0)}")
