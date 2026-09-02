import { eq, and, inArray } from 'drizzle-orm';
import { db as defaultDb } from '../db/index.js';
import {
  cognitiveFragments,
  memories,
  canonicalEntities,
  kgRelationships,
} from '../db/schema.js';
import { CandidateFinding, EvidenceObject } from './types.js';

export interface RetrievedEvidenceBundle {
  evidenceObjects: EvidenceObject[];
  rootFragments: { id: string; contentHash: string; capturedAt: Date }[];
  entities: Map<string, any>;
  relationships: Map<string, any>;
  memories: Map<string, any>;
}

export interface IEvidenceStorageAdapter {
  getFragments(userId: string, ids: string[]): Promise<{ id: string; contentHash: string; capturedAt: Date; content: string }[]>;
  getMemories(userId: string, ids: string[]): Promise<{ id: string; content: string; createdAt: Date; metadata: any }[]>;
  getEntities(userId: string, ids: string[]): Promise<{ id: string; canonicalName: string; entityType: string; status: string }[]>;
  getRelationships(userId: string, ids: string[]): Promise<{ id: string; sourceEntityId: string; targetEntityId: string; relationType: string; status: string; assertedAt: Date; validAt: Date }[]>;
}

/**
 * Default Drizzle PostgreSQL storage adapter
 */
export class DrizzleEvidenceStorageAdapter implements IEvidenceStorageAdapter {
  constructor(private db: typeof defaultDb = defaultDb) {}

  async getFragments(userId: string, ids: string[]) {
    if (!ids || ids.length === 0) return [];
    const rows = await this.db
      .select({
        id: cognitiveFragments.id,
        contentHash: cognitiveFragments.contentHash,
        capturedAt: cognitiveFragments.capturedAt,
        content: cognitiveFragments.content,
      })
      .from(cognitiveFragments)
      .where(
        and(
          eq(cognitiveFragments.userId, userId),
          inArray(cognitiveFragments.id, ids)
        )
      );
    return rows;
  }

  async getMemories(userId: string, ids: string[]) {
    if (!ids || ids.length === 0) return [];
    const rows = await this.db
      .select({
        id: memories.id,
        content: memories.content,
        createdAt: memories.createdAt,
        metadata: memories.metadata,
      })
      .from(memories)
      .where(and(eq(memories.userId, userId), inArray(memories.id, ids)));
    return rows;
  }

  async getEntities(userId: string, ids: string[]) {
    if (!ids || ids.length === 0) return [];
    const rows = await this.db
      .select({
        id: canonicalEntities.id,
        canonicalName: canonicalEntities.canonicalName,
        entityType: canonicalEntities.entityType,
        status: canonicalEntities.status,
      })
      .from(canonicalEntities)
      .where(
        and(
          eq(canonicalEntities.userId, userId),
          inArray(canonicalEntities.id, ids)
        )
      );
    return rows;
  }

  async getRelationships(userId: string, ids: string[]) {
    if (!ids || ids.length === 0) return [];
    const rows = await this.db
      .select({
        id: kgRelationships.id,
        sourceEntityId: kgRelationships.sourceEntityId,
        targetEntityId: kgRelationships.targetEntityId,
        relationType: kgRelationships.relationType,
        status: kgRelationships.status,
        assertedAt: kgRelationships.assertedAt,
        validAt: kgRelationships.validAt,
      })
      .from(kgRelationships)
      .where(
        and(
          eq(kgRelationships.userId, userId),
          inArray(kgRelationships.id, ids)
        )
      );
    return rows;
  }
}

/**
 * In-Memory storage adapter for unit and integration testing
 */
export class InMemoryEvidenceStorageAdapter implements IEvidenceStorageAdapter {
  private fragments = new Map<string, { id: string; userId: string; contentHash: string; capturedAt: Date; content: string }>();
  private memoriesMap = new Map<string, { id: string; userId: string; content: string; createdAt: Date; metadata: any }>();
  private entitiesMap = new Map<string, { id: string; userId: string; canonicalName: string; entityType: string; status: string }>();
  private relationshipsMap = new Map<string, { id: string; userId: string; sourceEntityId: string; targetEntityId: string; relationType: string; status: string; assertedAt: Date; validAt: Date }>();

  addFragment(data: { id: string; userId: string; contentHash: string; capturedAt: Date; content: string }) {
    this.fragments.set(data.id, data);
  }

  addMemory(data: { id: string; userId: string; content: string; createdAt: Date; metadata: any }) {
    this.memoriesMap.set(data.id, data);
  }

  addEntity(data: { id: string; userId: string; canonicalName: string; entityType: string; status: string }) {
    this.entitiesMap.set(data.id, data);
  }

  addRelationship(data: { id: string; userId: string; sourceEntityId: string; targetEntityId: string; relationType: string; status: string; assertedAt: Date; validAt: Date }) {
    this.relationshipsMap.set(data.id, data);
  }

  async getFragments(userId: string, ids: string[]) {
    return ids
      .map((id) => this.fragments.get(id))
      .filter((f): f is NonNullable<typeof f> => !!f && f.userId === userId);
  }

  async getMemories(userId: string, ids: string[]) {
    return ids
      .map((id) => this.memoriesMap.get(id))
      .filter((m): m is NonNullable<typeof m> => !!m && m.userId === userId);
  }

  async getEntities(userId: string, ids: string[]) {
    return ids
      .map((id) => this.entitiesMap.get(id))
      .filter((e): e is NonNullable<typeof e> => !!e && e.userId === userId);
  }

  async getRelationships(userId: string, ids: string[]) {
    return ids
      .map((id) => this.relationshipsMap.get(id))
      .filter((r): r is NonNullable<typeof r> => !!r && r.userId === userId);
  }
}

/**
 * Service to retrieve, construct, and verify evidence objects for a CandidateFinding
 */
export class EvidenceRetrievalService {
  constructor(private adapter: IEvidenceStorageAdapter = new DrizzleEvidenceStorageAdapter()) {}

  async retrieveEvidence(
    finding: CandidateFinding,
    userId: string
  ): Promise<RetrievedEvidenceBundle> {
    const evidenceObjects: EvidenceObject[] = [];

    // 1. Gather all fragment IDs
    const fragmentIds = new Set<string>();
    for (const prov of finding.provenanceReferences || []) {
      fragmentIds.add(prov.fragmentId);
    }

    const fetchedFragments = await this.adapter.getFragments(
      userId,
      Array.from(fragmentIds)
    );
    const rootFragments = fetchedFragments.map((f) => ({
      id: f.id,
      contentHash: f.contentHash,
      capturedAt: f.capturedAt,
    }));

    for (const f of fetchedFragments) {
      evidenceObjects.push({
        id: crypto.randomUUID(),
        userId,
        evidenceType: 'COGNITIVE_FRAGMENT',
        sourceId: f.id,
        sourceContentHash: f.contentHash,
        sourceTimestamp: f.capturedAt,
        summary: `CognitiveFragment (${f.id}) captured at ${new Date(f.capturedAt).toISOString()}`,
        verified: true,
      });
    }

    // 2. Gather entities
    const entityIds = finding.involvedEntityIds || [];
    const fetchedEntities = await this.adapter.getEntities(userId, entityIds);
    const entitiesMap = new Map<string, any>();

    for (const e of fetchedEntities) {
      entitiesMap.set(e.id, e);
      evidenceObjects.push({
        id: crypto.randomUUID(),
        userId,
        evidenceType: 'CANONICAL_ENTITY',
        sourceId: e.id,
        summary: `Canonical Entity: ${e.canonicalName} [${e.entityType}] (Status: ${e.status})`,
        verified: e.status === 'ACTIVE',
      });
    }

    // 3. Gather relationships
    const relationshipIds = finding.involvedRelationshipIds || [];
    const fetchedRelationships = await this.adapter.getRelationships(
      userId,
      relationshipIds
    );
    const relationshipsMap = new Map<string, any>();

    for (const r of fetchedRelationships) {
      relationshipsMap.set(r.id, r);
      evidenceObjects.push({
        id: crypto.randomUUID(),
        userId,
        evidenceType: 'RELATIONSHIP_ASSERTION',
        sourceId: r.id,
        sourceTimestamp: r.assertedAt,
        validFrom: r.validAt,
        summary: `Graph Relationship (${r.relationType}): ${r.sourceEntityId} -> ${r.targetEntityId}`,
        verified: r.status === 'ACTIVE',
      });
    }

    // 4. Gather memories
    const memoryIds = finding.involvedMemoryIds || [];
    const fetchedMemories = await this.adapter.getMemories(userId, memoryIds);
    const memoriesMap = new Map<string, any>();

    for (const m of fetchedMemories) {
      memoriesMap.set(m.id, m);
      evidenceObjects.push({
        id: crypto.randomUUID(),
        userId,
        evidenceType: 'MEMORY_NODE',
        sourceId: m.id,
        sourceTimestamp: m.createdAt,
        summary: `Memory Node (${m.id})`,
        verified: true,
      });
    }

    return {
      evidenceObjects,
      rootFragments,
      entities: entitiesMap,
      relationships: relationshipsMap,
      memories: memoriesMap,
    };
  }
}
