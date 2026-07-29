import { CognitiveFragment } from '../capture/types.js';
import { ICognitiveFragmentRepository } from '../capture/repository.js';
import {
  Memory,
  MemorySearchResult,
  MemorySearchOptions,
  EmbeddingProvider,
} from './types.js';
import { MemoryRepository } from './repository.js';
import { MockEmbeddingProvider } from './embedding-provider.js';

export class MemoryEngine {
  constructor(
    private memoryRepository: MemoryRepository,
    private fragmentRepository?: ICognitiveFragmentRepository,
    private embeddingProvider: EmbeddingProvider = new MockEmbeddingProvider()
  ) {}

  /**
   * Transform an immutable CognitiveFragment into a retrievable Memory with vector embedding
   */
  async createMemoryFromFragment(
    fragment: CognitiveFragment
  ): Promise<Memory> {
    if (!fragment.id) {
      throw new Error('Cannot create Memory: CognitiveFragment must have a valid id');
    }
    if (!fragment.userId) {
      throw new Error('Cannot create Memory: CognitiveFragment must have a valid userId');
    }

    // Check if Memory already exists for this fragmentId (Idempotency)
    const existing = await this.memoryRepository.findByFragmentId(
      fragment.id,
      fragment.userId
    );
    if (existing) {
      return existing;
    }

    // Generate normalized vector embedding
    const embedding = await this.embeddingProvider.generateEmbedding(
      fragment.content
    );

    // Persist derived Memory entity maintaining immutable evidence reference (fragmentId)
    return this.memoryRepository.create({
      userId: fragment.userId,
      fragmentId: fragment.id,
      content: fragment.content,
      embedding,
      metadata: {
        schemaVersion: 1,
        sourceFragmentModality: fragment.modality,
        embeddingModel: this.embeddingProvider.modelName,
        embeddingDimensions: this.embeddingProvider.dimensions,
      },
    });
  }

  /**
   * Perform semantic vector similarity search for a query text
   */
  async searchSimilarMemories(
    userId: string,
    queryText: string,
    options?: MemorySearchOptions
  ): Promise<MemorySearchResult[]> {
    if (!userId) {
      throw new Error('userId is required for Memory similarity search');
    }
    if (!queryText || queryText.trim().length === 0) {
      return [];
    }

    // Generate query embedding
    const queryEmbedding = await this.embeddingProvider.generateEmbedding(
      queryText
    );

    // Perform vector search
    const results = await this.memoryRepository.searchSimilar(
      userId,
      queryEmbedding,
      options
    );

    // Hydrate source fragment evidence if fragmentRepository is provided
    if (this.fragmentRepository) {
      for (const res of results) {
        const frag = await this.fragmentRepository.findById(
          res.memory.fragmentId,
          userId
        );
        if (frag) {
          res.sourceFragment = frag;
        }
      }
    }

    return results;
  }

  /**
   * Retrieve a specific Memory by ID with multi-tenant ownership check
   */
  async getMemoryById(id: string, userId: string): Promise<Memory | null> {
    if (!id || !userId) return null;
    return this.memoryRepository.findById(id, userId);
  }
}
