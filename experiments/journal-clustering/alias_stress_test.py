"""
Workstream 4 -- Rule D: Alias Stress Test Benchmark
Constructs 5 adversarial test cases where the text wording and canonical entity name are intentionally different.
Demonstrates whether alias-aware matching provides a measurable benefit over exact string matching.
"""

import json

# 5 Adversarial Test Cases
adversarial_cases = [
    {
        "id": "adv_001",
        "text": "Met Rahul to discuss the new budget app features.",
        "ground_truth": [
            {"name": "Rahul", "type": "Person", "text_span": "Rahul"},
            {"name": "Expense Tracker", "type": "Project", "text_span": "budget app", "aliases": ["budget app", "personal finance tool"]}
        ],
        "model_extracted": [
            {"name": "Rahul", "type": "Person"},
            {"name": "budget app", "type": "Project"}
        ]
    },
    {
        "id": "adv_002",
        "text": "Refactored transaction syncing in our personal finance tool.",
        "ground_truth": [
            {"name": "Expense Tracker", "type": "Project", "text_span": "personal finance tool", "aliases": ["personal finance tool", "budgeting module"]}
        ],
        "model_extracted": [
            {"name": "personal finance tool", "type": "Project"}
        ]
    },
    {
        "id": "adv_003",
        "text": "Debugging batch writes in the financial ledger module.",
        "ground_truth": [
            {"name": "Expense Tracker", "type": "Project", "text_span": "financial ledger module", "aliases": ["financial ledger module", "ledger"]}
        ],
        "model_extracted": [
            {"name": "financial ledger module", "type": "Project"}
        ]
    },
    {
        "id": "adv_004",
        "text": "Spent 3 hours on cat prep mock tests today.",
        "ground_truth": [
            {"name": "CAT 2026", "type": "Goal", "text_span": "cat prep", "aliases": ["cat prep"]}
        ],
        "model_extracted": [
            {"name": "cat prep", "type": "Goal"}
        ]
    },
    {
        "id": "adv_005",
        "text": "Priya delivered UI mockups for the money manager app.",
        "ground_truth": [
            {"name": "Priya", "type": "Person", "text_span": "Priya"},
            {"name": "Expense Tracker", "type": "Project", "text_span": "money manager app", "aliases": ["money manager app", "budget app"]}
        ],
        "model_extracted": [
            {"name": "Priya", "type": "Person"},
            {"name": "money manager app", "type": "Project"}
        ]
    }
]

def run_stress_test():
    exact_tp, exact_fp, exact_fn = 0, 0, 0
    alias_tp, alias_fp, alias_fn = 0, 0, 0

    print("=" * 80)
    print("WORKSTREAM 4 -- ALIAS STRESS TEST BENCHMARK (5 ADVERSARIAL CASES)")
    print("=" * 80)

    for case in adversarial_cases:
        gt = case["ground_truth"]
        pred = case["model_extracted"]

        # Exact String Match (predicted name must equal canonical name literally)
        ex_tp, ex_fp = 0, 0
        matched_gt_ex = set()
        for p in pred:
            p_name = p["name"].lower()
            p_type = p["type"].lower()
            m = False
            for i, g in enumerate(gt):
                if i in matched_gt_ex: continue
                if p_name == g["name"].lower() and p_type == g["type"].lower():
                    ex_tp += 1
                    matched_gt_ex.add(i)
                    m = True
                    break
            if not m: ex_fp += 1
        ex_fn = len(gt) - len(matched_gt_ex)

        # Alias-Aware Match (predicted name can match canonical name, text_span, or alias list)
        al_tp, al_fp = 0, 0
        matched_gt_al = set()
        for p in pred:
            p_name = p["name"].lower()
            p_type = p["type"].lower()
            m = False
            for i, g in enumerate(gt):
                if i in matched_gt_al: continue
                g_name = g["name"].lower()
                g_span = g["text_span"].lower()
                g_aliases = [a.lower() for a in g.get("aliases", [])]

                if (p_name == g_name or p_name == g_span or p_name in g_aliases) and p_type == g["type"].lower():
                    al_tp += 1
                    matched_gt_al.add(i)
                    m = True
                    break
            if not m: al_fp += 1
        al_fn = len(gt) - len(matched_gt_al)

        exact_tp += ex_tp
        exact_fp += ex_fp
        exact_fn += ex_fn

        alias_tp += al_tp
        alias_fp += al_fp
        alias_fn += al_fn

    ex_p = exact_tp / (exact_tp + exact_fp) if (exact_tp + exact_fp) > 0 else 0
    ex_r = exact_tp / (exact_tp + exact_fn) if (exact_tp + exact_fn) > 0 else 0
    ex_f1 = (2 * ex_p * ex_r / (ex_p + ex_r)) if (ex_p + ex_r) > 0 else 0

    al_p = alias_tp / (alias_tp + alias_fp) if (alias_tp + alias_fp) > 0 else 0
    al_r = alias_tp / (alias_tp + alias_fn) if (alias_tp + alias_fn) > 0 else 0
    al_f1 = (2 * al_p * al_r / (al_p + al_r)) if (al_p + al_r) > 0 else 0

    print(f"\nRESULTS ON ADVERSARIAL ALIAS BENCHMARK:")
    print(f"  Exact Match Scoring:       Precision = {ex_p*100:6.2f}%, Recall = {ex_r*100:6.2f}%, F1 = {ex_f1*100:6.2f}%")
    print(f"  Alias-Aware Scoring:      Precision = {al_p*100:6.2f}%, Recall = {al_r*100:6.2f}%, F1 = {al_f1*100:6.2f}%")
    print(f"  Recall Improvement:       +{(al_r - ex_r)*100:.2f}% (F1 boost: +{(al_f1 - ex_f1)*100:.2f}%)")
    print("=" * 80)

if __name__ == "__main__":
    run_stress_test()
