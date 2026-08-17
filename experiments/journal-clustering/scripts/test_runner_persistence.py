"""
No-API-Call Proof Test: Verifies targeted variant execution and non-destructive merge persistence.
ZERO network or Groq API calls.
"""

import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Import the runner function from run_experiment_003a
from run_experiment_003a import run_experiment_003a_final

TEMP_RESULTS_PATH = os.path.join(os.path.dirname(__file__), '../results/temp_test_persistence.json')

# Clean up temporary test file if exists
if os.path.exists(TEMP_RESULTS_PATH):
    os.remove(TEMP_RESULTS_PATH)

def make_mock_api(fake_entities):
    """Creates a deterministic mock API caller returning fake entities without network calls."""
    def mock_api_caller(prompt_text):
        raw_json = json.dumps({"entities": fake_entities})
        latency = 12.5
        usage = {"prompt_tokens": 50, "completion_tokens": 20}
        return raw_json, latency, usage, True, None
    return mock_api_caller

print("=" * 80)
print("EXPERIMENT 003A: NO-API-CALL RUNNER & PERSISTENCE PROOF TEST")
print("=" * 80)

# -------------------------------------------------------------
# RUN 1: Execute ONLY V0_Original
# -------------------------------------------------------------
print("\n>>> STARTING RUN 1: Target Variant = V0_Original")
mock_api_1 = make_mock_api([{"name": "Rahul", "type": "Person"}])

res_1 = run_experiment_003a_final(
    max_entries=5,
    target_variants="V0_Original",
    results_path=TEMP_RESULTS_PATH,
    api_caller=mock_api_1
)

with open(TEMP_RESULTS_PATH, 'r', encoding='utf-8') as f:
    data_1 = json.load(f)
keys_1 = list(data_1["variant_results"].keys())
print(f"Run 1 requested: V0_Original")
print(f"Executed: [V0_Original]")
print(f"Persisted keys: {keys_1}")
assert keys_1 == ["V0_Original"], f"Expected ['V0_Original'], got {keys_1}"

# -------------------------------------------------------------
# RUN 2: Execute ONLY V3_Confidence_HighOnly
# -------------------------------------------------------------
print("\n>>> STARTING RUN 2: Target Variant = V3_Confidence_HighOnly")
mock_api_2 = make_mock_api([{"name": "Priya", "type": "Person", "confidence": "HIGH"}])

res_2 = run_experiment_003a_final(
    max_entries=5,
    target_variants="V3_Confidence_HighOnly",
    results_path=TEMP_RESULTS_PATH,
    api_caller=mock_api_2
)

with open(TEMP_RESULTS_PATH, 'r', encoding='utf-8') as f:
    data_2 = json.load(f)
keys_2 = list(data_2["variant_results"].keys())
print(f"Run 2 requested: V3_Confidence_HighOnly")
print(f"Executed: [V3_Confidence_HighOnly]")
print(f"Persisted keys: {keys_2}")
assert keys_2 == ["V0_Original", "V3_Confidence_HighOnly"], f"Expected ['V0_Original', 'V3_Confidence_HighOnly'], got {keys_2}"
assert "V0_Original" in data_2["variant_results"], "V0_Original was unexpectedly deleted/overwritten!"

# -------------------------------------------------------------
# RUN 3: Execute ONLY V2_Conservative
# -------------------------------------------------------------
print("\n>>> STARTING RUN 3: Target Variant = V2_Conservative")
mock_api_3 = make_mock_api([{"name": "Node.js", "type": "Tool"}])

res_3 = run_experiment_003a_final(
    max_entries=5,
    target_variants="V2_Conservative",
    results_path=TEMP_RESULTS_PATH,
    api_caller=mock_api_3
)

with open(TEMP_RESULTS_PATH, 'r', encoding='utf-8') as f:
    data_3 = json.load(f)
keys_3 = list(data_3["variant_results"].keys())
print(f"Run 3 requested: V2_Conservative")
print(f"Executed: [V2_Conservative]")
print(f"Persisted keys: {keys_3}")
assert keys_3 == ["V0_Original", "V3_Confidence_HighOnly", "V2_Conservative"], f"Expected ['V0_Original', 'V3_Confidence_HighOnly', 'V2_Conservative'], got {keys_3}"

# Clean up temporary test file
if os.path.exists(TEMP_RESULTS_PATH):
    os.remove(TEMP_RESULTS_PATH)

print("\n" + "=" * 80)
print("SUCCESS: ALL PERSISTENCE AND TARGET-VARIANT TESTS PASSED CLEANLY (0 API Calls)")
print("=" * 80)
