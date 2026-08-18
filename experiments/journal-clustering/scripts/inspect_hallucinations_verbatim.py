import json
import os
import urllib.request

PROMPT_V3_CONFIDENCE = """Extract named entities from the following journal entry. For each entity, assign a confidence level:

- HIGH: The entity's exact proper name appears explicitly in the text.
- MEDIUM: The entity is strongly implied by specific keywords (e.g., "budgeting module" implies a finance project).
- LOW: The entity is vaguely referenced or requires inference (e.g., "the project", "he").

Entity types: Person, Project, Place, Organization, Tool, Topic, Goal.

Return a JSON object with key "entities": [{"name": "...", "type": "...", "confidence": "HIGH|MEDIUM|LOW"}].
If no entities are found, return {"entities": []}.

Journal entry:
"{text}"
"""

def load_env():
    for path in [".env", "../../../.env"]:
        p = os.path.abspath(path)
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                for l in f:
                    if l.strip() and not l.startswith("#") and "=" in l:
                        k, v = l.strip().split("=", 1)
                        os.environ[k.strip()] = v.strip().strip('"').strip("'")

load_env()
api_key = os.getenv("GROQ_API_KEY")

with open("experiments/journal-clustering/dataset/synthetic_journal_entities_ground_truth.json", "r", encoding="utf-8") as f:
    dataset = json.load(f)

entry_map = {e["id"]: e for e in dataset}

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json",
    "User-Agent": "CognitiveEngine-Audit/1.0"
}

def is_hallucinated(pred_name, text):
    p_lower = pred_name.lower().strip()
    t_lower = text.lower()
    if p_lower in t_lower:
        return False
    parts = [w for w in p_lower.split() if len(w) > 2]
    if any(part in t_lower for part in parts):
        return False
    return True

target_ids = ["entry_016", "entry_040", "entry_075", "entry_099"]

for eid in target_ids:
    e = entry_map[eid]
    ptext = PROMPT_V3_CONFIDENCE.replace("{text}", e["text"])
    payload = {
        "model": "openai/gpt-oss-120b",
        "messages": [{"role": "user", "content": ptext}],
        "response_format": {"type": "json_object"},
        "temperature": 0.0,
        "max_tokens": 512
    }
    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            ents = parsed.get("entities", [])
            print(f"\n=======================================================")
            print(f"ENTRY: {eid}")
            print(f"Source Text: \"{e['text']}\"")
            print(f"Extracted Entities ({len(ents)}):")
            for ent in ents:
                hal = is_hallucinated(ent["name"], e["text"])
                print(f"  - Name: \"{ent['name']}\" | Type: {ent['type']} | Confidence: {ent.get('confidence')} | Hallucinated: {hal}")
    except Exception as exc:
        print(f"Error for {eid}: {exc}")
