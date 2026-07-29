import sys
import numpy as np

def verify_sentence_transformers():
    print("=======================================================")
    print("TASK 1 & 2: EMBEDDING MODEL SANITY CHECK (PYTHON)")
    print("Model: sentence-transformers/all-MiniLM-L6-v2 (384 dimensions)")
    print("=======================================================\n")

    try:
        from sentence_transformers import SentenceTransformer
    except ImportError as e:
        print(f"FAILED to import sentence_transformers: {e}")
        sys.exit(1)

    print("--> Loading all-MiniLM-L6-v2 model checkpoint...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    print("SUCCESS: Model loaded successfully.")

    group_a = [
        "Worked on the Expense Tracker.",
        "Continued improving the budgeting module.",
        "Spent time debugging the finance app."
    ]

    group_b = [
        "Went running before breakfast.",
        "Cooked dinner for family.",
        "Visited my parents for lunch."
    ]

    def cosine_sim(v1, v2):
        return float(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2)))

    embeds_a = model.encode(group_a, normalize_embeddings=True)
    embeds_b = model.encode(group_b, normalize_embeddings=True)

    print("\n--- Group A Intra-Similarity (Paraphrases) ---")
    sim_a1_a2 = cosine_sim(embeds_a[0], embeds_a[1])
    sim_a1_a3 = cosine_sim(embeds_a[0], embeds_a[2])
    sim_a2_a3 = cosine_sim(embeds_a[1], embeds_a[2])

    print(f'"{group_a[0]}" <-> "{group_a[1]}": Cosine Sim = {sim_a1_a2:.4f}')
    print(f'"{group_a[0]}" <-> "{group_a[2]}": Cosine Sim = {sim_a1_a3:.4f}')
    print(f'"{group_a[1]}" <-> "{group_a[2]}": Cosine Sim = {sim_a2_a3:.4f}')
    avg_intra_a = (sim_a1_a2 + sim_a1_a3 + sim_a2_a3) / 3.0
    print(f"--> Average Paraphrase Intra-Similarity: {avg_intra_a:.4f}")

    print("\n--- Group A vs Group B Inter-Similarity (Unrelated) ---")
    inter_sims = []
    for i in range(len(group_a)):
        for j in range(len(group_b)):
            sim = cosine_sim(embeds_a[i], embeds_b[j])
            inter_sims.append(sim)
            print(f'"{group_a[i]}" <-> "{group_b[j]}": Cosine Sim = {sim:.4f}')

    avg_inter = float(np.mean(inter_sims))
    print(f"--> Average Inter-Group Similarity: {avg_inter:.4f}")

    print("\n=======================================================")
    print("SANITY CHECK VERDICT:")
    margin = avg_intra_a - avg_inter
    if avg_intra_a > avg_inter + 0.30:
        print(f"PASSED: Paraphrases exhibit high semantic similarity ({avg_intra_a:.4f}) while unrelated entries exhibit low similarity ({avg_inter:.4f}). Margin = {margin:.4f}.")
    else:
        print(f"FAILED: Embeddings failed to separate semantic paraphrases from unrelated text. Margin = {margin:.4f}.")
        sys.exit(1)
    print("=======================================================\n")

if __name__ == "__main__":
    verify_sentence_transformers()
