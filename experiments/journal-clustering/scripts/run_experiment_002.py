import json
import os
import sys
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans, DBSCAN
from sklearn.metrics import silhouette_score, adjusted_rand_score
import networkx as nx
from networkx.algorithms.community import greedy_modularity_communities

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

def run_experiment_002():
    print("=======================================================")
    print("EXPERIMENT 002 - SEMANTIC EMBEDDING CLUSTERING VALIDATION")
    print("Embedding Model: sentence-transformers/all-MiniLM-L6-v2 (384D)")
    print("=======================================================\n")

    model = SentenceTransformer("all-MiniLM-L6-v2")
    all_texts = [d["text"] for d in RAW_DATA]
    all_embeddings = model.encode(all_texts, show_progress_bar=False, normalize_embeddings=True)

    dataset_sizes = [20, 50, 100]
    num_trials = 3
    results_by_size = {}

    for n in dataset_sizes:
        print(f"--- Running 3 Trials for Dataset Size N = {n} ---")
        trial_metrics = {
            "kmeans": {"ari": [], "sil": [], "k": []},
            "dbscan": {"ari": [], "sil": [], "k": [], "noise": []},
            "graph": {"ari": [], "sil": [], "k": []}
        }

        for trial in range(num_trials):
            np.random.seed(42 + trial)
            indices = np.random.choice(len(RAW_DATA), size=n, replace=False)
            subset = [RAW_DATA[i] for i in indices]
            X = all_embeddings[indices]
            true_labels = [get_ground_truth_cluster(d["ground_truth_themes"]) for d in subset]
            label_map = {lbl: i for i, lbl in enumerate(set(true_labels))}
            true_numeric = [label_map[lbl] for lbl in true_labels]

            # 1. K-Means
            best_k = 2
            best_sil = -1.0
            best_km_labels = None
            for k in range(2, min(8, n // 2 + 1)):
                km = KMeans(n_clusters=k, random_state=42 + trial, n_init=10).fit(X)
                if 1 < len(set(km.labels_)) < n:
                    sil = silhouette_score(X, km.labels_)
                    if sil > best_sil:
                        best_sil = sil
                        best_k = k
                        best_km_labels = km.labels_

            km_ari = adjusted_rand_score(true_numeric, best_km_labels) if best_km_labels is not None else 0.0
            trial_metrics["kmeans"]["ari"].append(km_ari)
            trial_metrics["kmeans"]["sil"].append(best_sil)
            trial_metrics["kmeans"]["k"].append(best_k)

            # 2. DBSCAN (eps = 0.45 from k-distance elbow analysis)
            db = DBSCAN(eps=0.45, min_samples=2, metric="cosine").fit(X)
            db_labels = db.labels_
            db_n_clusters = len(set(db_labels)) - (1 if -1 in db_labels else 0)
            db_noise_pct = (list(db_labels).count(-1) / n) * 100.0
            db_sil = silhouette_score(X, db_labels) if 1 < len(set(db_labels)) < n else -1.0
            db_ari = adjusted_rand_score(true_numeric, db_labels)

            trial_metrics["dbscan"]["ari"].append(db_ari)
            trial_metrics["dbscan"]["sil"].append(db_sil)
            trial_metrics["dbscan"]["k"].append(db_n_clusters)
            trial_metrics["dbscan"]["noise"].append(db_noise_pct)

            # 3. Graph Community Detection (Threshold t = 0.35)
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

            trial_metrics["graph"]["ari"].append(graph_ari)
            trial_metrics["graph"]["sil"].append(graph_sil)
            trial_metrics["graph"]["k"].append(graph_n_clusters)

        # Aggregate metrics for size N
        summary = {
            "dataset_size": n,
            "kmeans": {
                "ari_mean": round(float(np.mean(trial_metrics["kmeans"]["ari"])), 4),
                "ari_min": round(float(np.min(trial_metrics["kmeans"]["ari"])), 4),
                "ari_max": round(float(np.max(trial_metrics["kmeans"]["ari"])), 4),
                "sil_mean": round(float(np.mean(trial_metrics["kmeans"]["sil"])), 4),
                "k_mean": round(float(np.mean(trial_metrics["kmeans"]["k"])), 1)
            },
            "dbscan": {
                "ari_mean": round(float(np.mean(trial_metrics["dbscan"]["ari"])), 4),
                "ari_min": round(float(np.min(trial_metrics["dbscan"]["ari"])), 4),
                "ari_max": round(float(np.max(trial_metrics["dbscan"]["ari"])), 4),
                "sil_mean": round(float(np.mean(trial_metrics["dbscan"]["sil"])), 4),
                "k_mean": round(float(np.mean(trial_metrics["dbscan"]["k"])), 1),
                "noise_pct_mean": round(float(np.mean(trial_metrics["dbscan"]["noise"])), 2)
            },
            "graph_community": {
                "ari_mean": round(float(np.mean(trial_metrics["graph"]["ari"])), 4),
                "ari_min": round(float(np.min(trial_metrics["graph"]["ari"])), 4),
                "ari_max": round(float(np.max(trial_metrics["graph"]["ari"])), 4),
                "sil_mean": round(float(np.mean(trial_metrics["graph"]["sil"])), 4),
                "k_mean": round(float(np.mean(trial_metrics["graph"]["k"])), 1)
            }
        }
        results_by_size[f"N_{n}"] = summary
        print(f"[N={n:3d}] K-Means ARI Mean: {summary['kmeans']['ari_mean']:.4f} (Min: {summary['kmeans']['ari_min']:.4f}, Max: {summary['kmeans']['ari_max']:.4f})")
        print(f"[N={n:3d}] DBSCAN ARI Mean: {summary['dbscan']['ari_mean']:.4f}, Noise Mean: {summary['dbscan']['noise_pct_mean']:.1f}%")
        print(f"[N={n:3d}] Graph ARI Mean: {summary['graph_community']['ari_mean']:.4f}")

    out_file = os.path.join(RESULTS_DIR, "experiment_002_semantic_results.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(results_by_size, f, indent=2)

    print(f"\nSaved Experiment 002 semantic benchmark results to {out_file}")

if __name__ == "__main__":
    run_experiment_002()
