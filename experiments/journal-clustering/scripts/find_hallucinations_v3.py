import json
import os

with open("experiments/journal-clustering/dataset/synthetic_journal_entities_ground_truth.json", "r", encoding="utf-8") as f:
    dataset = json.load(f)

# Build a map of entry_id -> text, entities
entry_map = {e["id"]: e for e in dataset}

# Load GPT-OSS results
with open("experiments/journal-clustering/results/experiment_003a_gpt_oss_120b_results.json", "r", encoding="utf-8") as f:
    gpt_data = json.load(f)

# Let's inspect V3_Confidence_All per_call_telemetry to find the entries with hallucinations
v3_res = gpt_data["variant_results"]["V3_Confidence_All"]
telemetry = v3_res.get("per_call_telemetry", [])

def is_hallucinated(pred_name, text):
    p_lower = pred_name.lower().strip()
    t_lower = text.lower()
    if p_lower in t_lower:
        return False
    parts = [w for w in p_lower.split() if len(w) > 2]
    if any(part in t_lower for part in parts):
        return False
    return True

print("=== HALLUCINATION AUDIT: V3_Confidence_All ===")
hallucinated_cases = []

# To get the raw extracted predictions, let's re-run or inspect if we have the predictions saved or evaluate
# Let's check telemetry entries where alias_hal > 0 or exact_hal > 0
for call in telemetry:
    if call.get("alias_hal", 0) > 0 or call.get("exact_hal", 0) > 0:
        eid = call["entry_id"]
        entry = entry_map[eid]
        print(f"\nEntry ID: {eid}")
        print(f"Text: \"{entry['text']}\"")
        print(f"Ground Truth Entities: {json.dumps(entry['entities'])}")
        print(f"Telemetry record: {json.dumps(call)}")
