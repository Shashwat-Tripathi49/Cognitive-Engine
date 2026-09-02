import { eq, and, desc, or } from 'drizzle-orm';
import { db as defaultDb } from '../db/index.js';
import {
  canonicalEntities,
  entityAliases,
  entityResolutionProvenance,
  candidateConfirmationQueue,
  kgRelationships,
} from '../db/schema.js';
import {
  CanonicalEntity,
  EntityType,
  CanonicalEntityStatus,
  EntityAlias,
  EntityAliasStatus,
  EntityResolutionProvenance,
  CandidateConfirmationItem,
  ConfirmationStatus,
  GraphRelationship,
  RelationshipType,
  SubgraphQueryOptions,
  SubgraphResult,
} from './types.js';
import { normalizeText } from './resolution/normalizer.js';

export interface CreateCanonicalEntityInput {
  id?: string;
  userId: string;
  canonicalName: string;
  entityType: EntityType;
  description?: string | null;
  status?: CanonicalEntityStatus;
  currentCanonicalId?: string | null;
}

export interface IKnowledgeGraphRepository {
  // Canonical Entities
  createEntity(input: CreateCanonicalEntityInput): Promise<CanonicalEntity>;
  findEntityById(id: string, userId: string): Promise<CanonicalEntity | null>;
  findEntityByName(
    canonicalName: string,
    entityType: EntityType,
    userId: string
  ): Promise<CanonicalEntity | null>;
  listEntities(
    userId: string,
    options?: {
      entityType?: EntityType;
      status?: CanonicalEntityStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<CanonicalEntity[]>;
  updateEntity(
    id: string,
    userId: string,
    updates: Partial<CanonicalEntity>
  ): Promise<CanonicalEntity>;

  // Entity Aliases
  addAlias(input: {
    userId: string;
    canonicalId: string;
    aliasName: string;
    status?: EntityAliasStatus;
    sourceMemoryId?: string | null;
    verificationActor?: string;
  }): Promise<EntityAlias>;
  findAliasesByCanonicalId(
    canonicalId: string,
    userId: string
  ): Promise<EntityAlias[]>;
  findAliasByNormalized(
    normalizedAlias: string,
    userId: string
  ): Promise<EntityAlias | null>;

  // Provenance
  recordProvenance(
    input: Omit<EntityResolutionProvenance, 'id' | 'createdAt'>
  ): Promise<EntityResolutionProvenance>;
  findProvenanceByFragmentId(
    fragmentId: string,
    userId: string
  ): Promise<EntityResolutionProvenance[]>;
  findProvenanceByEntityId(
    canonicalId: string,
    userId: string
  ): Promise<EntityResolutionProvenance[]>;

  // Candidate Queue
  enqueueCandidate(
    input: Omit<CandidateConfirmationItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<CandidateConfirmationItem>;
  listPendingCandidates(userId: string): Promise<CandidateConfirmationItem[]>;
  updateCandidateStatus(
    id: string,
    userId: string,
    status: ConfirmationStatus
  ): Promise<CandidateConfirmationItem>;

  // Graph Relationships
  createRelationship(
    input: Omit<GraphRelationship, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<GraphRelationship>;
  findRelationshipsByEntity(
    entityId: string,
    userId: string
  ): Promise<GraphRelationship[]>;
  findRelationshipsByFragment(
    fragmentId: string,
    userId: string
  ): Promise<GraphRelationship[]>;
  getSubgraph(
    userId: string,
    options: SubgraphQueryOptions
  ): Promise<SubgraphResult>;
}

/**
 * In-Memory Knowledge Graph Repository (for fast Vitest unit tests and mock execution)
 */
export class InMemoryKnowledgeGraphRepository implements IKnowledgeGraphRepository {
  private entities = new Map<string, CanonicalEntity>();
  private aliases = new Map<string, EntityAlias>();
  private provenance = new Map<string, EntityResolutionProvenance>();
  private candidates = new Map<string, CandidateConfirmationItem>();
  private relationships = new Map<string, GraphRelationship>();

  async createEntity(input: CreateCanonicalEntityInput): Promise<CanonicalEntity> {
    const id = input.id || `ent_${Math.random().toString(36).substring(2, 10)}`;
    const now = new Date();
    const entity: CanonicalEntity = {
      id,
      userId: input.userId,
      canonicalName: input.canonicalName,
      entityType: input.entityType,
      status: input.status || 'ACTIVE',
      currentCanonicalId: input.currentCanonicalId || id,
      description: input.description || null,
      aliases: [],
      createdAt: now,
      updatedAt: now,
    };
    this.entities.set(id, entity);
    return entity;
  }

  async findEntityById(id: string, userId: string): Promise<CanonicalEntity | null> {
    const found = this.entities.get(id);
    if (!found || found.userId !== userId) {
      return null;
    }
    const aliasList = Array.from(this.aliases.values())
      .filter((a) => a.canonicalId === id && a.userId === userId && a.status === 'ACTIVE')
      .map((a) => a.aliasName);
    return { ...found, aliases: aliasList };
  }

  async findEntityByName(
    canonicalName: string,
    entityType: EntityType,
    userId: string
  ): Promise<CanonicalEntity | null> {
    const norm = normalizeText(canonicalName);
    for (const ent of this.entities.values()) {
      if (
        ent.userId === userId &&
        ent.entityType === entityType &&
        normalizeText(ent.canonicalName) === norm
      ) {
        return this.findEntityById(ent.id, userId);
      }
    }
    return null;
  }

  async listEntities(
    userId: string,
    options: {
      entityType?: EntityType;
      status?: CanonicalEntityStatus;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<CanonicalEntity[]> {
    let list = Array.from(this.entities.values()).filter(
      (e) => e.userId === userId
    );

    if (options.entityType) {
      list = list.filter((e) => e.entityType === options.entityType);
    }
    if (options.status) {
      list = list.filter((e) => e.status === options.status);
    }

    list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const offset = options.offset || 0;
    const limit = options.limit || 50;
    const sliced = list.slice(offset, offset + limit);

    return Promise.all(sliced.map((e) => this.findEntityById(e.id, userId))).then(
      (results) => results.filter((e): e is CanonicalEntity => e !== null)
    );
  }

  async updateEntity(
    id: string,
    userId: string,
    updates: Partial<CanonicalEntity>
  ): Promise<CanonicalEntity> {
    const found = await this.findEntityById(id, userId);
    if (!found) {
      throw new Error(`Entity ${id} not found for user ${userId}`);
    }
    const updated: CanonicalEntity = {
      ...found,
      ...updates,
      updatedAt: new Date(),
    };
    this.entities.set(id, updated);
    return updated;
  }

  async addAlias(input: {
    userId: string;
    canonicalId: string;
    aliasName: string;
    status?: EntityAliasStatus;
    sourceMemoryId?: string | null;
    verificationActor?: string;
  }): Promise<EntityAlias> {
    const id = `alias_${Math.random().toString(36).substring(2, 10)}`;
    const now = new Date();
    const alias: EntityAlias = {
      id,
      userId: input.userId,
      canonicalId: input.canonicalId,
      aliasName: input.aliasName,
      normalizedAlias: normalizeText(input.aliasName),
      status: input.status || 'ACTIVE',
      verificationActor: input.verificationActor || 'SYSTEM',
      sourceMemoryId: input.sourceMemoryId || null,
      createdAt: now,
      updatedAt: now,
    };
    this.aliases.set(id, alias);
    return alias;
  }

  async findAliasesByCanonicalId(
    canonicalId: string,
    userId: string
  ): Promise<EntityAlias[]> {
    return Array.from(this.aliases.values()).filter(
      (a) => a.canonicalId === canonicalId && a.userId === userId
    );
  }

  async findAliasByNormalized(
    normalizedAlias: string,
    userId: string
  ): Promise<EntityAlias | null> {
    const norm = normalizeText(normalizedAlias);
    for (const a of this.aliases.values()) {
      if (a.userId === userId && a.normalizedAlias === norm && a.status === 'ACTIVE') {
        return a;
      }
    }
    return null;
  }

  async recordProvenance(
    input: Omit<EntityResolutionProvenance, 'id' | 'createdAt'>
  ): Promise<EntityResolutionProvenance> {
    const id = `prov_${Math.random().toString(36).substring(2, 10)}`;
    const prov: EntityResolutionProvenance = {
      id,
      ...input,
      createdAt: new Date(),
    };
    this.provenance.set(id, prov);
    return prov;
  }

  async findProvenanceByFragmentId(
    fragmentId: string,
    userId: string
  ): Promise<EntityResolutionProvenance[]> {
    return Array.from(this.provenance.values()).filter(
      (p) => p.sourceFragmentId === fragmentId && p.userId === userId
    );
  }

  async findProvenanceByEntityId(
    canonicalId: string,
    userId: string
  ): Promise<EntityResolutionProvenance[]> {
    return Array.from(this.provenance.values()).filter(
      (p) => p.canonicalId === canonicalId && p.userId === userId
    );
  }

  async enqueueCandidate(
    input: Omit<CandidateConfirmationItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<CandidateConfirmationItem> {
    const id = `cand_${Math.random().toString(36).substring(2, 10)}`;
    const now = new Date();
    const item: CandidateConfirmationItem = {
      id,
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    this.candidates.set(id, item);
    return item;
  }

  async listPendingCandidates(userId: string): Promise<CandidateConfirmationItem[]> {
    return Array.from(this.candidates.values()).filter(
      (c) => c.userId === userId && c.status === 'PENDING'
    );
  }

  async updateCandidateStatus(
    id: string,
    userId: string,
    status: ConfirmationStatus
  ): Promise<CandidateConfirmationItem> {
    const found = this.candidates.get(id);
    if (!found || found.userId !== userId) {
      throw new Error(`Candidate item ${id} not found`);
    }
    const updated: CandidateConfirmationItem = {
      ...found,
      status,
      updatedAt: new Date(),
    };
    this.candidates.set(id, updated);
    return updated;
  }

  async createRelationship(
    input: Omit<GraphRelationship, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<GraphRelationship> {
    const id = `rel_${Math.random().toString(36).substring(2, 10)}`;
    const now = new Date();
    const rel: GraphRelationship = {
      id,
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    this.relationships.set(id, rel);
    return rel;
  }

  async findRelationshipsByEntity(
    entityId: string,
    userId: string
  ): Promise<GraphRelationship[]> {
    return Array.from(this.relationships.values()).filter(
      (r) =>
        r.userId === userId &&
        (r.sourceEntityId === entityId || r.targetEntityId === entityId) &&
        r.status === 'ACTIVE'
    );
  }

  async findRelationshipsByFragment(
    fragmentId: string,
    userId: string
  ): Promise<GraphRelationship[]> {
    return Array.from(this.relationships.values()).filter(
      (r) => r.userId === userId && r.sourceFragmentId === fragmentId
    );
  }

  async getSubgraph(
    userId: string,
    options: SubgraphQueryOptions
  ): Promise<SubgraphResult> {
    const visitedEntityIds = new Set<string>();
    const edges: GraphRelationship[] = [];

    if (options.entityId) {
      visitedEntityIds.add(options.entityId);
      const directRels = await this.findRelationshipsByEntity(
        options.entityId,
        userId
      );
      for (const r of directRels) {
        if (!options.relationTypes || options.relationTypes.includes(r.relationType)) {
          edges.push(r);
          visitedEntityIds.add(r.sourceEntityId);
          visitedEntityIds.add(r.targetEntityId);
        }
      }
    } else if (options.fragmentId) {
      const fragRels = await this.findRelationshipsByFragment(
        options.fragmentId,
        userId
      );
      for (const r of fragRels) {
        edges.push(r);
        visitedEntityIds.add(r.sourceEntityId);
        visitedEntityIds.add(r.targetEntityId);
      }
    } else {
      // Default: recent edges
      const recentEdges = Array.from(this.relationships.values())
        .filter((r) => r.userId === userId && r.status === 'ACTIVE')
        .slice(0, options.limit || 20);
      for (const r of recentEdges) {
        edges.push(r);
        visitedEntityIds.add(r.sourceEntityId);
        visitedEntityIds.add(r.targetEntityId);
      }
    }

    const nodes: CanonicalEntity[] = [];
    for (const id of visitedEntityIds) {
      const ent = await this.findEntityById(id, userId);
      if (ent) {
        nodes.push(ent);
      }
    }

    return { nodes, edges };
  }
}

/**
 * Production Drizzle PostgreSQL Knowledge Graph Repository
 */
export class DrizzleKnowledgeGraphRepository implements IKnowledgeGraphRepository {
  constructor(private db = defaultDb) {}

  async createEntity(input: CreateCanonicalEntityInput): Promise<CanonicalEntity> {
    const [row] = await this.db
      .insert(canonicalEntities)
      .values({
        id: input.id,
        userId: input.userId,
        canonicalName: input.canonicalName,
        entityType: input.entityType,
        status: input.status || 'ACTIVE',
        currentCanonicalId: input.currentCanonicalId,
        description: input.description,
      })
      .returning();

    return {
      id: row.id,
      userId: row.userId,
      canonicalName: row.canonicalName,
      entityType: row.entityType as EntityType,
      status: row.status as CanonicalEntityStatus,
      mergedIntoId: row.mergedIntoId,
      currentCanonicalId: row.currentCanonicalId || row.id,
      description: row.description,
      aliases: [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findEntityById(id: string, userId: string): Promise<CanonicalEntity | null> {
    const [row] = await this.db
      .select()
      .from(canonicalEntities)
      .where(
        and(
          eq(canonicalEntities.id, id),
          eq(canonicalEntities.userId, userId)
        )
      )
      .limit(1);

    if (!row) {
      return null;
    }

    const aliases = await this.findAliasesByCanonicalId(id, userId);

    return {
      id: row.id,
      userId: row.userId,
      canonicalName: row.canonicalName,
      entityType: row.entityType as EntityType,
      status: row.status as CanonicalEntityStatus,
      mergedIntoId: row.mergedIntoId,
      currentCanonicalId: row.currentCanonicalId || row.id,
      description: row.description,
      aliases: aliases.map((a) => a.aliasName),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findEntityByName(
    canonicalName: string,
    entityType: EntityType,
    userId: string
  ): Promise<CanonicalEntity | null> {
    const [row] = await this.db
      .select()
      .from(canonicalEntities)
      .where(
        and(
          eq(canonicalEntities.userId, userId),
          eq(canonicalEntities.entityType, entityType),
          eq(canonicalEntities.canonicalName, canonicalName)
        )
      )
      .limit(1);

    if (!row) {
      return null;
    }

    return this.findEntityById(row.id, userId);
  }

  async listEntities(
    userId: string,
    options: {
      entityType?: EntityType;
      status?: CanonicalEntityStatus;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<CanonicalEntity[]> {
    const conditions = [eq(canonicalEntities.userId, userId)];
    if (options.entityType) {
      conditions.push(eq(canonicalEntities.entityType, options.entityType));
    }
    if (options.status) {
      conditions.push(eq(canonicalEntities.status, options.status));
    }

    const rows = await this.db
      .select()
      .from(canonicalEntities)
      .where(and(...conditions))
      .orderBy(desc(canonicalEntities.createdAt))
      .limit(options.limit || 50)
      .offset(options.offset || 0);

    return Promise.all(
      rows.map((row) => this.findEntityById(row.id, userId))
    ).then((results) => results.filter((e): e is CanonicalEntity => e !== null));
  }

  async updateEntity(
    id: string,
    userId: string,
    updates: Partial<CanonicalEntity>
  ): Promise<CanonicalEntity> {
    const [row] = await this.db
      .update(canonicalEntities)
      .set({
        canonicalName: updates.canonicalName,
        status: updates.status,
        mergedIntoId: updates.mergedIntoId,
        currentCanonicalId: updates.currentCanonicalId,
        description: updates.description,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(canonicalEntities.id, id),
          eq(canonicalEntities.userId, userId)
        )
      )
      .returning();

    if (!row) {
      throw new Error(`Entity ${id} not found for user ${userId}`);
    }

    return (await this.findEntityById(id, userId))!;
  }

  async addAlias(input: {
    userId: string;
    canonicalId: string;
    aliasName: string;
    status?: EntityAliasStatus;
    sourceMemoryId?: string | null;
    verificationActor?: string;
  }): Promise<EntityAlias> {
    const norm = normalizeText(input.aliasName);
    const [row] = await this.db
      .insert(entityAliases)
      .values({
        userId: input.userId,
        canonicalId: input.canonicalId,
        aliasName: input.aliasName,
        normalizedAlias: norm,
        status: input.status || 'ACTIVE',
        verificationActor: input.verificationActor || 'SYSTEM',
        sourceMemoryId: input.sourceMemoryId,
      })
      .returning();

    return {
      id: row.id,
      userId: row.userId,
      canonicalId: row.canonicalId,
      aliasName: row.aliasName,
      normalizedAlias: row.normalizedAlias,
      status: row.status as EntityAliasStatus,
      verificationActor: row.verificationActor,
      sourceMemoryId: row.sourceMemoryId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findAliasesByCanonicalId(
    canonicalId: string,
    userId: string
  ): Promise<EntityAlias[]> {
    const rows = await this.db
      .select()
      .from(entityAliases)
      .where(
        and(
          eq(entityAliases.canonicalId, canonicalId),
          eq(entityAliases.userId, userId)
        )
      );

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      canonicalId: r.canonicalId,
      aliasName: r.aliasName,
      normalizedAlias: r.normalizedAlias,
      status: r.status as EntityAliasStatus,
      verificationActor: r.verificationActor,
      sourceMemoryId: r.sourceMemoryId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  async findAliasByNormalized(
    normalizedAlias: string,
    userId: string
  ): Promise<EntityAlias | null> {
    const norm = normalizeText(normalizedAlias);
    const [row] = await this.db
      .select()
      .from(entityAliases)
      .where(
        and(
          eq(entityAliases.userId, userId),
          eq(entityAliases.normalizedAlias, norm),
          eq(entityAliases.status, 'ACTIVE')
        )
      )
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      userId: row.userId,
      canonicalId: row.canonicalId,
      aliasName: row.aliasName,
      normalizedAlias: row.normalizedAlias,
      status: row.status as EntityAliasStatus,
      verificationActor: row.verificationActor,
      sourceMemoryId: row.sourceMemoryId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async recordProvenance(
    input: Omit<EntityResolutionProvenance, 'id' | 'createdAt'>
  ): Promise<EntityResolutionProvenance> {
    const [row] = await this.db
      .insert(entityResolutionProvenance)
      .values({
        userId: input.userId,
        mentionId: input.mentionId,
        sourceFragmentId: input.sourceFragmentId,
        sourceFragmentRevisionId: input.sourceFragmentRevisionId,
        sourceContentHash: input.sourceContentHash,
        sourceMemoryId: input.sourceMemoryId,
        canonicalId: input.canonicalId,
        surfaceMention: input.surfaceMention,
        resolutionMethod: input.resolutionMethod,
        similarityScore: input.similarityScore,
        separationMargin: input.separationMargin,
        resolverVersion: input.resolverVersion,
        decidedBy: input.decidedBy,
      })
      .returning();

    return {
      id: row.id,
      userId: row.userId,
      mentionId: row.mentionId,
      sourceFragmentId: row.sourceFragmentId,
      sourceFragmentRevisionId: row.sourceFragmentRevisionId,
      sourceContentHash: row.sourceContentHash,
      sourceMemoryId: row.sourceMemoryId,
      canonicalId: row.canonicalId,
      surfaceMention: row.surfaceMention,
      resolutionMethod: row.resolutionMethod,
      similarityScore: row.similarityScore,
      separationMargin: row.separationMargin,
      resolverVersion: row.resolverVersion,
      decidedBy: row.decidedBy,
      createdAt: row.createdAt,
    };
  }

  async findProvenanceByFragmentId(
    fragmentId: string,
    userId: string
  ): Promise<EntityResolutionProvenance[]> {
    const rows = await this.db
      .select()
      .from(entityResolutionProvenance)
      .where(
        and(
          eq(entityResolutionProvenance.sourceFragmentId, fragmentId),
          eq(entityResolutionProvenance.userId, userId)
        )
      );

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      mentionId: r.mentionId,
      sourceFragmentId: r.sourceFragmentId,
      sourceFragmentRevisionId: r.sourceFragmentRevisionId,
      sourceContentHash: r.sourceContentHash,
      sourceMemoryId: r.sourceMemoryId,
      canonicalId: r.canonicalId,
      surfaceMention: r.surfaceMention,
      resolutionMethod: r.resolutionMethod,
      similarityScore: r.similarityScore,
      separationMargin: r.separationMargin,
      resolverVersion: r.resolverVersion,
      decidedBy: r.decidedBy,
      createdAt: r.createdAt,
    }));
  }

  async findProvenanceByEntityId(
    canonicalId: string,
    userId: string
  ): Promise<EntityResolutionProvenance[]> {
    const rows = await this.db
      .select()
      .from(entityResolutionProvenance)
      .where(
        and(
          eq(entityResolutionProvenance.canonicalId, canonicalId),
          eq(entityResolutionProvenance.userId, userId)
        )
      );

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      mentionId: r.mentionId,
      sourceFragmentId: r.sourceFragmentId,
      sourceFragmentRevisionId: r.sourceFragmentRevisionId,
      sourceContentHash: r.sourceContentHash,
      sourceMemoryId: r.sourceMemoryId,
      canonicalId: r.canonicalId,
      surfaceMention: r.surfaceMention,
      resolutionMethod: r.resolutionMethod,
      similarityScore: r.similarityScore,
      separationMargin: r.separationMargin,
      resolverVersion: r.resolverVersion,
      decidedBy: r.decidedBy,
      createdAt: r.createdAt,
    }));
  }

  async enqueueCandidate(
    input: Omit<CandidateConfirmationItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<CandidateConfirmationItem> {
    const [row] = await this.db
      .insert(candidateConfirmationQueue)
      .values({
        userId: input.userId,
        surfaceMention: input.surfaceMention,
        entityType: input.entityType,
        suggestedCanonicalId: input.suggestedCanonicalId,
        similarityScore: input.similarityScore,
        sourceMemoryId: input.sourceMemoryId,
        sourceFragmentId: input.sourceFragmentId,
        status: input.status,
      })
      .returning();

    return {
      id: row.id,
      userId: row.userId,
      surfaceMention: row.surfaceMention,
      entityType: row.entityType as EntityType,
      suggestedCanonicalId: row.suggestedCanonicalId,
      similarityScore: row.similarityScore,
      sourceMemoryId: row.sourceMemoryId,
      sourceFragmentId: row.sourceFragmentId,
      status: row.status as ConfirmationStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async listPendingCandidates(userId: string): Promise<CandidateConfirmationItem[]> {
    const rows = await this.db
      .select()
      .from(candidateConfirmationQueue)
      .where(
        and(
          eq(candidateConfirmationQueue.userId, userId),
          eq(candidateConfirmationQueue.status, 'PENDING')
        )
      )
      .orderBy(desc(candidateConfirmationQueue.createdAt));

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      surfaceMention: r.surfaceMention,
      entityType: r.entityType as EntityType,
      suggestedCanonicalId: r.suggestedCanonicalId,
      similarityScore: r.similarityScore,
      sourceMemoryId: r.sourceMemoryId,
      sourceFragmentId: r.sourceFragmentId,
      status: r.status as ConfirmationStatus,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  async updateCandidateStatus(
    id: string,
    userId: string,
    status: ConfirmationStatus
  ): Promise<CandidateConfirmationItem> {
    const [row] = await this.db
      .update(candidateConfirmationQueue)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(candidateConfirmationQueue.id, id),
          eq(candidateConfirmationQueue.userId, userId)
        )
      )
      .returning();

    if (!row) {
      throw new Error(`Candidate item ${id} not found for user ${userId}`);
    }

    return {
      id: row.id,
      userId: row.userId,
      surfaceMention: row.surfaceMention,
      entityType: row.entityType as EntityType,
      suggestedCanonicalId: row.suggestedCanonicalId,
      similarityScore: row.similarityScore,
      sourceMemoryId: row.sourceMemoryId,
      sourceFragmentId: row.sourceFragmentId,
      status: row.status as ConfirmationStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async createRelationship(
    input: Omit<GraphRelationship, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<GraphRelationship> {
    const [row] = await this.db
      .insert(kgRelationships)
      .values({
        userId: input.userId,
        sourceEntityId: input.sourceEntityId,
        targetEntityId: input.targetEntityId,
        relationType: input.relationType,
        confidence: input.confidence,
        evidenceCount: input.evidenceCount,
        sourceFragmentId: input.sourceFragmentId,
        sourceMemoryId: input.sourceMemoryId,
        sourceContentHash: input.sourceContentHash,
        extractionRunId: input.extractionRunId,
        status: input.status,
        assertedAt: input.assertedAt,
        validAt: input.validAt,
      })
      .returning();

    return {
      id: row.id,
      userId: row.userId,
      sourceEntityId: row.sourceEntityId,
      targetEntityId: row.targetEntityId,
      relationType: row.relationType as RelationshipType,
      confidence: row.confidence,
      evidenceCount: row.evidenceCount,
      sourceFragmentId: row.sourceFragmentId,
      sourceMemoryId: row.sourceMemoryId,
      sourceContentHash: row.sourceContentHash,
      extractionRunId: row.extractionRunId,
      status: row.status,
      assertedAt: row.assertedAt,
      validAt: row.validAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findRelationshipsByEntity(
    entityId: string,
    userId: string
  ): Promise<GraphRelationship[]> {
    const rows = await this.db
      .select()
      .from(kgRelationships)
      .where(
        and(
          eq(kgRelationships.userId, userId),
          eq(kgRelationships.status, 'ACTIVE'),
          or(
            eq(kgRelationships.sourceEntityId, entityId),
            eq(kgRelationships.targetEntityId, entityId)
          )
        )
      );

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      sourceEntityId: r.sourceEntityId,
      targetEntityId: r.targetEntityId,
      relationType: r.relationType as RelationshipType,
      confidence: r.confidence,
      evidenceCount: r.evidenceCount,
      sourceFragmentId: r.sourceFragmentId,
      sourceMemoryId: r.sourceMemoryId,
      sourceContentHash: r.sourceContentHash,
      extractionRunId: r.extractionRunId,
      status: r.status,
      assertedAt: r.assertedAt,
      validAt: r.validAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  async findRelationshipsByFragment(
    fragmentId: string,
    userId: string
  ): Promise<GraphRelationship[]> {
    const rows = await this.db
      .select()
      .from(kgRelationships)
      .where(
        and(
          eq(kgRelationships.userId, userId),
          eq(kgRelationships.sourceFragmentId, fragmentId)
        )
      );

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      sourceEntityId: r.sourceEntityId,
      targetEntityId: r.targetEntityId,
      relationType: r.relationType as RelationshipType,
      confidence: r.confidence,
      evidenceCount: r.evidenceCount,
      sourceFragmentId: r.sourceFragmentId,
      sourceMemoryId: r.sourceMemoryId,
      sourceContentHash: r.sourceContentHash,
      extractionRunId: r.extractionRunId,
      status: r.status,
      assertedAt: r.assertedAt,
      validAt: r.validAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  async getSubgraph(
    userId: string,
    options: SubgraphQueryOptions
  ): Promise<SubgraphResult> {
    const visitedEntityIds = new Set<string>();
    const edges: GraphRelationship[] = [];

    if (options.entityId) {
      visitedEntityIds.add(options.entityId);
      const directRels = await this.findRelationshipsByEntity(
        options.entityId,
        userId
      );
      for (const r of directRels) {
        if (!options.relationTypes || options.relationTypes.includes(r.relationType)) {
          edges.push(r);
          visitedEntityIds.add(r.sourceEntityId);
          visitedEntityIds.add(r.targetEntityId);
        }
      }
    } else if (options.fragmentId) {
      const fragRels = await this.findRelationshipsByFragment(
        options.fragmentId,
        userId
      );
      for (const r of fragRels) {
        edges.push(r);
        visitedEntityIds.add(r.sourceEntityId);
        visitedEntityIds.add(r.targetEntityId);
      }
    } else {
      const recentRows = await this.db
        .select()
        .from(kgRelationships)
        .where(
          and(
            eq(kgRelationships.userId, userId),
            eq(kgRelationships.status, 'ACTIVE')
          )
        )
        .orderBy(desc(kgRelationships.createdAt))
        .limit(options.limit || 20);

      for (const r of recentRows) {
        edges.push({
          id: r.id,
          userId: r.userId,
          sourceEntityId: r.sourceEntityId,
          targetEntityId: r.targetEntityId,
          relationType: r.relationType as RelationshipType,
          confidence: r.confidence,
          evidenceCount: r.evidenceCount,
          sourceFragmentId: r.sourceFragmentId,
          sourceMemoryId: r.sourceMemoryId,
          sourceContentHash: r.sourceContentHash,
          extractionRunId: r.extractionRunId,
          status: r.status,
          assertedAt: r.assertedAt,
          validAt: r.validAt,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        });
        visitedEntityIds.add(r.sourceEntityId);
        visitedEntityIds.add(r.targetEntityId);
      }
    }

    const nodes: CanonicalEntity[] = [];
    for (const id of visitedEntityIds) {
      const ent = await this.findEntityById(id, userId);
      if (ent) {
        nodes.push(ent);
      }
    }

    return { nodes, edges };
  }
}
