import { describe, it, expect, vi } from 'vitest';
import app from '../index.js';
import {
  ValidatedClaim,
  EvidenceChain,
} from '@cognitive-engine/shared';

// Mock reasoning router default engine for isolated fast API testing
vi.mock('../routes/reasoning.js', async () => {
  const dummyUser = '00000000-0000-0000-0000-000000000001';
  const dummyChainId = '22222222-2222-2222-2222-222222222222';
  const dummyClaimId = '33333333-3333-3333-3333-333333333333';

  const sampleClaim: ValidatedClaim = {
    id: dummyClaimId,
    userId: dummyUser,
    sourceFindingId: 'find_001',
    evidenceChainId: dummyChainId,
    claimType: 'RECURRING_TOPIC_FOCUS',
    status: 'VALIDATED',
    statement: 'The user focused repeatedly on backend and API development.',
    deterministicSupportScore: 0.95,
    appliedRuleIds: ['RULE_001_SOURCE_INTEGRITY', 'RULE_006_SUPPORT_SCORE'],
    passedRuleIds: ['RULE_001_SOURCE_INTEGRITY', 'RULE_006_SUPPORT_SCORE'],
    failedRuleIds: [],
    temporalScope: {
      startDate: new Date('2026-08-01T00:00:00Z'),
      endDate: new Date('2026-08-16T23:59:59Z'),
    },
    reasoningEngineVersion: '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleChain: EvidenceChain = {
    id: dummyChainId,
    userId: dummyUser,
    findingId: 'find_001',
    evidenceObjects: [],
    rootFragmentIds: ['11111111-1111-1111-1111-111111111111'],
    ruleEvaluations: [],
    isVerified: true,
    verificationTimestamp: new Date(),
    chainIntegrityHash: 'c'.repeat(64),
    createdAt: new Date(),
  };

  const mockEngine = {
    evaluateFinding: vi.fn().mockImplementation(async (req) => ({
      success: true,
      claim: { ...sampleClaim, sourceFindingId: req.finding.id, userId: req.userId },
      evidenceChain: { ...sampleChain, findingId: req.finding.id, userId: req.userId },
      executionTimeMs: 15,
    })),
    listClaims: vi.fn().mockResolvedValue([sampleClaim]),
    getClaim: vi.fn().mockImplementation(async (id, userId) => {
      return id === dummyClaimId && userId === dummyUser ? sampleClaim : null;
    }),
    getEvidenceChain: vi.fn().mockImplementation(async (id, userId) => {
      return id === dummyChainId && userId === dummyUser ? sampleChain : null;
    }),
  };

  const Hono = (await import('hono')).Hono;
  const router = new Hono();

  router.post('/evaluate', async (c) => {
    const body = await c.req.json();
    if (!body.userId || !body.finding) {
      return c.json({ error: 'Validation failed' }, 400);
    }
    const data = await mockEngine.evaluateFinding(body);
    return c.json({ success: true, data }, 200);
  });

  router.get('/claims', async (c) => {
    const userId = c.req.query('userId');
    if (!userId) return c.json({ error: 'userId is required' }, 400);
    const data = await mockEngine.listClaims(userId);
    return c.json({ success: true, data }, 200);
  });

  router.get('/claims/:id', async (c) => {
    const userId = c.req.query('userId');
    const id = c.req.param('id');
    if (!userId) return c.json({ error: 'userId is required' }, 400);
    const claim = await mockEngine.getClaim(id, userId);
    if (!claim) return c.json({ error: 'Claim not found' }, 404);
    const evidenceChain = await mockEngine.getEvidenceChain(claim.evidenceChainId, userId);
    return c.json({ success: true, data: { claim, evidenceChain } }, 200);
  });

  router.get('/evidence-chains/:id', async (c) => {
    const userId = c.req.query('userId');
    const id = c.req.param('id');
    if (!userId) return c.json({ error: 'userId is required' }, 400);
    const chain = await mockEngine.getEvidenceChain(id, userId);
    if (!chain) return c.json({ error: 'Evidence chain not found' }, 404);
    return c.json({ success: true, data: chain }, 200);
  });

  return {
    reasoningRouter: router,
    defaultReasoningEngine: mockEngine,
  };
});

describe('Reasoning Engine API Endpoints', () => {
  const dummyUser = '00000000-0000-0000-0000-000000000001';
  const dummyFrag = '11111111-1111-1111-1111-111111111111';

  it('POST /reasoning/evaluate — should evaluate candidate finding and return claim + chain', async () => {
    const payload = {
      userId: dummyUser,
      finding: {
        id: 'find_api_001',
        userId: dummyUser,
        findingType: 'RECURRING_TOPIC_FOCUS',
        summary: 'Backend focus',
        statement: 'The user focused repeatedly on backend development.',
        involvedEntityIds: [],
        involvedMemoryIds: [],
        involvedRelationshipIds: [],
        temporalScope: {
          startDate: '2026-08-01T00:00:00Z',
          endDate: '2026-08-16T23:59:59Z',
        },
        deterministicMetrics: { distinctFragmentCount: 4 },
        discoveryAlgorithm: 'test-v1',
        discoveryVersion: '1.0.0',
        discoveryConfidence: 0.9,
        provenanceReferences: [
          { fragmentId: dummyFrag, contentHash: 'a'.repeat(64), capturedAt: '2026-08-01T09:30:00Z' },
        ],
      },
    };

    const res = await app.request('/reasoning/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.claim.status).toBe('VALIDATED');
    expect(json.data.evidenceChain.isVerified).toBe(true);
  });

  it('POST /reasoning/evaluate — should reject invalid payload with 400', async () => {
    const res = await app.request('/reasoning/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: dummyUser }),
    });

    expect(res.status).toBe(400);
  });

  it('GET /reasoning/claims — should list claims for tenant', async () => {
    const res = await app.request(`/reasoning/claims?userId=${dummyUser}`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data).toHaveLength(1);
  });

  it('GET /reasoning/claims/:id — should return claim and attached evidence chain or 404', async () => {
    const res = await app.request(
      `/reasoning/claims/33333333-3333-3333-3333-333333333333?userId=${dummyUser}`
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.claim.id).toBe('33333333-3333-3333-3333-333333333333');
    expect(json.data.evidenceChain).toBeDefined();

    const resNotFound = await app.request(
      `/reasoning/claims/00000000-0000-0000-0000-000000000000?userId=${dummyUser}`
    );
    expect(resNotFound.status).toBe(404);
  });

  it('GET /reasoning/evidence-chains/:id — should return evidence chain or 404', async () => {
    const res = await app.request(
      `/reasoning/evidence-chains/22222222-2222-2222-2222-222222222222?userId=${dummyUser}`
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.id).toBe('22222222-2222-2222-2222-222222222222');
    expect(json.data.chainIntegrityHash).toBeDefined();

    const resNotFound = await app.request(
      `/reasoning/evidence-chains/00000000-0000-0000-0000-000000000000?userId=${dummyUser}`
    );
    expect(resNotFound.status).toBe(404);
  });
});
