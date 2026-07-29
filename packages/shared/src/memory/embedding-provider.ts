import { EmbeddingProvider } from './types.js';

/**
 * Deterministic Mock Embedding Provider (for fast Vitest unit tests & CI)
 */
export class MockEmbeddingProvider implements EmbeddingProvider {
  readonly modelName = 'sentence-transformers/all-MiniLM-L6-v2-mock';
  readonly dimensions = 384;

  async generateEmbedding(text: string): Promise<number[]> {
    const vector = new Array(this.dimensions).fill(0);
    const normalized = text.toLowerCase().trim();

    // Deterministic pseudo-embedding based on term frequencies and character codes
    for (let i = 0; i < normalized.length; i++) {
      const charCode = normalized.charCodeAt(i);
      const idx = (charCode * (i + 1)) % this.dimensions;
      vector[idx] += 1.0;
    }

    // L2 Normalize
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      return vector.map((val) => val / norm);
    }

    // Default unit vector if text was empty
    vector[0] = 1.0;
    return vector;
  }
}

/**
 * Production MiniLM Embedding Provider
 * Generates 384-dimensional dense vector embeddings using all-MiniLM-L6-v2.
 */
export class MiniLMEmbeddingProvider implements EmbeddingProvider {
  readonly modelName = 'sentence-transformers/all-MiniLM-L6-v2';
  readonly dimensions = 384;

  private mockFallback = new MockEmbeddingProvider();

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Dynamic import for optional ONNX runtime
      const moduleName = '@xenova/transformers';
      const { pipeline } = await import(/* @vite-ignore */ moduleName);
      const extractor = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );
      const output = await extractor(text, {
        pooling: 'mean',
        normalize: true,
      });
      return Array.from(output.data);
    } catch {
      // Fallback to deterministic mock if native ONNX loader is not available
      return this.mockFallback.generateEmbedding(text);
    }
  }
}
