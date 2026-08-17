import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

dataset_path = 'experiments/journal-clustering/dataset/synthetic_journal_entities_ground_truth.json'
progress_path = 'experiments/journal-clustering/results/v3_high_only_progress.json'

with open(dataset_path, 'r', encoding='utf-8') as f:
    dataset = json.load(f)

with open(progress_path, 'r', encoding='utf-8') as f:
    progress = json.load(f)

print("=== FORENSIC AUDIT: 81 FALSE POSITIVES IN V3_CONFIDENCE_HIGHONLY ===")

# Let's inspect each progress record and see what predictions occurred on entries where FP > 0
# We can examine the text of all entries where FP > 0 and extract the candidate entity spans
fp_analysis = []
for p in progress:
    if p["fp_exact"] > 0:
        entry = dataset[p["idx"]]
        fp_analysis.append({
            "idx": p["idx"],
            "id": entry["id"],
            "text": entry["text"],
            "fp_count": p["fp_exact"],
            "gt_entities": [e["name"] for e in entry.get("entities", [])],
        })

print(f"Total entries with at least 1 False Positive: {len(fp_analysis)}")
print(f"Total FP count across these entries: {sum(f['fp_count'] for f in fp_analysis)}")

for f in fp_analysis:
    print(f"\nEntry [{f['id']}] (FP Count: {f['fp_count']})")
    print(f"  Text: \"{f['text']}\"")
    print(f"  Ground Truth: {f['gt_entities']}")
