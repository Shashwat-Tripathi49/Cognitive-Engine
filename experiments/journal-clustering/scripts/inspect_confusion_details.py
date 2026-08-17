import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

dataset_path = 'experiments/journal-clustering/dataset/synthetic_journal_entities_ground_truth.json'
progress_path = 'experiments/journal-clustering/results/v3_high_only_progress.json'

with open(dataset_path, 'r', encoding='utf-8') as f:
    dataset = json.load(f)

with open(progress_path, 'r', encoding='utf-8') as f:
    prog = json.load(f)

print("=== DETAILED CONFUSION BREAKDOWN PER ENTRY ===")
fn_entries = []
tp_entries = []
fp_entries = []

for p in prog:
    idx = p["idx"]
    entry = dataset[idx]
    gt_names = [f"{e['name']} ({e['type']})" for e in entry.get("entities", [])]
    
    if p["tp_exact"] > 0:
        tp_entries.append((entry["id"], entry["text"], gt_names, p["tp_exact"]))
    if p["fn_exact"] > 0:
        fn_entries.append((entry["id"], entry["text"], gt_names, p["fn_exact"]))
    if p["fp_exact"] > 0:
        fp_entries.append((entry["id"], entry["text"], gt_names, p["fp_exact"]))

print(f"\n--- Total Entries with TP > 0: {len(tp_entries)} (Sum TP = {sum(x[3] for x in tp_entries)}) ---")
for eid, text, gt, count in tp_entries:
    print(f"[{eid}] TP Count: {count} | GT: {gt} | Text: {text[:80]}...")

print(f"\n--- Total Entries with FN > 0: {len(fn_entries)} (Sum FN = {sum(x[3] for x in fn_entries)}) ---")
for eid, text, gt, count in fn_entries:
    print(f"[{eid}] FN Count: {count} | GT: {gt} | Text: {text}")

print(f"\n--- Total Entries with FP > 0: {len(fp_entries)} (Sum FP = {sum(x[3] for x in fp_entries)}) ---")
for eid, text, gt, count in fp_entries[:15]:
    print(f"[{eid}] FP Count: {count} | GT: {gt} | Text: {text[:80]}...")
