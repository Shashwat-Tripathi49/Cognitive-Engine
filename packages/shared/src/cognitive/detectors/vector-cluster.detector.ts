import crypto from 'crypto';
import { CandidateFinding } from '../../reasoning/types.js';
import { ICognitiveDetector, CognitiveDiscoveryContext } from '../types.js';

function computeCosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Deterministic Vector Clusterer (COGNITIVE_CLUSTER)
 *
 * Implements Option B: Order-Independent Connected Components Clustering over a thresholded Similarity Graph.
 */
export class DeterministicVectorClusterer implements ICognitiveDetector {
  readonly detectorId = 'vector-cluster-detector';
  readonly detectorVersion = '1.0.0';

  async discover(context: CognitiveDiscoveryContext): Promise<CandidateFinding[]> {
    const { userId, config, memories, fragments, evaluationTimestamp } = context;
    const findings: CandidateFinding[] = [];

    // Filter valid memories with embeddings within evaluation window
    const validMemories = memories
      .filter((m) => m.embedding && m.embedding.length > 0 && m.createdAt <= evaluationTimestamp)
      .sort((a, b) => {
        const timeDiff = a.createdAt.getTime() - b.createdAt.getTime();
        return timeDiff !== 0 ? timeDiff : a.id.localeCompare(b.id);
      });

    if (validMemories.length < config.minClusterSize) {
      return findings;
    }

    const n = validMemories.length;
    const adj = new Map<number, number[]>();
    for (let i = 0; i < n; i++) {
      adj.set(i, []);
    }

    // Pairwise similarity cache for fast cohesion computation
    const simMatrix = new Map<string, number>();

    // 1. Build Undirected Similarity Graph
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const sim = computeCosineSimilarity(
          validMemories[i].embedding!,
          validMemories[j].embedding!
        );
        simMatrix.set(`${i}:${j}`, sim);
        simMatrix.set(`${j}:${i}`, sim);

        if (sim >= config.clusterCosineSimilarityThreshold) {
          adj.get(i)!.push(j);
          adj.get(j)!.push(i);
        }
      }
    }

    // 2. Extract Connected Components via BFS
    const visited = new Uint8Array(n);
    const components: number[][] = [];

    for (let i = 0; i < n; i++) {
      if (visited[i]) continue;

      const comp: number[] = [];
      const queue: number[] = [i];
      visited[i] = 1;

      while (queue.length > 0) {
        const curr = queue.shift()!;
        comp.push(curr);

        const neighbors = adj.get(curr) || [];
        // Sort neighbors for deterministic traversal
        neighbors.sort((a, b) => a - b);

        for (const nbr of neighbors) {
          if (!visited[nbr]) {
            visited[nbr] = 1;
            queue.push(nbr);
          }
        }
      }

      // Sort component members deterministically
      comp.sort((a, b) => a - b);
      components.push(comp);
    }

    // Sort components by first member index for deterministic cluster order
    components.sort((a, b) => a[0] - b[0]);

    // Map fragment lookup for provenance
    const fragmentMap = new Map<string, (typeof fragments)[0]>();
    for (const f of fragments) {
      fragmentMap.set(f.id, f);
      if (f.memoryId) {
        fragmentMap.set(f.memoryId, f);
      }
    }

    // 3. Process Qualifying Components
    for (const compIndices of components) {
      const clusterSize = compIndices.length;

      // Multiplicity check: minimum cluster size
      if (clusterSize < config.minClusterSize) {
        continue;
      }

      // Compute exact pairwise cohesion score
      let pairSimSum = 0;
      let pairCount = 0;

      for (let a = 0; a < clusterSize; a++) {
        for (let b = a + 1; b < clusterSize; b++) {
          const idxA = compIndices[a];
          const idxB = compIndices[b];
          const sim = simMatrix.get(`${idxA}:${idxB}`) ?? 0;
          pairSimSum += sim;
          pairCount++;
        }
      }

      const avgCohesion = pairCount > 0 ? pairSimSum / pairCount : 0;

      // Negative guard: minimum cohesion threshold
      if (avgCohesion < config.clusterMinCohesionThreshold) {
        continue;
      }

      const memberMemories = compIndices.map((idx) => validMemories[idx]);
      const memoryIds = memberMemories.map((m) => m.id);

      // Collect provenance references
      const provMap = new Map<string, { fragmentId: string; contentHash: string; capturedAt: Date }>();
      for (const m of memberMemories) {
        const frag = fragmentMap.get(m.id);
        if (frag) {
          provMap.set(frag.id, {
            fragmentId: frag.id,
            contentHash: frag.contentHash,
            capturedAt: frag.capturedAt,
          });
        }
      }

      const provRefs = Array.from(provMap.values()).sort(
        (a, b) => a.capturedAt.getTime() - b.capturedAt.getTime()
      );

      const timestamps = memberMemories.map((m) => m.createdAt.getTime());
      const startDate = new Date(Math.min(...timestamps));
      const endDate = new Date(Math.max(...timestamps));

      const cohesionScore = Math.round(avgCohesion * 10000) / 10000;
      const discoveryConfidence = Math.min(1.0, cohesionScore);

      const summary = `Vector cluster [${clusterSize} memories, cohesion: ${cohesionScore.toFixed(3)}]`;
      const statement = `Vector cluster identified comprising ${clusterSize} memory nodes with average pairwise cosine cohesion of ${cohesionScore.toFixed(3)}.`;

      findings.push({
        id: crypto.randomUUID(),
        userId,
        findingType: 'COGNITIVE_CLUSTER',
        summary,
        statement,
        involvedEntityIds: [],
        involvedMemoryIds: memoryIds,
        involvedRelationshipIds: [],
        temporalScope: {
          startDate,
          endDate,
        },
        deterministicMetrics: {
          distinctFragmentCount: provRefs.length,
          clusterSize,
          cohesionScore,
        },
        discoveryAlgorithm: this.detectorId,
        discoveryVersion: this.detectorVersion,
        discoveryConfidence,
        provenanceReferences: provRefs,
        metadata: {
          configSnapshot: config,
        },
      });
    }

    return findings;
  }
}
