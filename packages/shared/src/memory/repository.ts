import { Memory, MemorySearchResult, MemorySearchOptions } from './types';

export interface MemoryRepository {
  /**
   * Persist a new Memory entity
   */
  create(memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Memory>;

  /**
   * Find Memory by ID and owner userId (Multi-tenant authorization)
   */
  findById(id: string, userId: string): Promise<Memory | null>;

  /**
   * Find existing Memory derived from a specific fragmentId
   */
  findByFragmentId(fragmentId: string, userId: string): Promise<Memory | null>;

  /**
   * Perform semantic vector similarity search
   */
  searchSimilar(
    userId: string,
    queryEmbedding: number[],
    options?: MemorySearchOptions
  ): Promise<MemorySearchResult[]>;
}

function computeCosineSimilarity(v1: number[], v2: number[]): number {
  if (!v1 || !v2 || v1.length !== v2.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < v1.length; i++) {
    dot += v1[i] * v2[i];
    normA += v1[i] * v1[i];
    normB += v2[i] * v2[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * In-Memory & Drizzle Compatible Memory Repository
 */
export class DrizzleMemoryRepository implements MemoryRepository {
  private store: Map<string, Memory> = new Map();

  async create(
    data: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Memory> {
    const memory: Memory = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.store.set(memory.id, memory);
    return memory;
  }

  async findById(id: string, userId: string): Promise<Memory | null> {
    const memory = this.store.get(id);
    if (!memory || memory.userId !== userId) {
      return null;
    }
    return memory;
  }

  async findByFragmentId(
    fragmentId: string,
    userId: string
  ): Promise<Memory | null> {
    for (const memory of this.store.values()) {
      if (memory.fragmentId === fragmentId && memory.userId === userId) {
        return memory;
      }
    }
    return null;
  }

  async searchSimilar(
    userId: string,
    queryEmbedding: number[],
    options?: MemorySearchOptions
  ): Promise<MemorySearchResult[]> {
    const topK = options?.topK ?? 5;
    const minSim = options?.minSimilarity ?? 0.0;

    const userMemories = Array.from(this.store.values()).filter(
      (m) => m.userId === userId
    );

    const scoredResults: MemorySearchResult[] = userMemories
      .map((memory) => ({
        memory,
        similarity: computeCosineSimilarity(queryEmbedding, memory.embedding),
      }))
      .filter((res) => res.similarity >= minSim)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    return scoredResults;
  }
}
