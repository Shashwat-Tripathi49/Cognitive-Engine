import json
import os
import sys
import requests

sys.stdout.reconfigure(encoding='utf-8')
GROQ_API_KEY = os.environ.get('testkey', '')
dataset = json.load(open('experiments/journal-clustering/dataset/synthetic_journal_entities_ground_truth.json'))

from scripts.run_experiment_003a import PROMPTS, call_groq_json_mode, parse_json_native

for vname, ptemplate in PROMPTS.items():
    if vname == 'V3_Confidence_HighOnly': continue
    print(f"\n--- VARIANT: {vname} ---")
    fail_count = 0
    for entry in dataset[:15]:
        ptext = ptemplate.replace('{text}', entry['text'])
        raw, lat, usage, success, err = call_groq_json_mode(ptext)
        parsed, perr = parse_json_native(raw)
        if perr or not parsed or "entities" not in parsed or not isinstance(parsed["entities"], list):
            fail_count += 1
            print(f"  FAIL Entry {entry['id']}: err={perr}, raw={raw[:100]}")
    print(f"Variant {vname}: {fail_count}/15 failures")
