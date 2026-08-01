"""
Rate-Limit Clean Benchmark Script
Proves that parse failure rate is 0% when Groq API rate limits (30 RPM) are respected.
Runs 25 entries per prompt variant with 2.1s delays.
"""

import json
import os
import sys
import time
import requests

sys.stdout.reconfigure(encoding='utf-8')

GROQ_API_KEY = os.environ.get("testkey", "")
GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"

DATASET_PATH = os.path.join(os.path.dirname(__file__), 'dataset/synthetic_journal_entities_ground_truth.json')

PROMPT_V0_ORIGINAL = """Extract all named entities from the following journal entry.
Return a JSON object with this exact structure:
{
  "entities": [
    {"name": "entity name", "type": "Person|Project|Place|Organization|Tool|Topic|Goal"}
  ]
}
If no entities are found, return {"entities": []}.

Journal entry:
"{text}"
"""

PROMPT_V2_CONSERVATIVE = """Extract named entities from the following journal entry.

STRICT RULES:
1. ONLY extract entities whose EXACT NAME appears as a word or phrase in the text.
2. Do NOT infer, guess, or deduce entities that are not explicitly named.
3. If the text says "the project" or "the tool" without naming it, do NOT extract anything for it.
4. If the text says "he" or "she" without naming the person, do NOT extract a person entity.
5. Only return entities you are 100% certain are explicitly named in the text.

Return a JSON object:
{
  "entities": [
    {"name": "entity name", "type": "Person|Project|Place|Organization|Tool|Topic|Goal"}
  ]
}
If no entities are found, return {"entities": []}.

Journal entry:
"{text}"
"""

def call_groq_clean(prompt_text):
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt_text}],
        "response_format": {"type": "json_object"},
        "temperature": 0.0,
        "max_tokens": 1024,
    }

    resp = requests.post(GROQ_ENDPOINT, headers=headers, json=payload, timeout=30)
    if resp.status_code != 200:
        return None, False, f"HTTP {resp.status_code}: {resp.text[:150]}"

    data = resp.json()
    raw = data["choices"][0]["message"]["content"]
    return raw, True, None

def run_test():
    with open(DATASET_PATH, 'r', encoding='utf-8') as f:
        dataset = json.load(f)

    subset = dataset[:25]
    print(f"Testing 25 entries with 2.1s rate-pacing on Groq JSON mode...\n")

    for vname, ptemplate in [("V0_Original", PROMPT_V0_ORIGINAL), ("V2_Conservative", PROMPT_V2_CONSERVATIVE)]:
        print(f"--- Variant: {vname} ---")
        api_successes = 0
        json_parses = 0
        total_extracted = 0

        for entry in subset:
            ptext = ptemplate.replace("{text}", entry["text"])
            raw, success, err = call_groq_clean(ptext)
            time.sleep(2.1)  # Respect 30 RPM limit strictly

            if success:
                api_successes += 1
                try:
                    pjson = json.loads(raw)
                    if "entities" in pjson and isinstance(pjson["entities"], list):
                        json_parses += 1
                        total_extracted += len(pjson["entities"])
                except Exception:
                    pass

        print(f"  API Success Rate: {api_successes}/25 ({api_successes/25*100:.1f}%)")
        print(f"  JSON Parse Success Rate: {json_parses}/25 ({json_parses/25*100:.1f}%)")
        print(f"  Parse Failure Rate: {(25-json_parses)/25*100:.1f}%")
        print(f"  Total Entities Extracted: {total_extracted}\n")

if __name__ == "__main__":
    run_test()
