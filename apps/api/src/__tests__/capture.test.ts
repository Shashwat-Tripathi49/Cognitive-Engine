import { describe, it, expect, vi } from 'vitest';
import app from '../index.js';
import {
  CognitiveFragment,
  CreateCognitiveFragmentInput,
  ICognitiveFragmentRepository,
} from '@cognitive-engine/shared';

// Mock DB connection for fast unit/integration API tests when local Postgres is offline
vi.mock('@cognitive-engine/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@cognitive-engine/shared')>();

  class MockRepository implements ICognitiveFragmentRepository {
    private store = new Map<string, CognitiveFragment>();

    async create(input: CreateCognitiveFragmentInput): Promise<CognitiveFragment> {
      const fragment: CognitiveFragment = {
        id: '11111111-1111-1111-1111-111111111111',
        userId: input.userId,
        content: input.content,
        modality: input.modality || 'text',
        contentHash: input.contentHash,
        capturedAt: new Date('2026-07-28T23:49:33.000Z'),
        metadata: input.metadata || {},
      };
      this.store.set(fragment.id, fragment);
      return fragment;
    }

    async findById(id: string): Promise<CognitiveFragment | null> {
      return this.store.get(id) || null;
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

describe('Capture API Endpoints (POST /capture & GET /capture/:id)', () => {
  it('should successfully capture a valid thought and return 201 Created', async () => {
    const res = await app.request('/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'I met Rahul today to discuss the Expense Tracker roadmap.',
      }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as CognitiveFragment;

    expect(body.id).toBe('11111111-1111-1111-1111-111111111111');
    expect(body.content).toBe('I met Rahul today to discuss the Expense Tracker roadmap.');
    expect(body.modality).toBe('text');
    expect(body.contentHash).toBeDefined();
    expect(body.capturedAt).toBeDefined();
  });

  it('should reject empty text with 400 Bad Request', async () => {
    const res = await app.request('/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '' }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('INVALID_INPUT');
    expect(body.error.message).toContain('empty');
  });

  it('should reject whitespace-only text with 400 Bad Request', async () => {
    const res = await app.request('/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '    \n\t   ' }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('INVALID_INPUT');
  });

  it('should retrieve a stored fragment by ID via GET /capture/:id', async () => {
    await app.request('/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Verification thought entry.',
      }),
    });

    const res = await app.request('/capture/11111111-1111-1111-1111-111111111111');
    expect(res.status).toBe(200);
    const body = (await res.json()) as CognitiveFragment;
    expect(body.id).toBe('11111111-1111-1111-1111-111111111111');
  });

  it('should return 404 Not Found for non-existent fragment ID', async () => {
    const res = await app.request('/capture/99999999-9999-9999-9999-999999999999');
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('NOT_FOUND');
  });
});
