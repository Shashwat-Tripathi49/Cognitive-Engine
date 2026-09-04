export type ReflectionType =
  | 'TOPIC_FOCUS_REFLECTION'
  | 'TEMPORAL_SEQUENCE_REFLECTION'
  | 'COLLABORATION_REFLECTION'
  | 'COGNITIVE_CLUSTER_REFLECTION';

export type PropositionPredicate =
  // Entity Mention & Multiplicity Facts
  | 'MENTIONED_IN_ENTRIES'
  | 'OBSERVED_IN_WINDOW'
  // Graph Relationship Facts (Strictly from active KG Ontology)
  | 'WORKED_ON'
  | 'COLLABORATED_WITH'
  | 'USES_TECHNOLOGY'
  | 'CO_OCCURS_WITH'
  // Temporal Sequence Facts
  | 'CHRONOLOGICALLY_FOLLOWED_BY'
  // Quantitative Metric Facts
  | 'HAS_PAIRWISE_COHESION'
  | 'HAS_SEQUENCE_INTERVAL';

export type RealizationClass =
  | 'MultiplicityFrame'
  | 'TemporalSpanFrame'
  | 'WorkEngagementFrame'
  | 'CollaborationFrame'
  | 'TechnologyUsageFrame'
  | 'CoOccurrenceFrame'
  | 'SequenceFrame'
  | 'ClusterCohesionFrame'
  | 'SequenceIntervalFrame';

export interface AuthorizedEntityFact {
  readonly factId: string; // "ent:<uuid>"
  readonly entityId: string;
  readonly canonicalName: string;
  readonly entityType: string;
  readonly aliases?: string[];
}

export interface AuthorizedRelationshipFact {
  readonly factId: string; // "rel:<uuid>"
  readonly sourceEntityId: string;
  readonly sourceEntityName: string;
  readonly targetEntityId: string;
  readonly targetEntityName: string;
  readonly relationType:
    | 'WORKED_ON'
    | 'COLLABORATED_WITH'
    | 'USES_TECHNOLOGY'
    | 'MENTIONED_WITH'
    | 'CHRONOLOGICALLY_FOLLOWED_BY';
  readonly status: 'ACTIVE';
}

export interface AuthorizedTemporalBoundsFact {
  readonly factId: 'temp:span';
  readonly startDate: string; // ISO-8601 UTC
  readonly endDate: string;   // ISO-8601 UTC
  readonly durationDays: number;
}

export interface AuthorizedMetricFact {
  readonly factId: string; // "metric:<name>"
  readonly metricType: 'COUNT' | 'FREQUENCY' | 'COHESION_SCORE' | 'SEQUENCE_INTERVAL';
  readonly value: number;
}

export interface UntrustedSnippetReference {
  readonly fragmentId: string;
  readonly capturedAt: string; // ISO-8601 UTC
  readonly text: string;       // Bounded excerpt
}

export interface ReflectionInputBundle {
  readonly schemaVersion: '1.0.0';
  readonly canonicalizationVersion: '1.0.0';
  readonly claimId: string;
  readonly claimType: string;
  readonly claimStatement: string;
  readonly evidenceChainId: string;
  readonly chainIntegrityHash: string;
  readonly authorizedFacts: {
    readonly entities: readonly AuthorizedEntityFact[];
    readonly relationships: readonly AuthorizedRelationshipFact[];
    readonly temporalSpan: AuthorizedTemporalBoundsFact;
    readonly metrics: readonly AuthorizedMetricFact[];
  };
  readonly untrustedSnippets: readonly UntrustedSnippetReference[];
}

export interface GroundedProposition {
  readonly propositionId: string;
  readonly subject: string;
  readonly predicate: PropositionPredicate;
  readonly object: string;
  readonly authorizedFactId: string;
}

export interface ReflectionSegment {
  readonly segmentId: string;
  readonly text: string;
  readonly groundedPropositionIds: readonly string[];
}

export interface LLMReflectionResponse {
  readonly propositions: readonly GroundedProposition[];
  readonly segments: readonly ReflectionSegment[];
  readonly reflectionText: string;
}

export interface ValidationGateResult {
  readonly gate: 'G1' | 'G2' | 'G3' | 'G4' | 'G5';
  readonly passed: boolean;
  readonly error?: string;
  readonly details?: Record<string, unknown>;
}

export interface ReflectionValidationResult {
  readonly passed: boolean;
  readonly gates: readonly ValidationGateResult[];
  readonly failureReason?: string;
  readonly auditTimestamp: Date;
}

export interface ReflectionRecord {
  readonly id: string;
  readonly userId: string;
  readonly sourceClaimId: string;
  readonly evidenceChainId: string;
  readonly reflectionType: ReflectionType;
  readonly text: string;
  readonly structuredPropositions: readonly GroundedProposition[];
  readonly groundedSegments: readonly ReflectionSegment[];
  readonly chainIntegrityHash: string;
  readonly bundleIntegrityHash: string;
  readonly canonicalizationVersion: string;
  readonly synthesisMethod: 'LLM_CONSTRAINED' | 'DETERMINISTIC_FALLBACK';
  readonly engineVersion: string;
  readonly promptVersion: string;
  readonly modelInfo: Record<string, unknown>;
  readonly validationDetails: Record<string, unknown>;
  readonly temporalScope: {
    readonly startDate: Date;
    readonly endDate: Date;
  };
  readonly createdAt: Date;
}

export interface ReflectionEngineConfig {
  readonly maxRegenerationAttempts: number;
  readonly llmTimeoutMs: number;
  readonly temperature: number;
  readonly defaultModel: string;
  readonly defaultProvider: string;
}
