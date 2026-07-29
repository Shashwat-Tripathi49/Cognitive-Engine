import json
import os
import sys
import time
import numpy as np

# Ensure experiment paths
EXP_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(EXP_DIR, "dataset", "synthetic_journal_entries.json")
RESULTS_DIR = os.path.join(EXP_DIR, "results")
CHARTS_DIR = os.path.join(EXP_DIR, "charts")

os.makedirs(RESULTS_DIR, exist_ok=True)
os.makedirs(CHARTS_DIR, exist_ok=True)

with open(DATASET_PATH, "r", encoding="utf-8") as f:
    RAW_DATA = json.load(f)

print(f"Loaded {len(RAW_DATA)} synthetic entries for Experiment 001.")

def get_ground_truth_cluster(themes):
    # Primary ground truth category for evaluation
    for t in themes:
        if t in ["work", "fitness", "health", "family", "travel", "learning", "emotions", "routine"]:
            return t
    return "other"

def run_benchmark():
    try:
        from sentence_transformers import SentenceTransformer
        from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering
        from sklearn.metrics import silhouette_score, adjusted_rand_score
        import networkx as nx
        from networkx.algorithms.community import greedy_modularity_communities
    except ImportError as e:
        print(f"Missing package for benchmark execution: {e}")
        sys.exit(1)

    models_to_test = {
        "all-MiniLM-L6-v2": "sentence-transformers/all-MiniLM-L6-v2",
        "all-mpnet-base-v2": "sentence-transformers/all-mpnet-base-v2"
    }

    dataset_sizes = [20, 50, 100]
    benchmark_results = []

    print("\n=======================================================")
    print("🚀 EXPERIMENT 001 — JOURNAL CLUSTERING VALIDATION SPIKE")
    print("=======================================================\n")

    for model_name, model_path in models_to_test.items():
        print(f"--- Loading Embedding Model: {model_name} ---")
        t0 = time.time()
        model = SentenceTransformer(model_path)
        embed_time = time.time() - t0
        print(f"Loaded model in {embed_time:.2f}s.")

        all_texts = [d["text"] for d in RAW_DATA]
        t0 = time.time()
        all_embeddings = model.encode(all_texts, show_progress_bar=False, normalize_embeddings=True)
        gen_time = time.time() - t0
        print(f"Generated embeddings for {len(all_texts)} entries in {gen_time:.2f}s ({gen_time/len(all_texts)*1000:.2f}ms/entry).")

        for n in dataset_sizes:
            subset_data = RAW_DATA[:n]
            X = all_embeddings[:n]
            true_labels = [get_ground_truth_cluster(d["ground_truth_themes"]) for d in subset_data]
            label_map = {lbl: i for i, lbl in enumerate(set(true_labels))}
            true_numeric = [label_map[lbl] for lbl in true_labels]

            # 1. K-Means (Optimal k via Silhouette)
            best_k = 2
            best_sil = -1
            best_kmeans_labels = None
            for k in range(2, min(8, n // 2 + 1)):
                km = KMeans(n_clusters=k, random_state=42, n_init=10).fit(X)
                if len(set(km.labels_)) > 1:
                    sil = silhouette_score(X, km.labels_)
                    if sil > best_sil:
                        best_sil = sil
                        best_k = k
                        best_kmeans_labels = km.labels_

            kmeans_ari = adjusted_rand_score(true_numeric, best_kmeans_labels) if best_kmeans_labels is not None else 0

            # 2. DBSCAN / Density Clustering
            db = DBSCAN(eps=0.45, min_samples=2, metric="cosine").fit(X)
            db_labels = db.labels_
            db_n_clusters = len(set(db_labels)) - (1 if -1 in db_labels else 0)
            db_noise_pct = (list(db_labels).count(-1) / n) * 100
            db_sil = silhouette_score(X, db_labels) if db_n_clusters > 1 and len(set(db_labels)) > 1 else -1
            db_ari = adjusted_rand_score(true_numeric, db_labels)

            # 3. Graph Community Detection (Louvain / Greedy Modularity)
            adj = np.dot(X, X.T)
            G = nx.Graph()
            threshold = 0.50
            for i in range(n):
                G.add_node(i)
                for j in range(i + 1, n):
                    if adj[i, j] >= threshold:
                        G.add_edge(i, j, weight=float(adj[i, j]))

            communities = list(greedy_modularity_communities(G))
            graph_labels = np.zeros(n, dtype=int)
            for c_idx, comm in enumerate(communities):
                for node in comm:
                    graph_labels[node] = c_idx

            graph_n_clusters = len(communities)
            graph_sil = silhouette_score(X, graph_labels) if graph_n_clusters > 1 else -1
            graph_ari = adjusted_rand_score(true_numeric, graph_labels)

            res_record = {
                "model": model_name,
                "dataset_size": n,
                "kmeans": {
                    "clusters": best_k,
                    "silhouette": round(float(best_sil), 4),
                    "ari": round(float(kmeans_ari), 4)
                },
                "dbscan": {
                    "clusters": db_n_clusters,
                    "noise_pct": round(float(db_noise_pct), 2),
                    "silhouette": round(float(db_sil), 4),
                    "ari": round(float(db_ari), 4)
                },
                "graph_community": {
                    "clusters": graph_n_clusters,
                    "silhouette": round(float(graph_sil), 4),
                    "ari": round(float(graph_ari), 4)
                }
            }
            benchmark_results.append(res_record)

            print(f"[{model_name} | N={n:3d}] K-Means: k={best_k}, Sil={best_sil:.3f}, ARI={kmeans_ari:.3f} | DBSCAN: k={db_n_clusters}, Noise={db_noise_pct:.1f}%, ARI={db_ari:.3f} | Graph: k={graph_n_clusters}, ARI={graph_ari:.3f}")

    out_res = os.path.join(RESULTS_DIR, "benchmark_results.json")
    with open(out_res, "w", encoding="utf-8") as f:
        json.dump(benchmark_results, f, indent=2)

    print(f"\nSaved benchmark results to {out_res}")

if __name__ == "__main__":
    run_benchmark()
