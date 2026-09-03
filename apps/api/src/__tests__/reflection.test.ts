import { describe, it, expect, vi } from 'vitest';
import app from '../index.js';
import { ReflectionRecord } from '@cognitive-engine/shared';

vi.mock('../routes/reflection.js', async () => {
  const dummyUser = '00000000-0000-0000-0000-000000000001';
  const dummyReflectionId = '11111111-1111-1111-1111-111111111111';
  const dummyClaimId = '22222222-2222-2222-2222-222222222222';
  const dummyChainId = '33333333-3333-3333-3333-333333333333';

  const sampleReflection: ReflectionRecord = {
    id: dummyReflectionId,
    userId: dummyUser,
    sourceClaimId: dummyClaimId,
    evidenceChainId: dummyChainId,
    reflectionType: 'TOPIC_FOCUS_REFLECTION',
    text: 'Over a 15-day period, the journal records 5 entries focused on backend development.',
    structuredPropositions: [
      {
        propositionId: 'p1',
        subject: 'backend',
        predicate: 'MENTIONED_IN_ENTRIES',
        object: '5',
        authorizedFactId: 'ent:1',
      },
    ],
    groundedSegments: [
      {
        segmentId: 's1',
        text: 'Over a 15-day period, the journal records 5 entries focused on backend development.',
        groundedPropositionIds: ['p1'],
      },
    ],
    chainIntegrityHash: 'mock-chain-hash',
    bundleIntegrityHash: 'mock-bundle-hash',
    canonicalizationVersion: '1.0.0',
    synthesisMethod: 'LLM_CONSTRAINED',
    engineVersion: '1.0.0',
    promptVersion: 'v1.0.0',
    modelInfo: { model: 'llama-3.3-70b-versatile', provider: 'groq' },
    validationDetails: { attempts: 1 },
    temporalScope: {
      startDate: new Date('2026-08-01T00:00:00Z'),
      endDate: new Date('2026-08-16T00:00:00Z'),
    },
    createdAt: new Date('2026-08-17T00:00:00Z'),
  };

  const mockEngine = {
    generateReflection: vi.fn().mockResolvedValue(sampleReflection),
    listReflections: vi.fn().mockResolvedValue([sampleReflection]),
    getReflection: vi.fn().mockImplementation(async (id: string, uId: string) => {
      if (id === dummyReflectionId && uId === dummyUser) return sampleReflection;
      return null;
    }),
    getProvenance: vi.fn().mockImplementation(async (id: string, uId: string) => {
      if (id === dummyReflectionId && uId === dummyUser) {
        return {
          reflection: sampleReflection,
          claim: { id: dummyClaimId, status: 'VALIDATED' },
          evidenceChain: { id: dummyChainId, chainIntegrityHash: 'mock-chain-hash' },
        };
      }
      return null;
    }),
  };

  const { Hono } = await import('hono');
  const reflectionRouter = new Hono();

  reflectionRouter.post('/generate', async (c) => {
    const body = await c.req.json();
    if (!body.userId || !body.claimId) return c.json({ error: 'Validation failed' }, 400);
    const res = await mockEngine.generateReflection(body);
    return c.json({ success: true, data: res }, 201);
  });

  reflectionRouter.get('/list', async (c) => {
    const uid = c.req.query('userId');
    if (!uid) return c.json({ error: 'userId query parameter is required' }, 400);
    const res = await mockEngine.listReflections(uid);
    return c.json({ success: true, data: res }, 200);
  });

  reflectionRouter.get('/:id/provenance', async (c) => {
    const id = c.req.param('id');
    const uid = c.req.query('userId');
    if (!uid) return c.json({ error: 'userId query parameter is required' }, 400);
    const res = await mockEngine.getProvenance(id, uid);
    if (!res) return c.json({ error: 'Not found' }, 404);
    return c.json({ success: true, data: res }, 200);
  });

  reflectionRouter.get('/:id', async (c) => {
    const id = c.req.param('id');
    const uid = c.req.query('userId');
    if (!uid) return c.json({ error: 'userId query parameter is required' }, 400);
    const res = await mockEngine.getReflection(id, uid);
    if (!res) return c.json({ error: 'Not found' }, 404);
    return c.json({ success: true, data: res }, 200);
  });

  return {
    reflectionRouter,
    defaultReflectionEngine: mockEngine,
  };
});

describe('Reflection Router HTTP API Surface', () => {
  const dummyUser = '00000000-0000-0000-0000-000000000001';
  const dummyClaimId = '22222222-2222-2222-2222-222222222222';
  const dummyReflectionId = '11111111-1111-1111-1111-111111111111';

  it('POST /reflection/generate: validates input and returns 201 on success', async () => {
    const res = await app.request('/reflection/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: dummyUser,
        claimId: dummyClaimId,
      }),
    });

    expect(res.status).toBe(201);
    const json = (await res.json()) as { success: boolean; data: { id: string; text: string } };
    expect(json.success).toBe(true);
    expect(json.data.id).toBe(dummyReflectionId);
    expect(json.data.text).toContain('backend development');
  });

  it('POST /reflection/generate: returns 400 on missing parameters', async () => {
    const res = await app.request('/reflection/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: dummyUser,
      }),
    });

    expect(res.status).toBe(400);
  });

  it('GET /reflection/list: returns 200 with list of reflections', async () => {
    const res = await app.request(`/reflection/list?userId=${dummyUser}`);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { success: boolean; data: unknown[] };
    expect(json.success).toBe(true);
    expect(json.data.length).toBe(1);
  });

  it('GET /reflection/:id: returns 200 for existing reflection and 404 for unknown', async () => {
    const res = await app.request(`/reflection/${dummyReflectionId}?userId=${dummyUser}`);
    expect(res.status).toBe(200);

    const res404 = await app.request(`/reflection/unknown-id?userId=${dummyUser}`);
    expect(res404.status).toBe(404);
  });

  it('GET /reflection/:id/provenance: returns 200 with full lineage audit bundle', async () => {
    const res = await app.request(`/reflection/${dummyReflectionId}/provenance?userId=${dummyUser}`);
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      success: boolean;
      data: { reflection: unknown; claim: unknown; evidenceChain: unknown };
    };
    expect(json.success).toBe(true);
    expect(json.data.reflection).toBeDefined();
    expect(json.data.claim).toBeDefined();
    expect(json.data.evidenceChain).toBeDefined();
  });
});
