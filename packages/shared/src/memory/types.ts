import { z } from 'zod';
import { CognitiveFragment } from '../capture/types';

/**
 * Memory Metadata Schema v1
 */
export const memoryMetadataSchema = z.object({
  schemaVersion: z.number().int().positive().default(1),
  sourceFragmentModality: z.string().optional(),
  embeddingModel: z.string().default('sentence-transformers/all-MiniLM-L6-v2'),
  embeddingDimensions: z.number().int().default(384),
}).passthrough();

export type MemoryMetadata = z.infer<typeof memoryMetadataSchema>;

/**
 * Memory Domain Model
 */
export interface Memory {
  id: string;
  userId: string;
  fragmentId: string; // Direct reference to originating CognitiveFragment (Immutable Evidence)
  content: string;
  embedding: number[];
  metadata: MemoryMetadata;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Similarity Search Result Item
 */
export interface MemorySearchResult {
  memory: Memory;
  similarity: number; // Cosine similarity score [0.0, 1.0]
  sourceFragment?: CognitiveFragment; // Optional hydrated evidence fragment
}

/**
 * Embedding Provider Abstraction Interface
 *
 * Pluggable abstraction decoupling Memory Engine from specific ML embedding models.
 */
export interface EmbeddingProvider {
  /**
   * Model Identifier (e.g. 'sentence-transformers/all-MiniLM-L6-v2')
   */
  readonly modelName: string;

  /**
   * Vector Dimension count (e.g. 384)
   */
  readonly dimensions: number;

  /**
   * Generate normalized dense vector embedding for input text
   */
  generateEmbedding(text: string): Promise<number[]>;
}

/**
 * Query options for semantic similarity search
 */
export interface MemorySearchOptions {
  topK?: number; // Default: 5
  minSimilarity?: number; // Minimum cosine similarity threshold [0, 1]
}
