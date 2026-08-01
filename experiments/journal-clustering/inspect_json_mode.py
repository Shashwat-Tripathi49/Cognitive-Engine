import json
import os
import sys
import requests

sys.stdout.reconfigure(encoding='utf-8')
GROQ_API_KEY = os.environ.get('testkey', '')
dataset = json.load(open('experiments/journal-clustering/dataset/synthetic_journal_entities_ground_truth.json'))

prompt = """Extract named entities from the following journal entry. Return a JSON object with key 'entities': [{"name": "...", "type": "..."}]. If no entities exist, return {"entities": []}.

Journal entry: "{text}"
"""

for entry in dataset[:10]:
    resp = requests.post(
        'https://api.groq.com/openai/v1/chat/completions', 
        headers={'Authorization': f'Bearer {GROQ_API_KEY}', 'Content-Type': 'application/json'},
        json={
            'model': 'llama-3.3-70b-versatile', 
            'messages': [{'role': 'user', 'content': prompt.replace('{text}', entry['text'])}], 
            'response_format': {'type': 'json_object'}, 
            'temperature': 0.0
        }
    )
    res_data = resp.json()
    raw = res_data['choices'][0]['message']['content']
    print(f"Entry {entry['id']}: GT={len(entry['entities'])}")
    print(f"  Raw response: {raw}")
    try:
        data = json.loads(raw)
        print(f"  Parsed keys: {list(data.keys())}")
    except Exception as e:
        print(f"  Parse error: {e}")
