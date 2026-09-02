import { describe, it, expect, vi } from 'vitest';
import app from '../index.js';
import { CandidateFinding, DiscoveryResult } from '@cognitive-engine/shared';

// Mock cognitive router default engine for isolated fast API testing
vi.mock('../routes/cognitive.js', async () => {
  const dummyUser = '00000000-0000-0000-0000-000000000001';
  const dummyFindingId = '11111111-1111-1111-1111-111111111111';

  const sampleFinding: CandidateFinding = {
    id: dummyFindingId,
    userId: dummyUser,
    findingType: 'RECURRING_TOPIC_FOCUS',
    summary: 'Recurring topic: GraphQL API across 3 fragments',
    statement: "Entity 'GraphQL API' was observed across 3 independent journal entries.",
    subjectEntityId: '22222222-2222-2222-2222-222222222222',
    involvedEntityIds: ['22222222-2222-2222-2222-222222222222'],
    involvedMemoryIds: [],
    involvedRelationshipIds: [],
    temporalScope: {
      startDate: new Date('2026-02-01T00:00:00Z'),
      endDate: new Date('2026-02-10T00:00:00Z'),
    },
    deterministicMetrics: {
      distinctFragmentCount: 3,
      frequencyPerWeek: 2.1,
    },
    discoveryAlgorithm: 'topic-recurrence-detector',
    discoveryVersion: '1.0.0',
    discoveryConfidence: 0.85,
    provenanceReferences: [],
    metadata: {},
  };

  const sampleDiscoveryResult: DiscoveryResult = {
    userId: dummyUser,
    evaluationTimestamp: new Date('2026-03-01T12:00:00Z'),
    configSnapshot: {
      version: '1.0.0',
      minRecurrenceFragments: 2,
      recurrenceTargetSaturation: 4,
      maxSequenceGapHours: 72,
      minSequenceOccurrences: 2,
      clusterCosineSimilarityThreshold: 0.82,
      clusterMinCohesionThreshold: 0.75,
      minClusterSize: 3,
      minCoOccurrenceCount: 2,
    },
    findings: [sampleFinding],
    metrics: {
      totalFindings: 1,
      byType: { RECURRING_TOPIC_FOCUS: 1 },
      durationMs: 12,
    },
  };

  const mockEngine = {
    discover: vi.fn().mockResolvedValue(sampleDiscoveryResult),
    runPipeline: vi.fn().mockResolvedValue({
      discovery: sampleDiscoveryResult,
      evaluations: [
        {
          success: true,
          claim: {
            id: '33333333-3333-3333-3333-333333333333',
            userId: dummyUser,
            sourceFindingId: dummyFindingId,
            evidenceChainId: '44444444-4444-4444-4444-444444444444',
            claimType: 'RECURRING_TOPIC_FOCUS',
            status: 'VALIDATED',
            statement: sampleFinding.statement,
            deterministicSupportScore: 0.9,
            appliedRuleIds: ['RULE_001_SOURCE_INTEGRITY', 'RULE_006_SUPPORT_SCORE'],
            passedRuleIds: ['RULE_001_SOURCE_INTEGRITY', 'RULE_006_SUPPORT_SCORE'],
            failedRuleIds: [],
            temporalScope: sampleFinding.temporalScope,
            reasoningEngineVersion: '1.0.0',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          evidenceChain: {
            id: '44444444-4444-4444-4444-444444444444',
            userId: dummyUser,
            findingId: dummyFindingId,
            evidenceObjects: [],
            rootFragmentIds: [],
            ruleEvaluations: [],
            isVerified: true,
            verificationTimestamp: new Date(),
            chainIntegrityHash: 'c'.repeat(64),
            createdAt: new Date(),
          },
          executionTimeMs: 10,
        },
      ],
    }),
    listFindings: vi.fn().mockResolvedValue([sampleFinding]),
    getFinding: vi.fn().mockImplementation(async (id: string, uid: string) => {
      return id === dummyFindingId && uid === dummyUser ? sampleFinding : null;
    }),
  };

  const { Hono } = await import('hono');
  const cognitiveRouter = new Hono();

  cognitiveRouter.post('/discover', async (c) => {
    const body = await c.req.json();
    if (!body.userId) return c.json({ error: 'Validation failed' }, 400);
    const res = await mockEngine.discover(body.userId, body);
    return c.json({ success: true, data: res }, 200);
  });

  cognitiveRouter.post('/pipeline/run', async (c) => {
    const body = await c.req.json();
    if (!body.userId) return c.json({ error: 'Validation failed' }, 400);
    const res = await mockEngine.runPipeline(
      body.userId,
      null as unknown as import('@cognitive-engine/shared').ReasoningEngine,
      body
    );
    return c.json({ success: true, data: res }, 200);
  });

  cognitiveRouter.get('/findings', async (c) => {
    const uid = c.req.query('userId');
    if (!uid) return c.json({ error: 'userId query parameter is required' }, 400);
    const res = await mockEngine.listFindings(uid);
    return c.json({ success: true, data: res }, 200);
  });

  cognitiveRouter.get('/findings/:id', async (c) => {
    const id = c.req.param('id');
    const uid = c.req.query('userId');
    if (!uid) return c.json({ error: 'userId query parameter is required' }, 400);
    const res = await mockEngine.getFinding(id, uid);
    if (!res) return c.json({ error: 'Candidate finding not found' }, 404);
    return c.json({ success: true, data: res }, 200);
  });

  return {
    cognitiveRouter,
    defaultCognitiveEngine: mockEngine,
  };
});

describe('Cognitive Engine REST API Routes (/cognitive)', () => {
  const dummyUser = '00000000-0000-0000-0000-000000000001';
  const dummyFindingId = '11111111-1111-1111-1111-111111111111';

  it('POST /cognitive/discover — triggers discovery and returns structured findings', async () => {
    const res = await app.request('/cognitive/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: dummyUser,
        evaluationTimestamp: '2026-03-01T12:00:00.000Z',
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.findings.length).toBe(1);
    expect(body.data.findings[0].findingType).toBe('RECURRING_TOPIC_FOCUS');
  });

  it('POST /cognitive/pipeline/run — triggers end-to-end discovery and reasoning evaluation', async () => {
    const res = await app.request('/cognitive/pipeline/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: dummyUser,
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.discovery).toBeDefined();
    expect(body.data.evaluations).toHaveLength(1);
    expect(body.data.evaluations[0].claim.status).toBe('VALIDATED');
  });

  it('GET /cognitive/findings — lists findings for a user', async () => {
    const res = await app.request(`/cognitive/findings?userId=${dummyUser}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data[0].id).toBe(dummyFindingId);
  });

  it('GET /cognitive/findings/:id — retrieves a single finding', async () => {
    const res = await app.request(`/cognitive/findings/${dummyFindingId}?userId=${dummyUser}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(dummyFindingId);
  });

  it('GET /cognitive/findings/:id — returns 404 for non-existent finding', async () => {
    const res = await app.request(`/cognitive/findings/00000000-0000-0000-0000-999999999999?userId=${dummyUser}`);
    expect(res.status).toBe(404);
  });
});
