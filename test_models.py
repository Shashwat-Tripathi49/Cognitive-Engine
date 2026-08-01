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

prompt_text = 'Extract named entities from: "Met Rahul at cafe for expense tracker." Return a JSON object with key "entities": [{"name": "...", "type": "..."}].'

for model_name in ["llama-3.1-8b-instant", "llama3-70b-8192", "mixtral-8x7b-32768"]:
    print(f"\nTesting model: {model_name}...")
    start = time.time()
    try:
        resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={
                "model": model_name,
                "messages": [{"role": "user", "content": prompt_text}],
                "response_format": {"type": "json_object"},
                "temperature": 0.0,
                "max_tokens": 512
            },
            timeout=10
        )
        print(f"Status Code: {resp.status_code} (took {time.time()-start:.2f}s)")
        if resp.status_code == 200:
            print("Response:", resp.json()["choices"][0]["message"]["content"])
        else:
            print("Error:", resp.text[:200])
    except Exception as e:
        print(f"EXCEPTION: {e}")
