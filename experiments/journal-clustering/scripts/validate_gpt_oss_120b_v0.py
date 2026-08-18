"""
Validation script for openai/gpt-oss-120b:
- Runs V0_Original prompt against 5 entries (entry_001, entry_005, entry_010, entry_020, entry_030).
- Tracks prompt_tokens, completion_tokens, reasoning_tokens, total_tokens, latency, and cost.
- Checks JSON parsing and verifies no reasoning leakage into content.
- Computes 500-call batch extrapolation (100 entries x 5 prompt variants).
"""

import os
import json
import time
import urllib.request
import urllib.error

# Pricing for openai/gpt-oss-120b on Groq:
PRICE_PER_M_INPUT = 0.15   # $0.15 per 1M prompt tokens
PRICE_PER_M_OUTPUT = 0.60  # $0.60 per 1M completion tokens (includes reasoning tokens)

PROMPT_V0_ORIGINAL = """Extract all named entities from the following journal entry.
Return a JSON object with this exact structure:
{{
  "entities": [
    {{"name": "entity name", "type": "Person|Project|Place|Organization|Tool|Topic|Goal"}}
  ]
}}
If no entities are found, return {{"entities": []}}.
Do not include any text outside the JSON object.

Journal entry:
"{text}"
"""

def load_env_file():
    for path in [".env", "../.env", "../../.env", "../../../.env", os.path.join(os.path.dirname(__file__), "../../../.env")]:
        abs_path = os.path.abspath(path)
        if os.path.exists(abs_path):
            with open(abs_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ[k.strip()] = v.strip().strip('"').strip("'")

load_env_file()
api_key = os.getenv("GROQ_API_KEY")

dataset_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../dataset/synthetic_journal_entries.json"))
with open(dataset_path, "r", encoding="utf-8") as f:
    dataset = json.load(f)

target_entry_ids = ["entry_001", "entry_005", "entry_010", "entry_020", "entry_030"]
selected_entries = [e for e in dataset if e["id"] in target_entry_ids]

print(f"Loaded {len(selected_entries)} target entries for validation.")

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json",
    "User-Agent": "CognitiveEngine-Validation/1.0"
}

results = []

for entry in selected_entries:
    prompt_text = PROMPT_V0_ORIGINAL.format(text=entry["text"])
    payload = {
        "model": "openai/gpt-oss-120b",
        "messages": [
            {"role": "user", "content": prompt_text}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.0,
        "max_tokens": 1024
    }

    start_time = time.time()
    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as resp:
            elapsed_ms = (time.time() - start_time) * 1000
            raw_body = resp.read().decode("utf-8")
            data = json.loads(raw_body)

            choice = data["choices"][0]
            msg = choice["message"]
            content = msg.get("content", "")
            reasoning = msg.get("reasoning", "")
            
            usage = data.get("usage", {})
            prompt_tokens = usage.get("prompt_tokens", 0)
            completion_tokens = usage.get("completion_tokens", 0)
            total_tokens = usage.get("total_tokens", 0)
            details = usage.get("completion_tokens_details", {})
            reasoning_tokens = details.get("reasoning_tokens", 0)

            # Cost calculation
            cost_input = (prompt_tokens / 1_000_000) * PRICE_PER_M_INPUT
            cost_output = (completion_tokens / 1_000_000) * PRICE_PER_M_OUTPUT
            total_cost = cost_input + cost_output

            # JSON Parsing verification
            json_parsed = False
            parse_error = None
            parsed_entities = []
            has_reasoning_leak = False

            try:
                parsed_json = json.loads(content)
                json_parsed = True
                parsed_entities = parsed_json.get("entities", [])
                
                # Check for reasoning leakage in content
                content_lower = content.lower()
                if "reasoning" in parsed_json or "thought" in parsed_json:
                    has_reasoning_leak = True
            except Exception as e:
                parse_error = str(e)

            result_entry = {
                "entry_id": entry["id"],
                "text_snippet": entry["text"][:60] + "...",
                "latency_ms": elapsed_ms,
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "reasoning_tokens": reasoning_tokens,
                "total_tokens": total_tokens,
                "cost_usd": total_cost,
                "json_parsed": json_parsed,
                "has_reasoning_leak": has_reasoning_leak,
                "entities_found_count": len(parsed_entities),
                "entities": parsed_entities,
                "content_raw": content,
                "reasoning_snippet": reasoning[:100] + "..." if reasoning else "N/A"
            }
            results.append(result_entry)
            print(f"[{entry['id']}] OK - {prompt_tokens} prompt + {completion_tokens} comp ({reasoning_tokens} reas) = {total_tokens} total | Cost: ${total_cost:.6f} | Latency: {elapsed_ms:.0f}ms")

    except urllib.error.HTTPError as e:
        print(f"[{entry['id']}] HTTP Error {e.code}: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"[{entry['id']}] Error: {e}")

    # Small pacing delay between calls
    time.sleep(0.5)

print("\n" + "="*80)
print("VALIDATION PASS SUMMARY FOR openai/gpt-oss-120b (V0_Original)")
print("="*80)

total_prompt = sum(r["prompt_tokens"] for r in results)
total_comp = sum(r["completion_tokens"] for r in results)
total_reas = sum(r["reasoning_tokens"] for r in results)
total_all = sum(r["total_tokens"] for r in results)
total_cost_5 = sum(r["cost_usd"] for r in results)
avg_latency = sum(r["latency_ms"] for r in results) / len(results) if results else 0

avg_prompt = total_prompt / len(results) if results else 0
avg_comp = total_comp / len(results) if results else 0
avg_reas = total_reas / len(results) if results else 0
avg_total = total_all / len(results) if results else 0
avg_cost_per_call = total_cost_5 / len(results) if results else 0

print(f"Tested Entries: {len(results)} / 5")
print(f"All JSON outputs parsed cleanly: {all(r['json_parsed'] for r in results)}")
print(f"Zero reasoning leakage into content: {all(not r['has_reasoning_leak'] for r in results)}")
print(f"\nPer-Call Averages:")
print(f"  - Prompt Tokens:     {avg_prompt:.1f}")
print(f"  - Completion Tokens: {avg_comp:.1f} (of which Reasoning Tokens: {avg_reas:.1f})")
print(f"  - Total Tokens:      {avg_total:.1f}")
print(f"  - Avg Latency:       {avg_latency:.1f} ms")
print(f"  - Avg Cost / Call:   ${avg_cost_per_call:.6f}")

print("\n" + "-"*80)
print("EXTRAPOLATION FOR FULL BATCH (100 Entries x 5 Variants = 500 Calls)")
print("-" * 80)

calls_500 = 500
extrapolated_prompt_tokens = avg_prompt * calls_500
extrapolated_completion_tokens = avg_comp * calls_500
extrapolated_total_tokens = avg_total * calls_500
extrapolated_cost = avg_cost_per_call * calls_500

# Pacing calculation:
# Groq rate limit: standard tiers are 30 RPM or 60 RPM.
# At safe pacing of 1 call every 1.5 seconds (40 RPM):
pacing_sec_per_call = 1.5
total_duration_sec = calls_500 * pacing_sec_per_call
total_duration_min = total_duration_sec / 60

print(f"Total API Calls:            {calls_500}")
print(f"Est. Total Prompt Tokens:   {extrapolated_prompt_tokens:,.0f}")
print(f"Est. Total Output Tokens:   {extrapolated_completion_tokens:,.0f} (includes reasoning)")
print(f"Est. Total Tokens:          {extrapolated_total_tokens:,.0f}")
print(f"Est. Total Batch Cost:      ${extrapolated_cost:.4f} USD")
print(f"Est. Batch Duration:        {total_duration_min:.1f} minutes (at {pacing_sec_per_call}s pacing)")

print("\nDetailed Per-Entry Results:")
for r in results:
    print(f"\n--- {r['entry_id']} ---")
    print(f"  Text: {r['text_snippet']}")
    print(f"  Tokens: {r['prompt_tokens']} prompt + {r['completion_tokens']} comp ({r['reasoning_tokens']} reasoning) = {r['total_tokens']} total")
    print(f"  Cost: ${r['cost_usd']:.6f} | Latency: {r['latency_ms']:.0f}ms")
    print(f"  JSON Parsed: {r['json_parsed']} | Reasoning Leak: {r['has_reasoning_leak']}")
    print(f"  Entities Extracted ({r['entities_found_count']}): {json.dumps(r['entities'])}")
    print(f"  Reasoning Snippet: {r['reasoning_snippet']}")

# Save results to json for reporting
output_json_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../results/gpt_oss_120b_v0_validation.json"))
with open(output_json_path, "w", encoding="utf-8") as f:
    json.dump({
        "pricing": {"input_per_m": PRICE_PER_M_INPUT, "output_per_m": PRICE_PER_M_OUTPUT},
        "per_call_averages": {
            "prompt_tokens": avg_prompt,
            "completion_tokens": avg_comp,
            "reasoning_tokens": avg_reas,
            "total_tokens": avg_total,
            "latency_ms": avg_latency,
            "cost_usd": avg_cost_per_call
        },
        "extrapolation_500_calls": {
            "total_calls": calls_500,
            "total_prompt_tokens": extrapolated_prompt_tokens,
            "total_completion_tokens": extrapolated_completion_tokens,
            "total_tokens": extrapolated_total_tokens,
            "total_cost_usd": extrapolated_cost,
            "duration_minutes": total_duration_min
        },
        "entries": results
    }, f, indent=2)

print(f"\nSaved validation results to: {output_json_path}")
