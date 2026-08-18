"""
Diagnostic script:
1. Calls GET https://api.groq.com/openai/v1/models to list available models on GROQ_API_KEY.
2. Checks whether 'llama-3.3-70b-versatile' is listed.
3. Makes ONE test chat completion call to 'openai/gpt-oss-120b'.
Prints raw response for both.
"""

import os
import json
import urllib.request
import urllib.error
import os
import json
import urllib.request
import urllib.error

def load_env_file(filepath):
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ[k.strip()] = v.strip().strip('"').strip("'")

# Try loading from common .env locations
for path in [".env", "../.env", "../../.env", "../../../.env", os.path.join(os.path.dirname(__file__), "../../../.env")]:
    load_env_file(os.path.abspath(path))

api_key = os.getenv("GROQ_API_KEY")

print("=== GROQ DIAGNOSTIC TEST ===")
print(f"API Key present: {bool(api_key)}")
if api_key:
    print(f"API Key prefix: {api_key[:8]}... (length={len(api_key)})")

# 1. Models List Call
print("\n--- 1. GET https://api.groq.com/openai/v1/models ---")
models_url = "https://api.groq.com/openai/v1/models"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json",
    "User-Agent": "CognitiveEngine-Diagnostic/1.0"
}

try:
    req = urllib.request.Request(models_url, headers=headers, method="GET")
    with urllib.request.urlopen(req) as resp:
        status_code = resp.getcode()
        raw_body = resp.read().decode("utf-8")
        data = json.loads(raw_body)
        
        print(f"HTTP Status: {status_code}")
        model_ids = [m["id"] for m in data.get("data", [])]
        print(f"Total models returned: {len(model_ids)}")
        print(f"Available Model IDs:\n" + json.dumps(sorted(model_ids), indent=2))
        
        llama_present = "llama-3.3-70b-versatile" in model_ids
        print(f"\n>> 'llama-3.3-70b-versatile' in model list: {llama_present}")
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Error fetching models: {e}")

# 2. Single Chat Completion Call using openai/gpt-oss-120b
print("\n--- 2. POST https://api.groq.com/openai/v1/chat/completions (model: openai/gpt-oss-120b) ---")
chat_url = "https://api.groq.com/openai/v1/chat/completions"
payload = {
    "model": "openai/gpt-oss-120b",
    "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Respond with a short JSON object containing a test greeting."}
    ],
    "response_format": {"type": "json_object"},
    "temperature": 0.0,
    "max_tokens": 100
}

data_bytes = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(chat_url, data=data_bytes, headers=headers, method="POST")

try:
    with urllib.request.urlopen(req) as resp:
        status_code = resp.getcode()
        raw_body = resp.read().decode("utf-8")
        print(f"HTTP Status: {status_code}")
        print("Raw Response Body:")
        print(raw_body)
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}:")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(f"Error executing chat completion: {e}")
