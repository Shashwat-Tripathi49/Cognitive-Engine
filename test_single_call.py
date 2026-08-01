import os
import sys
import time
import requests
import json

sys.stdout.reconfigure(encoding='utf-8')

env_path = ".env"
with open(env_path, "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ[k.strip()] = v.strip()

key = os.environ.get("GROQ_API_KEY")
print(f"Loaded key length: {len(key)}")

prompt_text = 'Extract named entities from: "Met Rahul at cafe for expense tracker." Return a JSON object with key "entities".'

print("Sending POST request to Groq...")
start = time.time()
try:
    resp = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json={
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt_text}],
            "response_format": {"type": "json_object"},
            "temperature": 0.0,
            "max_tokens": 512
        },
        timeout=(10, 30)
    )
    print(f"Status Code: {resp.status_code} (took {time.time()-start:.2f}s)")
    print(f"Response Body: {resp.text}")
except Exception as e:
    print(f"EXCEPTION: {type(e).__name__}: {e}")
