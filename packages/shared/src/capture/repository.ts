import { eq, and, gte, lte, count, desc } from 'drizzle-orm';
import { db as defaultDb } from '../db/index.js';
import { cognitiveFragments } from '../db/schema.js';
import {
  CognitiveFragment,
  CreateCognitiveFragmentInput,
  CognitiveFragmentModality,
  CaptureQueryOptions,
  PaginatedResult,
  CaptureMetadata,
} from './types.js';

export interface ICognitiveFragmentRepository {
  create(input: CreateCognitiveFragmentInput): Promise<CognitiveFragment>;
  findById(id: string, userId: string): Promise<CognitiveFragment | null>;
  findRecentByHash(
    userId: string,
    contentHash: string,
    windowSeconds: number
  ): Promise<CognitiveFragment | null>;
  findAll(
    userId: string,
    options?: CaptureQueryOptions
  ): Promise<PaginatedResult<CognitiveFragment>>;
}

export class DrizzleCognitiveFragmentRepository
  implements ICognitiveFragmentRepository
{
  constructor(private readonly db = defaultDb) {}

  async create(input: CreateCognitiveFragmentInput): Promise<CognitiveFragment> {
    const [inserted] = await this.db
      .insert(cognitiveFragments)
      .values({
        userId: input.userId,
        content: input.content,
        modality: input.modality ?? 'text',
        contentHash: input.contentHash,
        metadata: input.metadata ?? { schemaVersion: 1, source: 'api' },
        ...(input.id ? { id: input.id } : {}),
        ...(input.capturedAt ? { capturedAt: input.capturedAt } : {}),
      })
      .returning();

    return this.mapToDomain(inserted);
  }

  async findById(id: string, userId: string): Promise<CognitiveFragment | null> {
    const [found] = await this.db
      .select()
      .from(cognitiveFragments)
      .where(
        and(
          eq(cognitiveFragments.id, id),
          eq(cognitiveFragments.userId, userId)
        )
      )
      .limit(1);

    if (!found) {
      return null;
    }

    return this.mapToDomain(found);
  }

  async findRecentByHash(
    userId: string,
    contentHash: string,
    windowSeconds = 10
  ): Promise<CognitiveFragment | null> {
    const cutoff = new Date(Date.now() - windowSeconds * 1000);

    const [recent] = await this.db
      .select()
      .from(cognitiveFragments)
      .where(
        and(
          eq(cognitiveFragments.userId, userId),
          eq(cognitiveFragments.contentHash, contentHash),
          gte(cognitiveFragments.capturedAt, cutoff)
        )
      )
      .orderBy(desc(cognitiveFragments.capturedAt))
      .limit(1);

    if (!recent) {
      return null;
    }

    return this.mapToDomain(recent);
  }

  async findAll(
    userId: string,
    options: CaptureQueryOptions = {}
  ): Promise<PaginatedResult<CognitiveFragment>> {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));
    const offset = (page - 1) * limit;

    const conditions = [eq(cognitiveFragments.userId, userId)];

    if (options.modality) {
      conditions.push(eq(cognitiveFragments.modality, options.modality));
    }
    if (options.startDate) {
      conditions.push(gte(cognitiveFragments.capturedAt, options.startDate));
    }
    if (options.endDate) {
      conditions.push(lte(cognitiveFragments.capturedAt, options.endDate));
    }

    const whereClause = and(...conditions);

    const [{ totalCount }] = await this.db
      .select({ totalCount: count() })
      .from(cognitiveFragments)
      .where(whereClause);

    const rows = await this.db
      .select()
      .from(cognitiveFragments)
      .where(whereClause)
      .orderBy(desc(cognitiveFragments.capturedAt))
      .limit(limit)
      .offset(offset);

    const total = Number(totalCount);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: rows.map((row) => this.mapToDomain(row)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  private mapToDomain(
    row: typeof cognitiveFragments.$inferSelect
  ): CognitiveFragment {
    return {
      id: row.id,
      userId: row.userId,
      content: row.content,
      modality: row.modality as CognitiveFragmentModality,
      contentHash: row.contentHash,
      capturedAt: row.capturedAt,
      metadata: (row.metadata as CaptureMetadata) ?? {
        schemaVersion: 1,
        source: 'api',
      },
    };
  }
}
