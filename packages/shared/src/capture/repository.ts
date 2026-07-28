import { eq } from 'drizzle-orm';
import { db as defaultDb } from '../db/index.js';
import { cognitiveFragments } from '../db/schema.js';
import {
  CognitiveFragment,
  CreateCognitiveFragmentInput,
  CognitiveFragmentModality,
} from './types.js';

export interface ICognitiveFragmentRepository {
  create(input: CreateCognitiveFragmentInput): Promise<CognitiveFragment>;
  findById(id: string): Promise<CognitiveFragment | null>;
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
        metadata: input.metadata ?? {},
        ...(input.id ? { id: input.id } : {}),
        ...(input.capturedAt ? { capturedAt: input.capturedAt } : {}),
      })
      .returning();

    return this.mapToDomain(inserted);
  }

  async findById(id: string): Promise<CognitiveFragment | null> {
    const [found] = await this.db
      .select()
      .from(cognitiveFragments)
      .where(eq(cognitiveFragments.id, id))
      .limit(1);

    if (!found) {
      return null;
    }

    return this.mapToDomain(found);
  }

  private mapToDomain(row: typeof cognitiveFragments.$inferSelect): CognitiveFragment {
    return {
      id: row.id,
      userId: row.userId,
      content: row.content,
      modality: row.modality as CognitiveFragmentModality,
      contentHash: row.contentHash,
      capturedAt: row.capturedAt,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
    };
  }
}
