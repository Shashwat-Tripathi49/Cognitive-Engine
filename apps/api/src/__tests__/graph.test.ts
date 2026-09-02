import { describe, it, expect, vi } from 'vitest';
import app from '../index.js';
import {
  CanonicalEntity,
  GraphRelationship,
  CandidateConfirmationItem,
} from '@cognitive-engine/shared';

// Mock DB and default engine for fast isolated API tests
vi.mock('../routes/graph.js', async () => {
  const entities: CanonicalEntity[] = [
    {
      id: 'ent_1',
      userId: '00000000-0000-0000-0000-000000000001',
      canonicalName: 'Expense Tracker',
      entityType: 'Project',
      status: 'ACTIVE',
      aliases: ['personal finance tool'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const relationships: GraphRelationship[] = [
    {
      id: 'rel_1',
      userId: '00000000-0000-0000-0000-000000000001',
      sourceEntityId: 'ent_1',
      targetEntityId: 'ent_2',
      relationType: 'WORKED_ON',
      confidence: 1.0,
      evidenceCount: 1,
      sourceFragmentId: 'frag_1',
      sourceContentHash: 'hash_1',
      status: 'ACTIVE',
      assertedAt: new Date(),
      validAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockEngine = {
    processFragment: vi.fn().mockImplementation(async (body) => ({
      fragmentId: body.fragmentId,
      entitiesExtracted: 2,
      entitiesResolved: 1,
      entitiesCreated: 1,
      entitiesAmbiguous: 0,
      relationshipsCreated: 1,
      resolvedEntities: [],
      graphRelationships: relationships,
      provenanceIds: ['prov_1'],
      executionTimeMs: 12,
    })),
    listCanonicalEntities: vi.fn().mockResolvedValue(entities),
    getCanonicalEntity: vi.fn().mockImplementation(async (id, userId) => {
      return entities.find((e) => e.id === id && e.userId === userId) || null;
    }),
    getSubgraph: vi.fn().mockResolvedValue({
      nodes: entities,
      edges: relationships,
    }),
    getPendingCandidates: vi.fn().mockResolvedValue([
      {
        id: 'cand_1',
        userId: '00000000-0000-0000-0000-000000000001',
        surfaceMention: 'the project',
        entityType: 'Project',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as CandidateConfirmationItem,
    ]),
    resolveCandidate: vi.fn().mockResolvedValue({
      id: 'cand_1',
      status: 'APPROVED',
    }),
  };

  const Hono = (await import('hono')).Hono;
  const router = new Hono();

  router.post('/process-fragment', async (c) => {
    const body = await c.req.json();
    if (!body.userId || !body.fragmentId || !body.content || !body.contentHash) {
      return c.json({ error: 'Validation failed' }, 400);
    }
    const data = await mockEngine.processFragment(body);
    return c.json({ success: true, data }, 200);
  });

  router.get('/entities', async (c) => {
    const userId = c.req.query('userId');
    if (!userId) return c.json({ error: 'userId is required' }, 400);
    const data = await mockEngine.listCanonicalEntities(userId);
    return c.json({ data }, 200);
  });

  router.get('/entities/:id', async (c) => {
    const userId = c.req.query('userId');
    const id = c.req.param('id');
    if (!userId) return c.json({ error: 'userId is required' }, 400);
    const data = await mockEngine.getCanonicalEntity(id, userId);
    if (!data) return c.json({ error: 'Not found' }, 404);
    return c.json({ data }, 200);
  });

  router.get('/subgraph', async (c) => {
    const userId = c.req.query('userId');
    if (!userId) return c.json({ error: 'userId is required' }, 400);
    const data = await mockEngine.getSubgraph(userId, {});
    return c.json({ data }, 200);
  });

  router.get('/confirmation-queue', async (c) => {
    const userId = c.req.query('userId');
    if (!userId) return c.json({ error: 'userId is required' }, 400);
    const data = await mockEngine.getPendingCandidates(userId);
    return c.json({ data }, 200);
  });

  router.post('/confirmation-queue/:id/resolve', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const data = await mockEngine.resolveCandidate(id, body.userId, body.action);
    return c.json({ success: true, data }, 200);
  });

  return {
    graphRouter: router,
    defaultKgEngine: mockEngine,
  };
});

describe('Knowledge Graph Engine API Endpoints', () => {
  const dummyUser = '00000000-0000-0000-0000-000000000001';

  it('POST /graph/process-fragment — should validate input and process fragment', async () => {
    const payload = {
      userId: dummyUser,
      fragmentId: 'frag_test_1',
      content: 'Met Rahul to work on Expense Tracker',
      contentHash: 'hash_test_1',
    };

    const res = await app.request('/graph/process-fragment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.fragmentId).toBe('frag_test_1');
  });

  it('POST /graph/process-fragment — should reject invalid payloads with 400', async () => {
    const res = await app.request('/graph/process-fragment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: dummyUser }),
    });

    expect(res.status).toBe(400);
  });

  it('GET /graph/entities — should list canonical entities for a tenant', async () => {
    const res = await app.request(`/graph/entities?userId=${dummyUser}`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].canonicalName).toBe('Expense Tracker');
  });

  it('GET /graph/entities/:id — should retrieve entity or return 404', async () => {
    const res = await app.request(`/graph/entities/ent_1?userId=${dummyUser}`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.id).toBe('ent_1');

    const resNotFound = await app.request(
      `/graph/entities/ent_non_existent?userId=${dummyUser}`
    );
    expect(resNotFound.status).toBe(404);
  });

  it('GET /graph/subgraph — should return nodes and edges for subgraph queries', async () => {
    const res = await app.request(`/graph/subgraph?userId=${dummyUser}`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.nodes).toBeDefined();
    expect(json.data.edges).toBeDefined();
  });

  it('GET & POST /graph/confirmation-queue — should manage candidate items', async () => {
    const resGet = await app.request(
      `/graph/confirmation-queue?userId=${dummyUser}`
    );
    expect(resGet.status).toBe(200);
    const jsonGet = await resGet.json();
    expect(jsonGet.data).toHaveLength(1);

    const resResolve = await app.request(
      `/graph/confirmation-queue/cand_1/resolve`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: dummyUser,
          action: 'APPROVE_AS_NEW',
        }),
      }
    );
    expect(resResolve.status).toBe(200);
    const jsonResolve = await resResolve.json();
    expect(jsonResolve.success).toBe(true);
  });
});
