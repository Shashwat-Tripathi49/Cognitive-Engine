import os
import sys
import json
import time
import requests

sys.stdout.reconfigure(encoding='utf-8')

repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
env_path = os.path.join(repo_root, '.env')
if os.path.exists(env_path):
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ[k.strip()] = v.strip()

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("ERROR: GROQ_API_KEY not found in .env")
    sys.exit(1)

GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"

headers = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
    "Content-Type": "application/json",
}

payload = {
    "model": MODEL,
    "messages": [{"role": "user", "content": "Return a JSON object: {\"status\": \"ready\"}"}],
    "response_format": {"type": "json_object"},
    "temperature": 0.0,
    "max_tokens": 50,
}

print(f"Verifying Groq API quota for model {MODEL}...")
try:
    resp = requests.post(GROQ_ENDPOINT, headers=headers, json=payload, timeout=20)
    print(f"HTTP Status: {resp.status_code}")
    if resp.status_code == 200:
        print("API QUOTA AVAILABLE: Successfully received response:", resp.json()["choices"][0]["message"]["content"])
    else:
        print("API NOT AVAILABLE / QUOTA ERROR:", resp.status_code, resp.text)
except Exception as e:
    print("API REQUEST ERROR:", str(e))
