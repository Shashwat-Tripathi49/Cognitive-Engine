import fs from 'fs';
import path from 'path';

interface DatasetEntry {
  id: string;
  date: string;
  text: string;
  ground_truth_themes: string[];
  sentiment: string;
}

const datasetPath = path.join(
  __dirname,
  '../dataset/synthetic_journal_entries.json'
);
const resultsDir = path.join(__dirname, '../results');

if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

const rawData: DatasetEntry[] = JSON.parse(
  fs.readFileSync(datasetPath, 'utf8')
);

// Tokenize text into normalized term frequencies (TF-IDF vector representation)
function buildVocabulary(docs: string[]): string[] {
  const vocabSet = new Set<string>();
  const stopWords = new Set([
    'a',
    'an',
    'the',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'from',
    'is',
    'was',
    'were',
    'be',
    'been',
    'it',
    'this',
    'that',
    'my',
    'i',
    'we',
    'our',
  ]);

  docs.forEach((doc) => {
    const tokens = doc
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/);
    tokens.forEach((t) => {
      if (t.length > 2 && !stopWords.has(t)) {
        vocabSet.add(t);
      }
    });
  });

  return Array.from(vocabSet);
}

function computeTfIdf(
  docs: string[],
  vocab: string[]
): number[][] {
  const numDocs = docs.length;
  const vocabIndexMap = new Map<string, number>();
  vocab.forEach((term, idx) => vocabIndexMap.set(term, idx));

  // Compute Document Frequency (DF)
  const df = new Array(vocab.length).fill(0);
  const docTokensList = docs.map((doc) => {
    const tokens = doc
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/);
    const uniqueTokens = new Set(tokens);
    uniqueTokens.forEach((t) => {
      const idx = vocabIndexMap.get(t);
      if (idx !== undefined) {
        df[idx]++;
      }
    });
    return tokens;
  });

  // Compute TF-IDF Vectors
  return docTokensList.map((tokens) => {
    const vector = new Array(vocab.length).fill(0);
    const tf = new Map<string, number>();
    tokens.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));

    tf.forEach((count, term) => {
      const idx = vocabIndexMap.get(term);
      if (idx !== undefined) {
        const tfVal = count / tokens.length;
        const idfVal = Math.log((1 + numDocs) / (1 + df[idx])) + 1;
        vector[idx] = tfVal * idfVal;
      }
    });

    // L2 Normalize
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    return norm > 0 ? vector.map((v) => v / norm) : vector;
  });
}

function cosineSimilarity(v1: number[], v2: number[]): number {
  let dot = 0;
  for (let i = 0; i < v1.length; i++) {
    dot += v1[i] * v2[i];
  }
  return dot;
}

// Simple K-Means implementation
function kMeans(
  vectors: number[][],
  k: number,
  maxIterations = 20
): { labels: number[]; centroids: number[][] } {
  const n = vectors.length;
  const dim = vectors[0].length;

  // Initialize centroids deterministically
  const centroids: number[][] = [];
  const step = Math.floor(n / k);
  for (let i = 0; i < k; i++) {
    centroids.push([...vectors[(i * step) % n]]);
  }

  let labels = new Array(n).fill(0);

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign clusters
    let changed = false;
    for (let i = 0; i < n; i++) {
      let maxSim = -Infinity;
      let bestCluster = 0;
      for (let c = 0; c < k; c++) {
        const sim = cosineSimilarity(vectors[i], centroids[c]);
        if (sim > maxSim) {
          maxSim = sim;
          bestCluster = c;
        }
      }
      if (labels[i] !== bestCluster) {
        labels[i] = bestCluster;
        changed = true;
      }
    }

    if (!changed) break;

    // Update centroids
    for (let c = 0; c < k; c++) {
      const clusterMembers = vectors.filter((_, idx) => labels[idx] === c);
      if (clusterMembers.length > 0) {
        const newCentroid = new Array(dim).fill(0);
        clusterMembers.forEach((vec) => {
          for (let d = 0; d < dim; d++) {
            newCentroid[d] += vec[d];
          }
        });
        const norm = Math.sqrt(
          newCentroid.reduce((sum, v) => sum + v * v, 0)
        );
        centroids[c] =
          norm > 0 ? newCentroid.map((v) => v / norm) : newCentroid;
      }
    }
  }

  return { labels, centroids };
}

// Simple Cosine Distance Threshold Clustering (Density/Graph Approximation)
function thresholdClustering(
  vectors: number[][],
  threshold = 0.45
): { labels: number[]; noiseCount: number } {
  const n = vectors.length;
  const labels = new Array(n).fill(-1);
  let currentCluster = 0;

  for (let i = 0; i < n; i++) {
    if (labels[i] !== -1) continue;

    const neighbors: number[] = [];
    for (let j = 0; j < n; j++) {
      if (i !== j && cosineSimilarity(vectors[i], vectors[j]) >= threshold) {
        neighbors.push(j);
      }
    }

    if (neighbors.length >= 1) {
      labels[i] = currentCluster;
      neighbors.forEach((nbr) => {
        if (labels[nbr] === -1) {
          labels[nbr] = currentCluster;
        }
      });
      currentCluster++;
    }
  }

  const noiseCount = labels.filter((l) => l === -1).length;
  return { labels, noiseCount };
}

function runBenchmarkNode() {
  console.log('=======================================================');
  console.log('⚡ EXPERIMENT 001 — NODE.JS CLUSTERING BENCHMARK');
  console.log('=======================================================\n');

  const datasetSizes = [20, 50, 100];
  const results = [];

  for (const n of datasetSizes) {
    const subset = rawData.slice(0, n);
    const docs = subset.map((d) => d.text);
    const vocab = buildVocabulary(docs);
    const vectors = computeTfIdf(docs, vocab);

    // Run K-Means (k = Math.min(6, n / 4))
    const targetK = Math.max(2, Math.min(6, Math.floor(n / 5)));
    const kmRes = kMeans(vectors, targetK);

    // Run Threshold Clustering
    const threshRes = thresholdClustering(vectors, 0.40);
    const numClusters = new Set(threshRes.labels.filter((l) => l !== -1)).size;
    const noisePct = ((threshRes.noiseCount / n) * 100).toFixed(1);

    console.log(
      `[Node.js | N=${n.toString().padStart(3, ' ')}] K-Means (k=${targetK}): ${kmRes.centroids.length} centroids | Threshold Cluster: ${numClusters} clusters, Noise: ${noisePct}%`
    );

    results.push({
      dataset_size: n,
      vocab_size: vocab.length,
      kmeans: { clusters: targetK },
      threshold_clustering: {
        clusters: numClusters,
        noise_pct: parseFloat(noisePct),
      },
    });
  }

  fs.writeFileSync(
    path.join(resultsDir, 'node_benchmark_results.json'),
    JSON.stringify(results, null, 2)
  );

  console.log('\n✅ Node.js benchmark completed successfully.');
}

runBenchmarkNode();
