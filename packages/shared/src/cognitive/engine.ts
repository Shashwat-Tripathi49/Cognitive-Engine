import { eq, and, lte, gte } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  cognitiveFragments,
  memories,
  canonicalEntities,
  entityResolutionProvenance,
  kgRelationships,
} from '../db/schema.js';
import { CandidateFinding, EvaluateFindingResponse } from '../reasoning/types.js';
import { ReasoningEngine } from '../reasoning/engine.js';
import { CognitiveConfigSnapshot, DEFAULT_COGNITIVE_CONFIG } from './config.js';
import {
  ICognitiveDetector,
  ICognitiveDataProvider,
  CognitiveDiscoveryContext,
  DiscoverOptions,
  DiscoveryResult,
} from './types.js';
import { ICognitiveRepository, DrizzleCognitiveRepository } from './repository.js';
import {
  TopicRecurrenceDetector,
  TemporalSequenceMiner,
  DeterministicVectorClusterer,
  GraphCoOccurrenceMiner,
} from './detectors/index.js';

/**
 * Production Drizzle Data Provider for querying tenant records
 */
export class DrizzleCognitiveDataProvider implements ICognitiveDataProvider {
  async getDiscoveryContext(
    userId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      evaluationTimestamp?: Date;
      config?: CognitiveConfigSnapshot;
    } = {}
  ): Promise<CognitiveDiscoveryContext> {
    const evaluationTimestamp = options.evaluationTimestamp || new Date();
    const config = options.config || DEFAULT_COGNITIVE_CONFIG;

    const fragConditions = [
      eq(cognitiveFragments.userId, userId),
      lte(cognitiveFragments.capturedAt, evaluationTimestamp),
    ];
    if (options.startDate) {
      fragConditions.push(gte(cognitiveFragments.capturedAt, options.startDate));
    }
    if (options.endDate) {
      fragConditions.push(lte(cognitiveFragments.capturedAt, options.endDate));
    }

    const fetchedFragments = await db
      .select({
        id: cognitiveFragments.id,
        content: cognitiveFragments.content,
        contentHash: cognitiveFragments.contentHash,
        capturedAt: cognitiveFragments.capturedAt,
      })
      .from(cognitiveFragments)
      .where(and(...fragConditions));

    const fetchedMemories = await db
      .select({
        id: memories.id,
        fragmentId: memories.fragmentId,
        content: memories.content,
        embedding: memories.embedding,
        createdAt: memories.createdAt,
        metadata: memories.metadata,
      })
      .from(memories)
      .where(
        and(
          eq(memories.userId, userId),
          lte(memories.createdAt, evaluationTimestamp)
        )
      );

    const fetchedEntities = await db
      .select({
        id: canonicalEntities.id,
        canonicalName: canonicalEntities.canonicalName,
        entityType: canonicalEntities.entityType,
        status: canonicalEntities.status,
        createdAt: canonicalEntities.createdAt,
      })
      .from(canonicalEntities)
      .where(
        and(
          eq(canonicalEntities.userId, userId),
          eq(canonicalEntities.status, 'ACTIVE')
        )
      );

    const fetchedProvenance = await db
      .select({
        id: entityResolutionProvenance.id,
        canonicalId: entityResolutionProvenance.canonicalId,
        sourceFragmentId: entityResolutionProvenance.sourceFragmentId,
        sourceContentHash: entityResolutionProvenance.sourceContentHash,
        sourceMention: entityResolutionProvenance.surfaceMention,
        similarityScore: entityResolutionProvenance.similarityScore,
        createdAt: entityResolutionProvenance.createdAt,
      })
      .from(entityResolutionProvenance)
      .where(eq(entityResolutionProvenance.userId, userId));

    const fetchedRelationships = await db
      .select({
        id: kgRelationships.id,
        sourceEntityId: kgRelationships.sourceEntityId,
        targetEntityId: kgRelationships.targetEntityId,
        relationType: kgRelationships.relationType,
        status: kgRelationships.status,
        confidence: kgRelationships.confidence,
        evidenceCount: kgRelationships.evidenceCount,
        sourceFragmentId: kgRelationships.sourceFragmentId,
        sourceContentHash: kgRelationships.sourceContentHash,
        assertedAt: kgRelationships.assertedAt,
        validAt: kgRelationships.validAt,
      })
      .from(kgRelationships)
      .where(
        and(
          eq(kgRelationships.userId, userId),
          eq(kgRelationships.status, 'ACTIVE'),
          lte(kgRelationships.assertedAt, evaluationTimestamp)
        )
      );

    // Map fragmentId to memoryId
    const fragToMemory = new Map<string, string>();
    for (const m of fetchedMemories) {
      if (m.fragmentId) {
        fragToMemory.set(m.fragmentId, m.id);
      }
    }

    return {
      userId,
      evaluationTimestamp,
      config,
      fragments: fetchedFragments.map((f) => ({
        id: f.id,
        content: f.content,
        contentHash: f.contentHash,
        capturedAt: f.capturedAt,
        memoryId: fragToMemory.get(f.id) || null,
      })),
      memories: fetchedMemories.map((m) => ({
        id: m.id,
        content: m.content,
        embedding: m.embedding || undefined,
        createdAt: m.createdAt,
        metadata: m.metadata,
      })),
      entities: fetchedEntities.map((e) => ({
        id: e.id,
        canonicalName: e.canonicalName,
        entityType: e.entityType,
        status: e.status,
        aliases: [],
        createdAt: e.createdAt,
      })),
      provenance: fetchedProvenance
        .filter((p) => p.canonicalId !== null)
        .map((p) => ({
          id: p.id,
          canonicalId: p.canonicalId!,
          sourceFragmentId: p.sourceFragmentId,
          sourceContentHash: p.sourceContentHash,
          sourceMention: p.sourceMention,
          confidence: p.similarityScore || 0.9,
          resolvedAt: p.createdAt,
        })),
      relationships: fetchedRelationships,
    };
  }
}

/**
 * In-Memory Data Provider for deterministic unit testing
 */
export class InMemoryCognitiveDataProvider implements ICognitiveDataProvider {
  private fragments: CognitiveDiscoveryContext['fragments'] = [];
  private memories: CognitiveDiscoveryContext['memories'] = [];
  private entities: CognitiveDiscoveryContext['entities'] = [];
  private provenance: CognitiveDiscoveryContext['provenance'] = [];
  private relationships: CognitiveDiscoveryContext['relationships'] = [];

  setContextData(data: {
    fragments?: CognitiveDiscoveryContext['fragments'];
    memories?: CognitiveDiscoveryContext['memories'];
    entities?: CognitiveDiscoveryContext['entities'];
    provenance?: CognitiveDiscoveryContext['provenance'];
    relationships?: CognitiveDiscoveryContext['relationships'];
  }) {
    if (data.fragments) this.fragments = [...data.fragments];
    if (data.memories) this.memories = [...data.memories];
    if (data.entities) this.entities = [...data.entities];
    if (data.provenance) this.provenance = [...data.provenance];
    if (data.relationships) this.relationships = [...data.relationships];
  }

  async getDiscoveryContext(
    userId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      evaluationTimestamp?: Date;
      config?: CognitiveConfigSnapshot;
    } = {}
  ): Promise<CognitiveDiscoveryContext> {
    const evaluationTimestamp = options.evaluationTimestamp || new Date();
    const config = options.config || DEFAULT_COGNITIVE_CONFIG;

    return {
      userId,
      evaluationTimestamp,
      config,
      fragments: this.fragments.filter(
        (f) =>
          f.capturedAt <= evaluationTimestamp &&
          (!options.startDate || f.capturedAt >= options.startDate) &&
          (!options.endDate || f.capturedAt <= options.endDate)
      ),
      memories: this.memories.filter((m) => m.createdAt <= evaluationTimestamp),
      entities: this.entities.filter((e) => e.status === 'ACTIVE'),
      provenance: this.provenance,
      relationships: this.relationships.filter(
        (r) => r.status === 'ACTIVE' && r.assertedAt <= evaluationTimestamp
      ),
    };
  }
}

/**
 * Cognitive Engine: 100% deterministic pattern discovery and structured candidate generator
 */
export class CognitiveEngine {
  private detectors: ICognitiveDetector[];
  private repository: ICognitiveRepository;
  private dataProvider: ICognitiveDataProvider;

  constructor(
    repository?: ICognitiveRepository,
    dataProvider?: ICognitiveDataProvider,
    detectors?: ICognitiveDetector[]
  ) {
    this.repository = repository || new DrizzleCognitiveRepository();
    this.dataProvider = dataProvider || new DrizzleCognitiveDataProvider();
    this.detectors = detectors || [
      new TopicRecurrenceDetector(),
      new TemporalSequenceMiner(),
      new DeterministicVectorClusterer(),
      new GraphCoOccurrenceMiner(),
    ];
  }

  /**
   * Runs deterministic discovery for a tenant across active detectors
   */
  async discover(
    userId: string,
    options: DiscoverOptions = {}
  ): Promise<DiscoveryResult> {
    const startTime = Date.now();
    const evaluationTimestamp = options.evaluationTimestamp || new Date();
    const config: CognitiveConfigSnapshot = {
      ...DEFAULT_COGNITIVE_CONFIG,
      ...(options.config || {}),
    };

    const context = await this.dataProvider.getDiscoveryContext(userId, {
      startDate: options.startDate,
      endDate: options.endDate,
      evaluationTimestamp,
      config,
    });

    const activeDetectors = options.detectorIds
      ? this.detectors.filter((d) => options.detectorIds!.includes(d.detectorId))
      : this.detectors;

    const allFindings: CandidateFinding[] = [];

    for (const detector of activeDetectors) {
      const findings = await detector.discover(context);
      allFindings.push(...findings);
    }

    // Sort findings deterministically
    allFindings.sort((a, b) => {
      const typeDiff = a.findingType.localeCompare(b.findingType);
      if (typeDiff !== 0) return typeDiff;
      const confDiff = b.discoveryConfidence - a.discoveryConfidence;
      if (confDiff !== 0) return confDiff;
      const timeDiff =
        a.temporalScope.startDate.getTime() - b.temporalScope.startDate.getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.statement.localeCompare(b.statement);
    });

    // Optionally persist findings to repository
    if (options.persistFindings !== false && allFindings.length > 0) {
      await this.repository.saveCandidateFindings(allFindings);
    }

    const durationMs = Date.now() - startTime;
    const byType: Record<string, number> = {};
    for (const f of allFindings) {
      byType[f.findingType] = (byType[f.findingType] || 0) + 1;
    }

    return {
      userId,
      evaluationTimestamp,
      configSnapshot: config,
      findings: allFindings,
      metrics: {
        totalFindings: allFindings.length,
        byType,
        durationMs,
      },
    };
  }

  /**
   * End-to-End Pipeline: Ingests/discovers candidate findings and evaluates them via Reasoning Engine
   */
  async runPipeline(
    userId: string,
    reasoningEngine: ReasoningEngine,
    options: DiscoverOptions = {}
  ): Promise<{
    discovery: DiscoveryResult;
    evaluations: EvaluateFindingResponse[];
  }> {
    const discovery = await this.discover(userId, options);
    const evaluations: EvaluateFindingResponse[] = [];

    for (const finding of discovery.findings) {
      const evalResult = await reasoningEngine.evaluateFinding({
        userId,
        finding,
        evaluationTimestamp: discovery.evaluationTimestamp,
      });
      evaluations.push(evalResult);
    }

    return {
      discovery,
      evaluations,
    };
  }

  /**
   * Retrieves a candidate finding from repository
   */
  async getFinding(id: string, userId: string): Promise<CandidateFinding | null> {
    return this.repository.getCandidateFinding(id, userId);
  }

  /**
   * Lists candidate findings from repository
   */
  async listFindings(
    userId: string,
    options?: { findingType?: CandidateFinding['findingType']; limit?: number; offset?: number }
  ): Promise<CandidateFinding[]> {
    return this.repository.listCandidateFindings(userId, options);
  }
}
