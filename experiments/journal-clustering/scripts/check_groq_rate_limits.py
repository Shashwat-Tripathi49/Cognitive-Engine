import os
import json
import urllib.request
import urllib.error

def load_env():
    for path in [".env", "../.env", "../../.env", "../../../.env"]:
        p = os.path.abspath(path)
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                for l in f:
                    if l.strip() and not l.startswith("#") and "=" in l:
                        k, v = l.strip().split("=", 1)
                        os.environ[k.strip()] = v.strip().strip('"').strip("'")

load_env()
api_key = os.getenv("GROQ_API_KEY")

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json",
    "User-Agent": "CognitiveEngine-RateLimitCheck/1.0"
}

payload = {
    "model": "openai/gpt-oss-120b",
    "messages": [{"role": "user", "content": "ping"}],
    "max_tokens": 5
}

req = urllib.request.Request(
    "https://api.groq.com/openai/v1/chat/completions",
    data=json.dumps(payload).encode("utf-8"),
    headers=headers,
    method="POST"
)

print("=== GROQ RATE LIMIT DIAGNOSTIC ===")
try:
    with urllib.request.urlopen(req) as resp:
        print(f"HTTP Status: {resp.getcode()} OK")
        print("\n--- Rate Limit Headers ---")
        for k, v in resp.headers.items():
            if k.lower().startswith("x-ratelimit") or k.lower() in ("retry-after", "date"):
                print(f"  {k}: {v}")
        
        body = json.loads(resp.read().decode("utf-8"))
        print("\nResponse Received:")
        print(f"  Model: {body.get('model')}")
        print(f"  Content: {body['choices'][0]['message'].get('content')}")
        print("\n>> RATE LIMIT STATUS: ACTIVE & AVAILABLE (No 429 rate limit active)")
except urllib.error.HTTPError as e:
    print(f"HTTP Status: {e.code}")
    print("\n--- Rate Limit Headers from Error ---")
    for k, v in e.headers.items():
        if k.lower().startswith("x-ratelimit") or k.lower() in ("retry-after", "date"):
            print(f"  {k}: {v}")
    print(f"\nError Body: {e.read().decode('utf-8')}")
    if e.code == 429:
        print("\n>> RATE LIMIT STATUS: RATE LIMITED (Wait for reset)")
