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

# Let's inspect each entry in dataset and progress
print("=== ENTITY CONFUSION SET BREAKDOWN ===")

gt_by_entry = {e["id"]: e for e in dataset}

# Let's print all Ground Truth entities in the 100 entries:
all_gt = []
for e in dataset:
    for ent in e.get("entities", []):
        all_gt.append({
            "entry_id": e["id"],
            "text": e["text"],
            "name": ent["name"],
            "type": ent["type"],
            "text_span": ent["text_span"],
        })

print(f"Total Ground Truth Entity Instances: {len(all_gt)}")

# Print the 60 Ground Truth instances grouped by type:
gt_by_type = {}
for g in all_gt:
    t = g["type"]
    gt_by_type.setdefault(t, []).append(f"[{g['entry_id']}] {g['name']} ('{g['text_span']}')")

for t, items in gt_by_type.items():
    print(f"\n--- GT Type: {t} ({len(items)} instances) ---")
    for item in items:
        print("  ", item)
