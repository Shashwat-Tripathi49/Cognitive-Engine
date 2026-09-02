import {
  IKnowledgeGraphRepository,
  DrizzleKnowledgeGraphRepository,
} from './repository.js';
import { EntityExtractionProvider } from './extraction/types.js';
import { DeterministicMockExtractionProvider } from './extraction/mock-provider.js';
import { LayeredHybridEntityResolver } from './resolution/resolver.js';
import {
  CanonicalEntity,
  EntityType,
  RelationshipType,
  ProcessFragmentResult,
  SubgraphQueryOptions,
  SubgraphResult,
  CandidateConfirmationItem,
  ConfirmationStatus,
} from './types.js';
import { RESOLVER_CONSTANTS } from './resolution/constants.js';

export interface ProcessFragmentInput {
  userId: string;
  fragmentId: string;
  content: string;
  contentHash: string;
  capturedAt?: Date;
  memoryId?: string | null;
}

/**
 * Maps pairs of entity types to primary ontology relationship types
 */
export function inferRelationshipType(
  type1: EntityType,
  type2: EntityType
): RelationshipType {
  if (type1 === 'Person' && type2 === 'Project') return 'WORKED_ON';
  if (type1 === 'Project' && type2 === 'Person') return 'WORKED_ON';

  if (type1 === 'Person' && type2 === 'Person') return 'COLLABORATED_WITH';

  if (type1 === 'Project' && type2 === 'Tool') return 'USES_TECHNOLOGY';
  if (type1 === 'Tool' && type2 === 'Project') return 'USES_TECHNOLOGY';

  if ((type1 === 'Person' || type1 === 'Topic') && type2 === 'Goal')
    return 'PREPARED_FOR';
  if (type1 === 'Goal' && (type2 === 'Person' || type2 === 'Topic'))
    return 'PREPARED_FOR';

  if (
    (type1 === 'Project' || type1 === 'Topic') &&
    type2 === 'Organization'
  )
    return 'BELONGS_TO';

  if (type2 === 'Place') return 'LOCATED_AT';
  if (type1 === 'Place') return 'LOCATED_AT';

  return 'MENTIONED_WITH';
}

/**
 * Knowledge Graph Engine (Engine 3)
 *
 * Coordinates entity extraction, entity resolution, canonical graph persistence,
 * bitemporal assertions, and evidence lineage.
 */
export class KnowledgeGraphEngine {
  constructor(
    private repository: IKnowledgeGraphRepository = new DrizzleKnowledgeGraphRepository(),
    private extractionProvider: EntityExtractionProvider = new DeterministicMockExtractionProvider(),
    private resolver: LayeredHybridEntityResolver = new LayeredHybridEntityResolver()
  ) {}

  /**
   * Processes a CognitiveFragment through the complete Knowledge Graph pipeline:
   * 1. Entity Extraction
   * 2. Extraction Validation
   * 3. Entity Resolution against Canonical Registry
   * 4. Canonical Node Creation / Linking
   * 5. Bitemporal Graph Assertion & Provenance Logging
   */
  async processFragment(input: ProcessFragmentInput): Promise<ProcessFragmentResult> {
    const startTime = Date.now();
    const capturedAt = input.capturedAt || new Date();
    const now = new Date();

    // 1. Extract named entities from raw fragment content
    const extractionResult = await this.extractionProvider.extractEntities(
      input.content,
      {
        fragmentId: input.fragmentId,
        userId: input.userId,
        capturedAt,
      }
    );

    const extractedMentions = extractionResult.entities;

    // 2. Fetch all active canonical entities for this tenant
    const activeCanonicals = await this.repository.listEntities(input.userId, {
      status: 'ACTIVE',
    });

    let entitiesResolved = 0;
    let entitiesCreated = 0;
    let entitiesAmbiguous = 0;

    const resolvedEntitiesForEdges: {
      canonicalId: string;
      canonicalName: string;
      entityType: EntityType;
    }[] = [];

    const resolvedEntitySummaries: ProcessFragmentResult['resolvedEntities'] = [];
    const provenanceIds: string[] = [];

    // 3. Resolve each extracted mention through the V2 resolver waterfall
    for (const mention of extractedMentions) {
      const mentionId = `mention_${Math.random().toString(36).substring(2, 10)}`;

      const res = await this.resolver.resolve(
        mention.name,
        mention.type,
        activeCanonicals
      );

      let canonicalTargetId: string | undefined;
      let canonicalTargetName: string | undefined;

      if (res.outcome === 'RESOLVED' && res.canonicalId) {
        entitiesResolved++;
        canonicalTargetId = res.canonicalId;

        const canonical = activeCanonicals.find((c) => c.id === res.canonicalId);
        canonicalTargetName = canonical?.canonicalName || mention.name;

        // Ensure current mention is registered as an alias if distinct
        if (
          canonical &&
          mention.name.toLowerCase() !== canonical.canonicalName.toLowerCase() &&
          !(canonical.aliases || []).some(
            (a) => a.toLowerCase() === mention.name.toLowerCase()
          )
        ) {
          await this.repository.addAlias({
            userId: input.userId,
            canonicalId: canonical.id,
            aliasName: mention.name,
            sourceMemoryId: input.memoryId,
            verificationActor: 'RESOLVER',
          });
          canonical.aliases = [...(canonical.aliases || []), mention.name];
        }

        // Record immutable resolution provenance
        const prov = await this.repository.recordProvenance({
          userId: input.userId,
          mentionId,
          sourceFragmentId: input.fragmentId,
          sourceContentHash: input.contentHash,
          sourceMemoryId: input.memoryId,
          canonicalId: canonicalTargetId,
          surfaceMention: mention.name,
          resolutionMethod: res.resolutionMethod,
          similarityScore: res.similarityScore,
          separationMargin: res.separationMargin,
          resolverVersion: RESOLVER_CONSTANTS.RESOLVER_VERSION,
          decidedBy: 'RESOLVER',
        });
        provenanceIds.push(prov.id);

        resolvedEntitiesForEdges.push({
          canonicalId: canonicalTargetId,
          canonicalName: canonicalTargetName,
          entityType: mention.type,
        });
      } else if (res.outcome === 'NO_MATCH') {
        entitiesCreated++;

        // Create pristine canonical entity
        const newEntity = await this.repository.createEntity({
          userId: input.userId,
          canonicalName: mention.name,
          entityType: mention.type,
          status: 'ACTIVE',
        });

        canonicalTargetId = newEntity.id;
        canonicalTargetName = newEntity.canonicalName;

        // Register initial alias
        await this.repository.addAlias({
          userId: input.userId,
          canonicalId: newEntity.id,
          aliasName: mention.name,
          sourceMemoryId: input.memoryId,
          verificationActor: 'INITIAL_CREATION',
        });

        newEntity.aliases = [mention.name];
        activeCanonicals.push(newEntity);

        // Record immutable resolution provenance
        const prov = await this.repository.recordProvenance({
          userId: input.userId,
          mentionId,
          sourceFragmentId: input.fragmentId,
          sourceContentHash: input.contentHash,
          sourceMemoryId: input.memoryId,
          canonicalId: canonicalTargetId,
          surfaceMention: mention.name,
          resolutionMethod: res.resolutionMethod,
          similarityScore: res.similarityScore,
          separationMargin: res.separationMargin,
          resolverVersion: RESOLVER_CONSTANTS.RESOLVER_VERSION,
          decidedBy: 'RESOLVER',
        });
        provenanceIds.push(prov.id);

        resolvedEntitiesForEdges.push({
          canonicalId: canonicalTargetId,
          canonicalName: canonicalTargetName,
          entityType: mention.type,
        });
      } else {
        // AMBIGUOUS -> Enqueue into candidate confirmation queue
        entitiesAmbiguous++;

        await this.repository.enqueueCandidate({
          userId: input.userId,
          surfaceMention: mention.name,
          entityType: mention.type,
          suggestedCanonicalId: res.suggestedCanonicalId || null,
          similarityScore: res.similarityScore || null,
          sourceMemoryId: input.memoryId || null,
          sourceFragmentId: input.fragmentId,
          status: 'PENDING',
        });

        // Record provenance with null canonicalId
        const prov = await this.repository.recordProvenance({
          userId: input.userId,
          mentionId,
          sourceFragmentId: input.fragmentId,
          sourceContentHash: input.contentHash,
          sourceMemoryId: input.memoryId,
          canonicalId: null,
          surfaceMention: mention.name,
          resolutionMethod: res.resolutionMethod,
          similarityScore: res.similarityScore,
          separationMargin: res.separationMargin,
          resolverVersion: RESOLVER_CONSTANTS.RESOLVER_VERSION,
          decidedBy: 'RESOLVER',
        });
        provenanceIds.push(prov.id);
      }

      resolvedEntitySummaries.push({
        mention: mention.name,
        entityType: mention.type,
        outcome: res.outcome,
        canonicalId: canonicalTargetId,
        canonicalName: canonicalTargetName,
        resolutionMethod: res.resolutionMethod,
        confidence: res.confidence,
      });
    }

    // 4. Construct Bitemporal Graph Assertions (Relationships) between co-occurring entities
    const graphRelationships = [];
    const seenPairs = new Set<string>();

    for (let i = 0; i < resolvedEntitiesForEdges.length; i++) {
      for (let j = i + 1; j < resolvedEntitiesForEdges.length; j++) {
        const entA = resolvedEntitiesForEdges[i];
        const entB = resolvedEntitiesForEdges[j];

        if (entA.canonicalId === entB.canonicalId) {
          continue;
        }

        const pairKey = [entA.canonicalId, entB.canonicalId].sort().join(':');
        if (seenPairs.has(pairKey)) {
          continue;
        }
        seenPairs.add(pairKey);

        const relType = inferRelationshipType(entA.entityType, entB.entityType);

        const rel = await this.repository.createRelationship({
          userId: input.userId,
          sourceEntityId: entA.canonicalId,
          targetEntityId: entB.canonicalId,
          relationType: relType,
          confidence: 1.0,
          evidenceCount: 1,
          sourceFragmentId: input.fragmentId,
          sourceMemoryId: input.memoryId,
          sourceContentHash: input.contentHash,
          extractionRunId: extractionResult.metadata.extractionRunId,
          status: 'ACTIVE',
          assertedAt: now,
          validAt: capturedAt,
        });

        graphRelationships.push(rel);
      }
    }

    return {
      fragmentId: input.fragmentId,
      entitiesExtracted: extractedMentions.length,
      entitiesResolved,
      entitiesCreated,
      entitiesAmbiguous,
      relationshipsCreated: graphRelationships.length,
      resolvedEntities: resolvedEntitySummaries,
      graphRelationships,
      provenanceIds,
      executionTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Retrieves a canonical entity with aliases and relationships
   */
  async getCanonicalEntity(
    id: string,
    userId: string
  ): Promise<CanonicalEntity | null> {
    return this.repository.findEntityById(id, userId);
  }

  /**
   * Lists canonical entities for a tenant
   */
  async listCanonicalEntities(
    userId: string,
    options?: {
      entityType?: EntityType;
      status?: 'ACTIVE' | 'MERGED' | 'ARCHIVED';
      limit?: number;
      offset?: number;
    }
  ): Promise<CanonicalEntity[]> {
    return this.repository.listEntities(userId, options);
  }

  /**
   * Queries a subgraph by entity ID or fragment ID
   */
  async getSubgraph(
    userId: string,
    options: SubgraphQueryOptions
  ): Promise<SubgraphResult> {
    return this.repository.getSubgraph(userId, options);
  }

  /**
   * Lists pending candidate entities awaiting review
   */
  async getPendingCandidates(
    userId: string
  ): Promise<CandidateConfirmationItem[]> {
    return this.repository.listPendingCandidates(userId);
  }

  /**
   * Resolves a pending candidate item
   */
  async resolveCandidate(
    id: string,
    userId: string,
    action: 'APPROVE_AS_NEW' | 'MERGE_INTO' | 'REJECT',
    targetCanonicalId?: string
  ): Promise<CandidateConfirmationItem> {
    const status: ConfirmationStatus =
      action === 'REJECT' ? 'REJECTED' : 'APPROVED';

    const updated = await this.repository.updateCandidateStatus(
      id,
      userId,
      status
    );

    if (action === 'APPROVE_AS_NEW') {
      const newEntity = await this.repository.createEntity({
        userId,
        canonicalName: updated.surfaceMention,
        entityType: updated.entityType,
        status: 'ACTIVE',
      });
      await this.repository.addAlias({
        userId,
        canonicalId: newEntity.id,
        aliasName: updated.surfaceMention,
        verificationActor: 'USER',
      });
    } else if (action === 'MERGE_INTO' && targetCanonicalId) {
      await this.repository.addAlias({
        userId,
        canonicalId: targetCanonicalId,
        aliasName: updated.surfaceMention,
        verificationActor: 'USER',
      });
    }

    return updated;
  }
}
