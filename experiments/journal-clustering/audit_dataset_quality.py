"""
Workstream 2 -- Dataset Quality & Duplication Audit
Audits synthetic_journal_entries.json for exact duplicates, near-duplicates, and templated entries.
Measures string similarity (difflib SequenceMatcher) across all 100 entries.
"""

import json
import os
from difflib import SequenceMatcher

DATASET_PATH = os.path.join(os.path.dirname(__file__), 'dataset/synthetic_journal_entries.json')

with open(DATASET_PATH, 'r', encoding='utf-8') as f:
    dataset = json.load(f)

print("=" * 80)
print("WORKSTREAM 2 -- DATASET QUALITY AUDIT REPORT")
print(f"Target Dataset: {DATASET_PATH}")
print(f"Total Entries: {len(dataset)}")
print("=" * 80 + "\n")

exact_duplicates = []
near_duplicates = []  # Similarity >= 0.85
templated_groups = {} # Group entries by core text without [Ref #X]

text_map = {}
for entry in dataset:
    eid = entry["id"]
    raw_text = entry["text"]
    # Strip template references like [Ref #31]
    stripped_text = entry["text"].split('[Ref #')[0].strip()

    templated_groups.setdefault(stripped_text, []).append(eid)

    if raw_text in text_map:
        exact_duplicates.append((eid, text_map[raw_text]))
    else:
        text_map[raw_text] = eid

# Pairwise similarity audit
n = len(dataset)
for i in range(n):
    for j in range(i + 1, n):
        e1, e2 = dataset[i], dataset[j]
        ratio = SequenceMatcher(None, e1["text"], e2["text"]).ratio()
        if ratio >= 0.85 and e1["text"] != e2["text"]:
            near_duplicates.append({
                "entry1_id": e1["id"],
                "entry2_id": e2["id"],
                "similarity": ratio,
                "text1": e1["text"],
                "text2": e2["text"]
            })

# Templated duplicate clusters (entries sharing identical text except for [Ref #X])
ref_clusters = {k: v for k, v in templated_groups.items() if len(v) > 1}

print("--- 1. EXACT DUPLICATES ---")
print(f"Total Exact Duplicate Pairs: {len(exact_duplicates)}")
for d in exact_duplicates:
    print(f"  - {d[0]} is an exact duplicate of {d[1]}")

print("\n--- 2. TEMPLATED / REPEATED PATTERN CLUSTERS ---")
print(f"Total Unique Base Texts with Repeated Template Clones: {len(ref_clusters)}")
total_cloned_entries = sum(len(v) for v in ref_clusters.values())
print(f"Total Entries Belonging to Template Clones: {total_cloned_entries}")

print("\nSample Templated Clusters (first 5):")
for idx, (base_text, eids) in enumerate(list(ref_clusters.items())[:5], 1):
    print(f"  Cluster {idx} ({len(eids)} entries: {eids}):")
    print(f"    Base Text: \"{base_text}\"")

print(f"\n--- 3. EFFECTIVELY UNIQUE ENTRIES SUMMARY ---")
unique_base_texts = len(templated_groups)
print(f"Total Raw Dataset Entries: {len(dataset)}")
print(f"Unique Underlying Thought Templates: {unique_base_texts}")
print(f"Duplication Factor: {len(dataset) / unique_base_texts:.2f}x")

# Save detailed JSON report
report_payload = {
    "total_entries": len(dataset),
    "exact_duplicates_count": len(exact_duplicates),
    "unique_base_templates_count": unique_base_texts,
    "near_duplicates_count": len(near_duplicates),
    "templated_clusters_count": len(ref_clusters),
    "templated_clusters": {k: v for k, v in ref_clusters.items()}
}

report_path = os.path.join(os.path.dirname(__file__), 'results/dataset_quality_audit.json')
with open(report_path, 'w', encoding='utf-8') as f:
    json.dump(report_payload, f, indent=2)

print(f"\nDetailed Dataset Quality Audit saved to {report_path}")
