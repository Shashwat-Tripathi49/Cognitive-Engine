import json
import os
import sys

EXP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = os.path.join(EXP_DIR, "dataset", "synthetic_journal_entries.json")
RESULTS_DIR = os.path.join(EXP_DIR, "results")
os.makedirs(RESULTS_DIR, exist_ok=True)

with open(DATASET_PATH, "r", encoding="utf-8") as f:
    RAW_DATA = json.load(f)

def get_ground_truth_cluster(themes):
    for t in themes:
        if t in ["work", "fitness", "health", "family", "travel", "learning", "emotions", "routine"]:
            return t
    return "other"

def run_benchmark():
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.cluster import KMeans, DBSCAN
    from sklearn.metrics import silhouette_score, adjusted_rand_score
    import networkx as nx
    from networkx.algorithms.community import greedy_modularity_communities
    import numpy as np

    dataset_sizes = [20, 50, 100]
    benchmark_results = []

    print("=======================================================")
    print("EXPERIMENT 001 - TF-IDF & SCIKIT-LEARN CLUSTERING BENCHMARK")
    print("=======================================================\n")

    for n in dataset_sizes:
        subset = RAW_DATA[:n]
        texts = [d["text"] for d in subset]
        true_labels = [get_ground_truth_cluster(d["ground_truth_themes"]) for d in subset]
        label_map = {lbl: i for i, lbl in enumerate(set(true_labels))}
        true_numeric = [label_map[lbl] for lbl in true_labels]

        vectorizer = TfidfVectorizer(stop_words="english", max_df=0.85, min_df=1)
        X = vectorizer.fit_transform(texts).toarray()

        # 1. K-Means
        best_k = 2
        best_sil = -1.0
        best_km_labels = None
        for k in range(2, min(8, n // 2 + 1)):
            km = KMeans(n_clusters=k, random_state=42, n_init=10).fit(X)
            if 1 < len(set(km.labels_)) < n:
                sil = silhouette_score(X, km.labels_)
                if sil > best_sil:
                    best_sil = sil
                    best_k = k
                    best_km_labels = km.labels_

        km_ari = adjusted_rand_score(true_numeric, best_km_labels) if best_km_labels is not None else 0.0

        # 2. DBSCAN
        db = DBSCAN(eps=0.75, min_samples=2, metric="cosine").fit(X)
        db_labels = db.labels_
        db_n_clusters = len(set(db_labels)) - (1 if -1 in db_labels else 0)
        db_noise_pct = (list(db_labels).count(-1) / n) * 100.0
        db_sil = silhouette_score(X, db_labels) if 1 < len(set(db_labels)) < n else -1.0
        db_ari = adjusted_rand_score(true_numeric, db_labels)

        # 3. Graph Community Detection (NetworkX)
        sim_matrix = np.dot(X, X.T)
        G = nx.Graph()
        threshold = 0.35
        for i in range(n):
            G.add_node(i)
            for j in range(i + 1, n):
                if sim_matrix[i, j] >= threshold:
                    G.add_edge(i, j, weight=float(sim_matrix[i, j]))

        communities = list(greedy_modularity_communities(G))
        graph_labels = np.zeros(n, dtype=int)
        for c_idx, comm in enumerate(communities):
            for node in comm:
                graph_labels[node] = c_idx

        graph_n_clusters = len(communities)
        graph_sil = silhouette_score(X, graph_labels) if 1 < len(set(graph_labels)) < n else -1.0
        graph_ari = adjusted_rand_score(true_numeric, graph_labels)

        rec = {
            "dataset_size": n,
            "vocab_size": X.shape[1],
            "kmeans": {
                "clusters": best_k,
                "silhouette": round(float(best_sil), 4),
                "ari": round(float(km_ari), 4)
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
        benchmark_results.append(rec)
        print(f"[N={n:3d}] K-Means: k={best_k}, Sil={best_sil:.3f}, ARI={km_ari:.3f} | DBSCAN: k={db_n_clusters}, Noise={db_noise_pct:.1f}%, ARI={db_ari:.3f} | Graph: k={graph_n_clusters}, ARI={graph_ari:.3f}")

    out_file = os.path.join(RESULTS_DIR, "sklearn_benchmark_results.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(benchmark_results, f, indent=2)

    print(f"\nSaved sklearn benchmark results to {out_file}")

if __name__ == "__main__":
    run_benchmark()
