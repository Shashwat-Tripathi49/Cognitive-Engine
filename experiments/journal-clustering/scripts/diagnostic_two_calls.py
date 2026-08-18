import json
import os
import sys
import difflib
import requests

# Force UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8')

# 1. Load Environment Configuration identical to run_experiment_003a.py
def load_env_file():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
    env_path = os.path.join(repo_root, '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    os.environ[k.strip()] = v.strip()

load_env_file()
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("ERROR: GROQ_API_KEY not found in .env")
    sys.exit(1)

GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"

# 2. Dataset - Load entry_001
DATASET_PATH = os.path.join(os.path.dirname(__file__), '../dataset/synthetic_journal_entities_ground_truth.json')
with open(DATASET_PATH, 'r', encoding='utf-8') as f:
    dataset = json.load(f)
entry = dataset[0]  # entry_001

# 3. Exact Prompts from run_experiment_003a.py
PROMPT_V0_ORIGINAL = """Extract all named entities from the following journal entry.
Return a JSON object with key "entities" containing a list of objects with "name" and "type".
Supported types: Person, Project, Place, Organization, Tool, Topic, Goal.
If no entities are found, return {"entities": []}.

Journal entry:
"{text}"
"""

PROMPT_V1_EXHAUSTIVE = """You are an entity extraction system. Enumerate EVERY named entity mentioned in the following journal entry.

Entity types:
- Person: Any named individual (e.g., "Rahul", "Priya")
- Project: Any named project, product, or initiative (e.g., "Expense Tracker")
- Organization: Any company, university, or group
- Place: Any city, venue, or geographic location (e.g., "Bangalore", "Mumbai")
- Tool: Any software library, framework, or technology (e.g., "React", "Node.js", "PostgreSQL")
- Topic: Any subject area or field of study (e.g., "machine learning", "system design")
- Goal: Any explicit objective or milestone (e.g., "CAT 2026 Preparation")

Be thorough. Extract every entity mentioned.
Return a JSON object with key "entities": [{"name": "...", "type": "..."}].
If no entities are found, return {"entities": []}.

Journal entry:
"{text}"
"""

headers = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
    "Content-Type": "application/json",
}

# Construct payloads
payload_v0 = {
    "model": MODEL,
    "messages": [{"role": "user", "content": PROMPT_V0_ORIGINAL.replace("{text}", entry["text"])}],
    "response_format": {"type": "json_object"},
    "temperature": 0.0,
    "max_tokens": 1024,
}

payload_v1 = {
    "model": MODEL,
    "messages": [{"role": "user", "content": PROMPT_V1_EXHAUSTIVE.replace("{text}", entry["text"])}],
    "response_format": {"type": "json_object"},
    "temperature": 0.0,
    "max_tokens": 1024,
}

def execute_call(variant_name, payload):
    print(f"\n=======================================================")
    print(f"REQUEST TELEMETRY: {variant_name}")
    print(f"=======================================================")
    print(f"variant name: {variant_name}")
    print(f"entry ID: {entry['id']}")
    print(f"exact endpoint: {GROQ_ENDPOINT}")
    print(f"repr(model): {repr(payload['model'])}")
    print(f"response_format: {json.dumps(payload['response_format'])}")
    print(f"temperature: {payload['temperature']}")
    print(f"max_tokens: {payload['max_tokens']}")
    print(f"prompt character length: {len(payload['messages'][0]['content'])}")
    
    # Strictly single real call, NO retries
    try:
        resp = requests.post(GROQ_ENDPOINT, headers=headers, json=payload, timeout=30)
        status_code = resp.status_code
        raw_body = resp.text
        
        print(f"HTTP status code: {status_code}")
        print(f"raw response body:\n{raw_body}")
        
        try:
            resp_json = resp.json()
            usage = resp_json.get("usage", None)
            print(f"token usage: {json.dumps(usage)}")
        except Exception:
            print("token usage: None (Non-JSON body)")
            
        return status_code, raw_body
    except Exception as e:
        print(f"HTTP status code: EXCEPTION")
        print(f"raw response body: {str(e)}")
        print(f"token usage: None")
        return None, str(e)

status_v0, body_v0 = execute_call("V0_Original", payload_v0)
status_v1, body_v1 = execute_call("V1_Exhaustive", payload_v1)

# Redacted payloads for comparison
redacted_p0 = json.dumps(payload_v0, indent=2)
redacted_p1 = json.dumps(payload_v1, indent=2)

print("\n=======================================================")
print("STRUCTURED PAYLOAD DIFF (Authorization redacted)")
print("=======================================================")
diff = difflib.unified_diff(
    redacted_p0.splitlines(keepends=True),
    redacted_p1.splitlines(keepends=True),
    fromfile='payload_v0.json',
    tofile='payload_v1.json'
)
print("".join(diff))

print("\n=======================================================")
print("DECISION SUMMARY")
print("=======================================================")
print(f"V0 Status: {status_v0}")
print(f"V1 Status: {status_v1}")
