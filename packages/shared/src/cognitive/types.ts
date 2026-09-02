import { CandidateFinding } from '../reasoning/types.js';
import { CognitiveConfigSnapshot } from './config.js';

/**
 * Structured dataset passed to Cognitive Engine detectors
 */
export interface CognitiveDiscoveryContext {
  userId: string;
  evaluationTimestamp: Date;
  config: CognitiveConfigSnapshot;
  fragments: {
    id: string;
    content: string;
    contentHash: string;
    capturedAt: Date;
    memoryId?: string | null;
  }[];
  memories: {
    id: string;
    content: string;
    embedding?: number[];
    createdAt: Date;
    metadata?: unknown;
  }[];
  entities: {
    id: string;
    canonicalName: string;
    entityType: string;
    status: string;
    aliases: string[];
    createdAt: Date;
  }[];
  provenance: {
    id: string;
    canonicalId: string;
    sourceFragmentId: string;
    sourceContentHash: string;
    sourceMention: string;
    confidence: number;
    resolvedAt: Date;
  }[];
  relationships: {
    id: string;
    sourceEntityId: string;
    targetEntityId: string;
    relationType: string;
    status: string;
    confidence: number;
    evidenceCount: number;
    sourceFragmentId?: string | null;
    sourceContentHash?: string | null;
    assertedAt: Date;
    validAt: Date;
  }[];
}

/**
 * Abstract interface for a deterministic discovery detector
 */
export interface ICognitiveDetector {
  readonly detectorId: string;
  readonly detectorVersion: string;
  discover(context: CognitiveDiscoveryContext): Promise<CandidateFinding[]>;
}

/**
 * Upstream data reader interface to retrieve records across Capture, Memory, and KG
 */
export interface ICognitiveDataProvider {
  getDiscoveryContext(
    userId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      evaluationTimestamp?: Date;
      config?: CognitiveConfigSnapshot;
    }
  ): Promise<CognitiveDiscoveryContext>;
}

/**
 * Discovery execution options
 */
export interface DiscoverOptions {
  startDate?: Date;
  endDate?: Date;
  evaluationTimestamp?: Date;
  config?: Partial<CognitiveConfigSnapshot>;
  detectorIds?: string[];
  persistFindings?: boolean;
}

/**
 * Summary result of a discovery pass
 */
export interface DiscoveryResult {
  userId: string;
  evaluationTimestamp: Date;
  configSnapshot: CognitiveConfigSnapshot;
  findings: CandidateFinding[];
  metrics: {
    totalFindings: number;
    byType: Record<string, number>;
    durationMs: number;
  };
}
