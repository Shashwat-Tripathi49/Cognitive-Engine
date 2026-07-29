import { describe, it, expect, vi } from 'vitest';
import app from '../index.js';
import {
  CognitiveFragment,
  CreateCognitiveFragmentInput,
  ICognitiveFragmentRepository,
  CaptureQueryOptions,
  PaginatedResult,
} from '@cognitive-engine/shared';

// Mock DB connection for fast unit/integration API tests
vi.mock('@cognitive-engine/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@cognitive-engine/shared')>();

  class MockRepository implements ICognitiveFragmentRepository {
    private store = new Map<string, CognitiveFragment>();

    async create(input: CreateCognitiveFragmentInput): Promise<CognitiveFragment> {
      const fragment: CognitiveFragment = {
        id: input.id || `frag_${Math.random().toString(36).substring(2, 10)}`,
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

      let items = Array.from(this.store.values()).filter(
        (f) => f.userId === userId
      );

      if (options.modality) {
        items = items.filter((f) => f.modality === options.modality);
      }

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

  const mockRepoInstance = new MockRepository();

  return {
    ...actual,
    DrizzleCognitiveFragmentRepository: vi.fn(() => mockRepoInstance),
    CaptureEngine: class extends actual.CaptureEngine {
      constructor() {
        super(mockRepoInstance);
      }
    },
    checkDatabaseHealth: vi.fn(async () => ({ connected: true, latencyMs: 2 })),
  };
});

describe('Sprint 1C-A Authenticated Capture API Scenarios', () => {
  const tokenUserA = 'Bearer test_token_user_A';
  const tokenUserB = 'Bearer test_token_user_B';

  it('should reject unauthenticated requests with 401 Unauthorized', async () => {
    const res = await app.request('/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Unauthenticated thought' }),
    });

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('Verification Scenario 1: User A creates three journal entries and lists only their own fragments', async () => {
    const texts = [
      'User A entry 1: Roadmap discussion.',
      'User A entry 2: Architecture refactoring.',
      'User A entry 3: Sprint 1C-A milestone.',
    ];

    for (const text of texts) {
      const createRes = await app.request('/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: tokenUserA,
        },
        body: JSON.stringify({ text }),
      });
      expect(createRes.status).toBe(201);
    }

    const listRes = await app.request('/capture?page=1&limit=10', {
      method: 'GET',
      headers: { Authorization: tokenUserA },
    });

    expect(listRes.status).toBe(200);
    const body = (await listRes.json()) as PaginatedResult<CognitiveFragment>;

    expect(body.data.length).toBe(3);
    expect(body.pagination.total).toBe(3);
    expect(body.data[0]?.userId).toBe('11111111-1111-1111-1111-111111111111');
  });

  it('Verification Scenario 2: User B cannot access User A fragments or list User A data', async () => {
    // User A creates a secret entry
    const createRes = await app.request('/capture', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: tokenUserA,
      },
      body: JSON.stringify({ text: 'User A private thought entry' }),
    });

    const userAFrag = (await createRes.json()) as CognitiveFragment;

    // User B attempts to access User A's fragment by ID
    const getRes = await app.request(`/capture/${userAFrag.id}`, {
      method: 'GET',
      headers: { Authorization: tokenUserB },
    });

    expect(getRes.status).toBe(404); // Multi-tenant security isolation

    // User B lists fragments
    const listRes = await app.request('/capture', {
      method: 'GET',
      headers: { Authorization: tokenUserB },
    });

    const listBody = (await listRes.json()) as PaginatedResult<CognitiveFragment>;
    expect(listBody.data.length).toBe(0); // User B sees 0 entries
  });

  it('Verification Scenario 3: Repeated journal entries adhere to ContentHash policy', async () => {
    const text = 'Repeated daily reflection';

    const res1 = await app.request('/capture', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: tokenUserA,
      },
      body: JSON.stringify({ text }),
    });

    const res2 = await app.request('/capture', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: tokenUserA,
      },
      body: JSON.stringify({ text }),
    });

    const frag1 = (await res1.json()) as CognitiveFragment;
    const frag2 = (await res2.json()) as CognitiveFragment;

    // Rapid retry within 10s window returns identical fragment
    expect(frag1.id).toBe(frag2.id);
  });
});
