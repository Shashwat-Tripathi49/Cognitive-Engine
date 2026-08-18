import json

with open("experiments/journal-clustering/results/experiment_003a_gpt_oss_120b_results.json", "r", encoding="utf-8") as f:
    gpt = json.load(f)

with open("experiments/journal-clustering/results/experiment_003a_results.json", "r", encoding="utf-8") as f:
    llama = json.load(f)

print("=== GPT-OSS 120B RESULTS SUMMARY (4 COMPLETED VARIANTS) ===")
for vname, vdata in gpt["variant_results"].items():
    ex = vdata["exact_span_matching"]
    al = vdata["alias_aware_matching"]
    tel = vdata["telemetry"]
    print(f"\n[{vname}]")
    print(f"  Exact Span:  P = {ex['precision']*100:.2f}%, R = {ex['recall']*100:.2f}%, F1 = {ex['f1']*100:.2f}% (TP={ex['tp']}, FP={ex['fp']}, FN={ex['fn']})")
    print(f"  Alias Aware: P = {al['precision']*100:.2f}%, R = {al['recall']*100:.2f}%, F1 = {al['f1']*100:.2f}% (TP={al['tp']}, FP={al['fp']}, FN={al['fn']})")
    print(f"  Hallucination Rate: {al['hallucination_rate']*100:.2f}% ({al.get('hallucinations_count', 0)} hallucinations)")
    print(f"  Telemetry: {tel['prompt_tokens_total']:,} prompt + {tel['completion_tokens_total']:,} comp ({tel['reasoning_tokens_total']:,} reas, {tel['reasoning_fraction_of_completion']*100:.1f}%) = {tel['total_tokens']:,} total")
    print(f"  Avg Reasoning Tokens/Call: {tel['avg_reasoning_tokens_per_call']:.1f}")
    print(f"  Avg Latency: {vdata['avg_latency_ms']:.1f} ms | Cost: ${tel['cost_usd']:.4f}")
    print(f"  API Failures: {vdata['api_failures_count']} | Malformed JSON: {vdata['malformed_json_count']} | Schema Failures: {vdata['schema_failures_count']}")

print("\n=== SIDE-BY-SIDE COMPARISON WITH LLAMA 3.3 70B ===")
print(f"{'Variant':<22} | {'Model':<18} | {'Exact F1':<9} | {'Alias F1':<9} | {'Precision':<9} | {'Recall':<9} | {'Cost (USD)':<10}")
print("-" * 105)
for vname in ["V0_Original", "V1_Exhaustive", "V2_Conservative", "V3_Confidence_All"]:
    g_v = gpt["variant_results"].get(vname, {})
    l_v = llama["variant_results"].get(vname, {})

    g_al = g_v.get("alias_aware_matching", {})
    l_al = l_v.get("alias_aware_matching", {})
    g_ex = g_v.get("exact_span_matching", {})
    l_ex = l_v.get("exact_span_matching", {})

    print(f"{vname:<22} | {'Llama 3.3 70B':<18} | {l_ex.get('f1',0)*100:6.2f}%   | {l_al.get('f1',0)*100:6.2f}%   | {l_al.get('precision',0)*100:6.2f}%   | {l_al.get('recall',0)*100:6.2f}%   | ${l_v.get('total_cost_usd',0):.4f}")
    print(f"{'':<22} | {'GPT-OSS 120B':<18} | {g_ex.get('f1',0)*100:6.2f}%   | {g_al.get('f1',0)*100:6.2f}%   | {g_al.get('precision',0)*100:6.2f}%   | {g_al.get('recall',0)*100:6.2f}%   | ${g_v.get('telemetry',{}).get('cost_usd',0):.4f}")
    print("-" * 105)
