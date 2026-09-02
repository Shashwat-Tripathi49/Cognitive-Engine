/**
 * Centralized, versioned configuration snapshot for Cognitive Engine discovery
 */
export interface CognitiveConfigSnapshot {
  readonly version: string;
  readonly minRecurrenceFragments: number;           // Default: 2 (Minimum distinct fragments for RECURRING_TOPIC_FOCUS)
  readonly recurrenceTargetSaturation: number;       // Default: 4 (Fragment count at which confidence saturates)
  readonly maxSequenceGapHours: number;              // Default: 72 (Maximum hours between sequential event pairs)
  readonly minSequenceOccurrences: number;           // Default: 2 (Minimum chronological transitions for TEMPORAL_SEQUENCE)
  readonly clusterCosineSimilarityThreshold: number; // Default: 0.82 (Similarity graph edge cutoff)
  readonly clusterMinCohesionThreshold: number;      // Default: 0.75 (Minimum average pairwise cosine cohesion)
  readonly minClusterSize: number;                   // Default: 3 (Minimum memory nodes in a cluster)
  readonly minCoOccurrenceCount: number;             // Default: 2 (Minimum distinct fragments for COLLABORATION_PATTERN)
}

export const DEFAULT_COGNITIVE_CONFIG: CognitiveConfigSnapshot = {
  version: '1.0.0',
  minRecurrenceFragments: 2,
  recurrenceTargetSaturation: 4,
  maxSequenceGapHours: 72,
  minSequenceOccurrences: 2,
  clusterCosineSimilarityThreshold: 0.82,
  clusterMinCohesionThreshold: 0.75,
  minClusterSize: 3,
  minCoOccurrenceCount: 2,
} as const;
