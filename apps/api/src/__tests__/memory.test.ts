import { describe, it, expect, vi } from 'vitest';
import app from '../index.js';
import {
  CognitiveFragment,
  CreateCognitiveFragmentInput,
  ICognitiveFragmentRepository,
  CaptureQueryOptions,
  PaginatedResult,
  Memory,
  MemorySearchResult,
  MemorySearchOptions,
  MemoryRepository,
} from '@cognitive-engine/shared';

// Mock DB connection for fast unit/integration API tests
vi.mock('@cognitive-engine/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@cognitive-engine/shared')>();

  class MockFragmentRepo implements ICognitiveFragmentRepository {
    private store = new Map<string, CognitiveFragment>();

    async create(input: CreateCognitiveFragmentInput): Promise<CognitiveFragment> {
      const fragment: CognitiveFragment = {
        id: input.id || crypto.randomUUID(),
        userId: input.userId,
        content: input.content,
        modality: input.modality || 'text',
        contentHash: input.contentHash,
        capturedAt: input.capturedAt || new Date(),
        metadata: input.metadata || { schemaVersion: 1, source: 'api' },
      };
      this.store.set(fragment.id, fragment);
      return fragment;
    }

    async findById(id: string, userId: string): Promise<CognitiveFragment | null> {
      const found = this.store.get(id);
      if (!found || found.userId !== userId) {
        return null;
      }
      return found;
    }

    async findRecentByHash(
      userId: string,
      contentHash: string,
      windowSeconds = 10
    ): Promise<CognitiveFragment | null> {
      const cutoff = Date.now() - windowSeconds * 1000;
      const matches = Array.from(this.store.values()).filter(
        (f) =>
          f.userId === userId &&
          f.contentHash === contentHash &&
          f.capturedAt.getTime() >= cutoff
      );
      return matches.sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime())[0] || null;
    }

    async findAll(
      userId: string,
      options: CaptureQueryOptions = {}
    ): Promise<PaginatedResult<CognitiveFragment>> {
      const page = options.page || 1;
      const limit = options.limit || 20;

      const items = Array.from(this.store.values()).filter(
        (f) => f.userId === userId
      );

      items.sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime());

      const total = items.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const start = (page - 1) * limit;
      const data = items.slice(start, start + limit);

      return {
        data,
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
  }

  class MockMemoryRepo implements MemoryRepository {
    private store = new Map<string, Memory>();

    async create(data: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Memory> {
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
      const found = this.store.get(id);
      if (!found || found.userId !== userId) return null;
      return found;
    }

    async findByFragmentId(fragmentId: string, userId: string): Promise<Memory | null> {
      for (const m of this.store.values()) {
        if (m.fragmentId === fragmentId && m.userId === userId) return m;
      }
      return null;
    }

    async searchSimilar(
      userId: string,
      _queryEmbedding: number[],
      _options?: MemorySearchOptions
    ): Promise<MemorySearchResult[]> {
      const userMems = Array.from(this.store.values()).filter((m) => m.userId === userId);
      return userMems.map((memory) => ({
        memory,
        similarity: 0.85,
      }));
    }
  }

  const mockFragRepo = new MockFragmentRepo();
  const mockMemRepo = new MockMemoryRepo();

  return {
    ...actual,
    DrizzleCognitiveFragmentRepository: vi.fn(() => mockFragRepo),
    DrizzleMemoryRepository: vi.fn(() => mockMemRepo),
    CaptureEngine: class extends actual.CaptureEngine {
      constructor() {
        super(mockFragRepo);
      }
    },
    MemoryEngine: class extends actual.MemoryEngine {
      constructor() {
        super(mockMemRepo, mockFragRepo, new actual.MockEmbeddingProvider());
      }
    },
    checkDatabaseHealth: vi.fn(async () => ({ connected: true, latencyMs: 2 })),
  };
});

describe('Memory Engine API (/memory) — Sprint 1C-B', () => {
  const tokenUserA = 'Bearer test_token_user_A';
  const tokenUserB = 'Bearer test_token_user_B';

  it('should reject unauthenticated requests with 401 Unauthorized', async () => {
    const res = await app.request('/memory/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'finance' }),
    });

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('should transform a CognitiveFragment into a Memory via POST /memory/from-fragment', async () => {
    // 1. Create a fragment as User A
    const capRes = await app.request('/capture', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: tokenUserA,
      },
      body: JSON.stringify({
        text: 'Continued implementing accounting ledger reconciliation.',
        modality: 'text',
      }),
    });
    expect(capRes.status).toBe(201);
    const capBody = (await capRes.json()) as CognitiveFragment;
    const fragmentId = capBody.id;

    // 2. Derive Memory from fragmentId
    const memRes = await app.request('/memory/from-fragment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: tokenUserA,
      },
      body: JSON.stringify({ fragmentId }),
    });

    expect(memRes.status).toBe(201);
    const memBody = (await memRes.json()) as { data: { id: string; fragmentId: string; embedding: number[] } };
    expect(memBody.data.id).toBeDefined();
    expect(memBody.data.fragmentId).toBe(fragmentId);
    expect(memBody.data.embedding).toHaveLength(384);
  });

  it('should perform semantic similarity search via POST /memory/search for User A', async () => {
    const searchRes = await app.request('/memory/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: tokenUserA,
      },
      body: JSON.stringify({
        query: 'accounting ledger',
        topK: 5,
      }),
    });

    expect(searchRes.status).toBe(200);
    const searchBody = (await searchRes.json()) as { data: Array<{ memory: { userId: string }; similarity: number }> };
    expect(Array.isArray(searchBody.data)).toBe(true);
    expect(searchBody.data.length).toBeGreaterThan(0);
    expect(searchBody.data[0].memory).toBeDefined();
    expect(searchBody.data[0].similarity).toBeGreaterThan(0);
  });

  it('should enforce multi-tenant isolation (User B receives 0 results for User A memories)', async () => {
    const searchRes = await app.request('/memory/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: tokenUserB,
      },
      body: JSON.stringify({
        query: 'accounting ledger',
      }),
    });

    expect(searchRes.status).toBe(200);
    const searchBody = (await searchRes.json()) as { data: unknown[] };
    expect(searchBody.data).toHaveLength(0); // 0 User A memories leaked to User B
  });
});
