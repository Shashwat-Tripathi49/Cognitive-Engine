import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryEngine } from '../engine';
import { DrizzleMemoryRepository } from '../repository';
import { MockEmbeddingProvider } from '../embedding-provider';
import { CognitiveFragment } from '../../capture/types';

describe('MemoryEngine (Sprint 1C-B)', () => {
  let memoryEngine: MemoryEngine;
  let memoryRepo: DrizzleMemoryRepository;
  let embeddingProvider: MockEmbeddingProvider;

  const mockFragmentA: CognitiveFragment = {
    id: 'frag-uuid-1111',
    userId: 'user-uuid-aaaa',
    content: 'Continued improving transaction synchronization for personal finance tool.',
    modality: 'text',
    contentHash: 'hash-1111',
    capturedAt: new Date('2026-03-01T10:00:00Z'),
    metadata: { schemaVersion: 1, source: 'api' },
  };

  const mockFragmentB: CognitiveFragment = {
    id: 'frag-uuid-2222',
    userId: 'user-uuid-aaaa',
    content: 'Pushed morning 5km run along the lake, average pace 5:15 per km.',
    modality: 'text',
    contentHash: 'hash-2222',
    capturedAt: new Date('2026-03-02T10:00:00Z'),
    metadata: { schemaVersion: 1, source: 'mobile' },
  };

  const mockFragmentUserB: CognitiveFragment = {
    id: 'frag-uuid-3333',
    userId: 'user-uuid-bbbb',
    content: 'Spent the afternoon debugging ledger state manager.',
    modality: 'text',
    contentHash: 'hash-3333',
    capturedAt: new Date('2026-03-03T10:00:00Z'),
    metadata: { schemaVersion: 1, source: 'web' },
  };

  beforeEach(() => {
    memoryRepo = new DrizzleMemoryRepository();
    embeddingProvider = new MockEmbeddingProvider();
    memoryEngine = new MemoryEngine(memoryRepo, undefined, embeddingProvider);
  });

  it('should transform a CognitiveFragment into a Memory with 384-D vector embedding and evidence link', async () => {
    const memory = await memoryEngine.createMemoryFromFragment(mockFragmentA);

    expect(memory.id).toBeDefined();
    expect(memory.userId).toBe('user-uuid-aaaa');
    expect(memory.fragmentId).toBe('frag-uuid-1111'); // Immutable evidence linkage
    expect(memory.content).toBe(mockFragmentA.content);
    expect(memory.embedding).toHaveLength(384);
    expect(memory.metadata.embeddingDimensions).toBe(384);
    expect(memory.metadata.sourceFragmentModality).toBe('text');
  });

  it('should maintain idempotency when transforming the same fragment multiple times', async () => {
    const mem1 = await memoryEngine.createMemoryFromFragment(mockFragmentA);
    const mem2 = await memoryEngine.createMemoryFromFragment(mockFragmentA);

    expect(mem1.id).toBe(mem2.id);
  });

  it('should perform semantic similarity search scoped to authenticated userId', async () => {
    await memoryEngine.createMemoryFromFragment(mockFragmentA);
    await memoryEngine.createMemoryFromFragment(mockFragmentB);
    await memoryEngine.createMemoryFromFragment(mockFragmentUserB);

    // Search query for finance / transaction sync (User A)
    const results = await memoryEngine.searchSimilarMemories(
      'user-uuid-aaaa',
      'finance transaction sync tool',
      { topK: 5 }
    );

    expect(results).toHaveLength(2); // Only User A's 2 memories returned
    expect(results[0].memory.userId).toBe('user-uuid-aaaa');
    expect(results.some((r) => r.memory.fragmentId === 'frag-uuid-3333')).toBe(false); // User B isolated
  });

  it('should respect topK search limits', async () => {
    await memoryEngine.createMemoryFromFragment(mockFragmentA);
    await memoryEngine.createMemoryFromFragment(mockFragmentB);

    const results = await memoryEngine.searchSimilarMemories(
      'user-uuid-aaaa',
      'running and finance',
      { topK: 1 }
    );

    expect(results).toHaveLength(1);
  });

  it('should return empty results for unauthenticated or non-matching queries', async () => {
    await memoryEngine.createMemoryFromFragment(mockFragmentA);

    const results = await memoryEngine.searchSimilarMemories(
      'non-existent-user',
      'transaction'
    );

    expect(results).toHaveLength(0);
  });
});
