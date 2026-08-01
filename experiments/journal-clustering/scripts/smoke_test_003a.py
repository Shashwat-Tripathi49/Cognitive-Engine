"""
Experiment 003A -- Smoke Test (5 entries, 4 prompt variants)
Sends real journal entries to Groq LLM API and prints raw output.
Model: llama-3.3-70b-versatile via Groq OpenAI-compatible endpoint.
"""

import json
import os
import sys
import time
import requests

# Force UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8')

def load_env_file():
    """Helper to load key-value pairs from root .env file into os.environ."""
    env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../.env'))
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    os.environ[k.strip()] = v.strip()

load_env_file()
GROQ_API_KEY = os.environ.get("GROQ_API_KEY") or os.environ.get("testkey", "")
GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"

# Load dataset
DATASET_PATH = os.path.join(os.path.dirname(__file__), '../dataset/synthetic_journal_entries.json')

# --- Prompt Definitions ---

PROMPT_V0_ORIGINAL = """Extract all named entities from the following journal entry.
Return a JSON object with this exact structure:
{
  "entities": [
    {"name": "entity name", "type": "Person|Project|Place|Organization|Tool|Topic|Goal"}
  ]
}
If no entities are found, return {"entities": []}.
Do not include any text outside the JSON object.

Journal entry:
"{text}"
"""

PROMPT_V1_EXHAUSTIVE = """You are an entity extraction system. Your task is to enumerate EVERY named entity mentioned in the following journal entry.

Entity types to look for:
- Person: Any named individual (e.g., "Rahul", "Priya")
- Project: Any named project, product, or initiative (e.g., "Expense Tracker")
- Organization: Any company, university, or group
- Place: Any city, venue, or geographic location (e.g., "Bangalore", "Mumbai")
- Tool: Any software library, framework, or technology (e.g., "React", "Node.js", "PostgreSQL")
- Topic: Any subject area or field of study (e.g., "machine learning", "system design")
- Goal: Any explicit objective or milestone (e.g., "CAT 2026 Preparation")

Be thorough. Extract every entity you can identify, even if only briefly mentioned.
Return ONLY a JSON object with this exact structure:
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

Return ONLY a JSON object:
{
  "entities": [
    {"name": "entity name", "type": "Person|Project|Place|Organization|Tool|Topic|Goal"}
  ]
}
If no entities are found, return {"entities": []}.

Journal entry:
"{text}"
"""

PROMPT_V3_CONFIDENCE = """Extract named entities from the following journal entry. For each entity, assign a confidence level:

- HIGH: The entity's exact proper name appears explicitly in the text.
- MEDIUM: The entity is strongly implied by specific keywords (e.g., "budgeting module" implies a finance project).
- LOW: The entity is vaguely referenced or requires inference (e.g., "the project", "he").

Entity types: Person, Project, Place, Organization, Tool, Topic, Goal.

Return ONLY a JSON object:
{
  "entities": [
    {"name": "entity name", "type": "Person|Project|Place|Organization|Tool|Topic|Goal", "confidence": "HIGH|MEDIUM|LOW"}
  ]
}
If no entities are found, return {"entities": []}.

Journal entry:
"{text}"
"""

PROMPTS = {
    "V0_Original": PROMPT_V0_ORIGINAL,
    "V1_Exhaustive": PROMPT_V1_EXHAUSTIVE,
    "V2_Conservative": PROMPT_V2_CONSERVATIVE,
    "V3_Confidence": PROMPT_V3_CONFIDENCE,
}

def call_groq(prompt_text, entry_id):
    """Make a single API call to Groq. Returns (raw_response_text, latency_ms, success, error_msg)."""
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "user", "content": prompt_text}
        ],
        "temperature": 0.0,  # Deterministic for reproducibility
        "max_tokens": 1024,
    }

    start = time.time()
    try:
        resp = requests.post(GROQ_ENDPOINT, headers=headers, json=payload, timeout=30)
        latency_ms = (time.time() - start) * 1000

        if resp.status_code != 200:
            return None, latency_ms, False, f"HTTP {resp.status_code}: {resp.text[:300]}"

        data = resp.json()
        raw_text = data["choices"][0]["message"]["content"]
        return raw_text, latency_ms, True, None

    except Exception as e:
        latency_ms = (time.time() - start) * 1000
        return None, latency_ms, False, str(e)


def run_smoke_test():
    if not GROQ_API_KEY:
        print("ERROR: 'testkey' environment variable not set.")
        print("Set it with: set testkey=gsk_...")
        return

    with open(DATASET_PATH, 'r', encoding='utf-8') as f:
        dataset = json.load(f)

    # Pick 5 diverse entries: work+person, work-only, fitness, family, learning
    smoke_indices = [0, 1, 10, 18, 25]  # entry_001, 002, 011, 019, 026
    smoke_entries = [dataset[i] for i in smoke_indices]

    print("=" * 80)
    print("EXPERIMENT 003A -- SMOKE TEST (5 entries x 4 prompts = 20 API calls)")
    print(f"Model: {MODEL}")
    print(f"API Endpoint: {GROQ_ENDPOINT}")
    print(f"API Key: {GROQ_API_KEY[:8]}...{GROQ_API_KEY[-4:]}")
    print("=" * 80)

    for entry in smoke_entries:
        print(f"\n{'-' * 80}")
        print(f"ENTRY: {entry['id']}")
        print(f"TEXT: \"{entry['text']}\"")
        print(f"GROUND TRUTH THEMES: {entry['ground_truth_themes']}")
        print(f"{'-' * 80}")

        for variant_name, prompt_template in PROMPTS.items():
            prompt = prompt_template.replace("{text}", entry["text"])
            raw_output, latency_ms, success, error = call_groq(prompt, entry["id"])

            print(f"\n  [{variant_name}] (latency: {latency_ms:.0f}ms, success: {success})")
            if success:
                print(f"  RAW OUTPUT:\n  {raw_output}")
                # Attempt JSON parse
                try:
                    parsed = json.loads(raw_output)
                    entities = parsed.get("entities", [])
                    print(f"  PARSED ENTITIES ({len(entities)}):")
                    for e in entities:
                        conf = e.get("confidence", "N/A")
                        print(f"    - {e['name']} ({e['type']}) [confidence: {conf}]")
                except json.JSONDecodeError as je:
                    print(f"  ** JSON PARSE FAILURE: {je}")
                    print(f"  (This would be counted as a parsing failure in production)")
            else:
                print(f"  X API ERROR: {error}")

            # Rate limiting: Groq has per-minute limits
            time.sleep(1.0)

    print(f"\n{'=' * 80}")
    print("SMOKE TEST COMPLETE -- Review raw output above before approving full batch.")
    print(f"{'=' * 80}")


if __name__ == "__main__":
    run_smoke_test()
