import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { reflections, ReflectionSelect } from '../db/schema.js';
import { ReflectionRecord, ReflectionType, GroundedProposition, ReflectionSegment } from './types.js';

export interface ListReflectionsOptions {
  reflectionType?: ReflectionType;
  limit?: number;
  offset?: number;
}

export interface IReflectionRepository {
  saveReflection(reflection: ReflectionRecord): Promise<void>;
  getReflection(id: string, userId: string): Promise<ReflectionRecord | null>;
  listReflections(userId: string, options?: ListReflectionsOptions): Promise<ReflectionRecord[]>;
  getReflectionByClaimId(claimId: string, userId: string): Promise<ReflectionRecord | null>;
}

export class DrizzleReflectionRepository implements IReflectionRepository {
  async saveReflection(reflection: ReflectionRecord): Promise<void> {
    await db.insert(reflections).values({
      id: reflection.id,
      userId: reflection.userId,
      sourceClaimId: reflection.sourceClaimId,
      evidenceChainId: reflection.evidenceChainId,
      reflectionType: reflection.reflectionType,
      text: reflection.text,
      structuredPropositions: [...reflection.structuredPropositions],
      groundedSegments: [...reflection.groundedSegments],
      chainIntegrityHash: reflection.chainIntegrityHash,
      bundleIntegrityHash: reflection.bundleIntegrityHash,
      canonicalizationVersion: reflection.canonicalizationVersion,
      synthesisMethod: reflection.synthesisMethod,
      engineVersion: reflection.engineVersion,
      promptVersion: reflection.promptVersion,
      modelInfo: reflection.modelInfo,
      validationDetails: reflection.validationDetails,
      temporalStart: reflection.temporalScope.startDate,
      temporalEnd: reflection.temporalScope.endDate,
      createdAt: reflection.createdAt,
    });
  }

  async getReflection(id: string, userId: string): Promise<ReflectionRecord | null> {
    const rows = await db
      .select()
      .from(reflections)
      .where(and(eq(reflections.id, id), eq(reflections.userId, userId)))
      .limit(1);

    if (rows.length === 0) return null;
    return this.mapRow(rows[0]);
  }

  async listReflections(
    userId: string,
    options: ListReflectionsOptions = {}
  ): Promise<ReflectionRecord[]> {
    const { reflectionType, limit = 50, offset = 0 } = options;

    const conditions = [eq(reflections.userId, userId)];
    if (reflectionType) {
      conditions.push(eq(reflections.reflectionType, reflectionType));
    }

    const rows = await db
      .select()
      .from(reflections)
      .where(and(...conditions))
      .orderBy(desc(reflections.createdAt))
      .limit(limit)
      .offset(offset);

    return rows.map((r) => this.mapRow(r));
  }

  async getReflectionByClaimId(claimId: string, userId: string): Promise<ReflectionRecord | null> {
    const rows = await db
      .select()
      .from(reflections)
      .where(and(eq(reflections.sourceClaimId, claimId), eq(reflections.userId, userId)))
      .limit(1);

    if (rows.length === 0) return null;
    return this.mapRow(rows[0]);
  }

  private mapRow(row: ReflectionSelect): ReflectionRecord {
    return {
      id: row.id,
      userId: row.userId,
      sourceClaimId: row.sourceClaimId,
      evidenceChainId: row.evidenceChainId,
      reflectionType: row.reflectionType as ReflectionType,
      text: row.text,
      structuredPropositions: (row.structuredPropositions as GroundedProposition[]) || [],
      groundedSegments: (row.groundedSegments as ReflectionSegment[]) || [],
      chainIntegrityHash: row.chainIntegrityHash,
      bundleIntegrityHash: row.bundleIntegrityHash,
      canonicalizationVersion: row.canonicalizationVersion,
      synthesisMethod: row.synthesisMethod as ReflectionRecord['synthesisMethod'],
      engineVersion: row.engineVersion,
      promptVersion: row.promptVersion,
      modelInfo: (row.modelInfo as Record<string, unknown>) || {},
      validationDetails: (row.validationDetails as Record<string, unknown>) || {},
      temporalScope: {
        startDate: row.temporalStart,
        endDate: row.temporalEnd,
      },
      createdAt: row.createdAt,
    };
  }
}

export class InMemoryReflectionRepository implements IReflectionRepository {
  private reflections = new Map<string, ReflectionRecord>();

  async saveReflection(reflection: ReflectionRecord): Promise<void> {
    this.reflections.set(`${reflection.userId}:${reflection.id}`, { ...reflection });
  }

  async getReflection(id: string, userId: string): Promise<ReflectionRecord | null> {
    const r = this.reflections.get(`${userId}:${id}`);
    return r ? { ...r } : null;
  }

  async listReflections(
    userId: string,
    options: ListReflectionsOptions = {}
  ): Promise<ReflectionRecord[]> {
    const { reflectionType, limit = 50, offset = 0 } = options;
    const all = Array.from(this.reflections.values()).filter((r) => r.userId === userId);

    const filtered = reflectionType ? all.filter((r) => r.reflectionType === reflectionType) : all;

    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return filtered.slice(offset, offset + limit);
  }

  async getReflectionByClaimId(claimId: string, userId: string): Promise<ReflectionRecord | null> {
    const match = Array.from(this.reflections.values()).find(
      (r) => r.userId === userId && r.sourceClaimId === claimId
    );
    return match ? { ...match } : null;
  }

  clear(): void {
    this.reflections.clear();
  }
}
