import { eq, and, desc } from 'drizzle-orm';
import { db as defaultDb } from '../db/index.js';
import {
  evidenceChains,
  evidenceObjects,
  validatedClaims,
} from '../db/schema.js';
import {
  ValidatedClaim,
  EvidenceChain,
  ClaimStatus,
  FindingType,
} from './types.js';

export interface IReasoningRepository {
  saveClaim(claim: ValidatedClaim, chain: EvidenceChain): Promise<void>;
  findClaimById(id: string, userId: string): Promise<ValidatedClaim | null>;
  listClaims(
    userId: string,
    options?: {
      status?: ClaimStatus;
      claimType?: FindingType;
      limit?: number;
      offset?: number;
    }
  ): Promise<ValidatedClaim[]>;
  findChainById(id: string, userId: string): Promise<EvidenceChain | null>;
  findChainByFindingId(findingId: string, userId: string): Promise<EvidenceChain | null>;
}

/**
 * Drizzle PostgreSQL implementation of IReasoningRepository
 */
export class DrizzleReasoningRepository implements IReasoningRepository {
  constructor(private db: typeof defaultDb = defaultDb) {}

  async saveClaim(claim: ValidatedClaim, chain: EvidenceChain): Promise<void> {
    // 1. Insert EvidenceChain
    await this.db
      .insert(evidenceChains)
      .values({
        id: chain.id,
        userId: chain.userId,
        findingId: chain.findingId,
        isVerified: chain.isVerified,
        chainIntegrityHash: chain.chainIntegrityHash,
        rootFragmentIds: chain.rootFragmentIds,
        ruleEvaluations: chain.ruleEvaluations || [],
        verificationTimestamp: chain.verificationTimestamp,
        createdAt: chain.createdAt,
      })
      .onConflictDoNothing();

    // 2. Insert EvidenceObjects
    if (chain.evidenceObjects.length > 0) {
      await this.db
        .insert(evidenceObjects)
        .values(
          chain.evidenceObjects.map((ev) => ({
            id: ev.id,
            userId: ev.userId,
            chainId: chain.id,
            evidenceType: ev.evidenceType,
            sourceId: ev.sourceId,
            sourceContentHash: ev.sourceContentHash,
            sourceTimestamp: ev.sourceTimestamp,
            validFrom: ev.validFrom,
            validTo: ev.validTo,
            summary: ev.summary,
            verified: ev.verified,
            verificationDetails: ev.verificationDetails,
            metadata: ev.metadata || {},
            createdAt: new Date(),
          }))
        )
        .onConflictDoNothing();
    }

    // 3. Insert ValidatedClaim
    await this.db
      .insert(validatedClaims)
      .values({
        id: claim.id,
        userId: claim.userId,
        sourceFindingId: claim.sourceFindingId,
        evidenceChainId: claim.evidenceChainId,
        claimType: claim.claimType,
        status: claim.status,
        subjectEntityId: claim.subjectEntityId,
        objectEntityId: claim.objectEntityId,
        statement: claim.statement,
        deterministicSupportScore: claim.deterministicSupportScore,
        appliedRuleIds: claim.appliedRuleIds,
        passedRuleIds: claim.passedRuleIds,
        failedRuleIds: claim.failedRuleIds,
        rejectionReason: claim.rejectionReason,
        temporalStart: claim.temporalScope.startDate,
        temporalEnd: claim.temporalScope.endDate,
        reasoningVersion: claim.reasoningEngineVersion,
        createdAt: claim.createdAt,
        updatedAt: claim.updatedAt,
      })
      .onConflictDoNothing();
  }

  async findClaimById(id: string, userId: string): Promise<ValidatedClaim | null> {
    const rows = await this.db
      .select()
      .from(validatedClaims)
      .where(and(eq(validatedClaims.id, id), eq(validatedClaims.userId, userId)))
      .limit(1);

    if (rows.length === 0) return null;
    const r = rows[0];

    return {
      id: r.id,
      userId: r.userId,
      sourceFindingId: r.sourceFindingId,
      evidenceChainId: r.evidenceChainId,
      claimType: r.claimType as FindingType,
      status: r.status as ClaimStatus,
      subjectEntityId: r.subjectEntityId || undefined,
      objectEntityId: r.objectEntityId || undefined,
      statement: r.statement,
      deterministicSupportScore: r.deterministicSupportScore,
      appliedRuleIds: (r.appliedRuleIds as string[]) || [],
      passedRuleIds: (r.passedRuleIds as string[]) || [],
      failedRuleIds: (r.failedRuleIds as string[]) || [],
      rejectionReason: r.rejectionReason || undefined,
      temporalScope: {
        startDate: r.temporalStart,
        endDate: r.temporalEnd,
      },
      reasoningEngineVersion: r.reasoningVersion,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  async listClaims(
    userId: string,
    options?: {
      status?: ClaimStatus;
      claimType?: FindingType;
      limit?: number;
      offset?: number;
    }
  ): Promise<ValidatedClaim[]> {
    const conditions = [eq(validatedClaims.userId, userId)];
    if (options?.status) {
      conditions.push(eq(validatedClaims.status, options.status));
    }
    if (options?.claimType) {
      conditions.push(eq(validatedClaims.claimType, options.claimType));
    }

    const rows = await this.db
      .select()
      .from(validatedClaims)
      .where(and(...conditions))
      .orderBy(desc(validatedClaims.createdAt))
      .limit(options?.limit || 50)
      .offset(options?.offset || 0);

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      sourceFindingId: r.sourceFindingId,
      evidenceChainId: r.evidenceChainId,
      claimType: r.claimType as FindingType,
      status: r.status as ClaimStatus,
      subjectEntityId: r.subjectEntityId || undefined,
      objectEntityId: r.objectEntityId || undefined,
      statement: r.statement,
      deterministicSupportScore: r.deterministicSupportScore,
      appliedRuleIds: (r.appliedRuleIds as string[]) || [],
      passedRuleIds: (r.passedRuleIds as string[]) || [],
      failedRuleIds: (r.failedRuleIds as string[]) || [],
      rejectionReason: r.rejectionReason || undefined,
      temporalScope: {
        startDate: r.temporalStart,
        endDate: r.temporalEnd,
      },
      reasoningEngineVersion: r.reasoningVersion,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  async findChainById(id: string, userId: string): Promise<EvidenceChain | null> {
    const chainRows = await this.db
      .select()
      .from(evidenceChains)
      .where(and(eq(evidenceChains.id, id), eq(evidenceChains.userId, userId)))
      .limit(1);

    if (chainRows.length === 0) return null;
    const c = chainRows[0];

    const evRows = await this.db
      .select()
      .from(evidenceObjects)
      .where(and(eq(evidenceObjects.chainId, id), eq(evidenceObjects.userId, userId)));

    return {
      id: c.id,
      userId: c.userId,
      findingId: c.findingId,
      isVerified: c.isVerified,
      chainIntegrityHash: c.chainIntegrityHash,
      rootFragmentIds: (c.rootFragmentIds as string[]) || [],
      ruleEvaluations: (c.ruleEvaluations as any[]) || [],
      createdAt: c.createdAt,
      verificationTimestamp: c.verificationTimestamp,
      evidenceObjects: evRows.map((ev) => ({
        id: ev.id,
        userId: ev.userId,
        evidenceType: ev.evidenceType as any,
        sourceId: ev.sourceId,
        sourceContentHash: ev.sourceContentHash || undefined,
        sourceTimestamp: ev.sourceTimestamp || undefined,
        validFrom: ev.validFrom || undefined,
        validTo: ev.validTo || undefined,
        summary: ev.summary,
        verified: ev.verified,
        verificationDetails: ev.verificationDetails || undefined,
        metadata: (ev.metadata as Record<string, unknown>) || {},
      })),
    };
  }

  async findChainByFindingId(findingId: string, userId: string): Promise<EvidenceChain | null> {
    const chainRows = await this.db
      .select()
      .from(evidenceChains)
      .where(and(eq(evidenceChains.findingId, findingId), eq(evidenceChains.userId, userId)))
      .limit(1);

    if (chainRows.length === 0) return null;
    return this.findChainById(chainRows[0].id, userId);
  }
}

/**
 * In-Memory implementation of IReasoningRepository
 */
export class InMemoryReasoningRepository implements IReasoningRepository {
  private claims = new Map<string, ValidatedClaim>();
  private chains = new Map<string, EvidenceChain>();

  async saveClaim(claim: ValidatedClaim, chain: EvidenceChain): Promise<void> {
    this.chains.set(chain.id, chain);
    this.claims.set(claim.id, claim);
  }

  async findClaimById(id: string, userId: string): Promise<ValidatedClaim | null> {
    const c = this.claims.get(id);
    return c && c.userId === userId ? c : null;
  }

  async listClaims(
    userId: string,
    options?: {
      status?: ClaimStatus;
      claimType?: FindingType;
      limit?: number;
      offset?: number;
    }
  ): Promise<ValidatedClaim[]> {
    let result = Array.from(this.claims.values()).filter((c) => c.userId === userId);
    if (options?.status) {
      result = result.filter((c) => c.status === options.status);
    }
    if (options?.claimType) {
      result = result.filter((c) => c.claimType === options.claimType);
    }
    return result.slice(options?.offset || 0, (options?.offset || 0) + (options?.limit || 50));
  }

  async findChainById(id: string, userId: string): Promise<EvidenceChain | null> {
    const c = this.chains.get(id);
    return c && c.userId === userId ? c : null;
  }

  async findChainByFindingId(findingId: string, userId: string): Promise<EvidenceChain | null> {
    for (const chain of this.chains.values()) {
      if (chain.findingId === findingId && chain.userId === userId) {
        return chain;
      }
    }
    return null;
  }
}
