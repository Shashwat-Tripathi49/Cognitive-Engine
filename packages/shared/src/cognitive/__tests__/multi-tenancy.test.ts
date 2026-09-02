import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { CognitiveEngine, InMemoryCognitiveDataProvider } from '../engine.js';
import { InMemoryCognitiveRepository } from '../repository.js';
import { DEFAULT_COGNITIVE_CONFIG } from '../config.js';

describe('Cognitive Engine Multi-Tenancy Isolation Tests', () => {
  const userA = '00000000-0000-0000-0000-000000000001';
  const userB = '00000000-0000-0000-0000-000000000002';
  const evalTime = new Date('2026-03-01T12:00:00.000Z');

  it('guarantees complete isolation between User A and User B during discovery', async () => {
    // User A Data: Project Apollo
    const entA = { id: crypto.randomUUID(), canonicalName: 'Apollo', entityType: 'Project', status: 'ACTIVE', aliases: [], createdAt: new Date() };
    const fA1 = { id: crypto.randomUUID(), content: 'User A Apollo 1', contentHash: 'a1111111111111111111111111111111111111111111111111111111111111111', capturedAt: new Date('2026-02-01') };
    const fA2 = { id: crypto.randomUUID(), content: 'User A Apollo 2', contentHash: 'a2222222222222222222222222222222222222222222222222222222222222222', capturedAt: new Date('2026-02-02') };

    const provA = [
      { id: 'pA1', canonicalId: entA.id, sourceFragmentId: fA1.id, sourceContentHash: fA1.contentHash, sourceMention: 'Apollo', confidence: 0.9, resolvedAt: fA1.capturedAt },
      { id: 'pA2', canonicalId: entA.id, sourceFragmentId: fA2.id, sourceContentHash: fA2.contentHash, sourceMention: 'Apollo', confidence: 0.9, resolvedAt: fA2.capturedAt },
    ];

    const dataProvider = new InMemoryCognitiveDataProvider();
    dataProvider.setContextData({
      fragments: [fA1, fA2],
      entities: [entA],
      provenance: provA,
      memories: [],
      relationships: [],
    });

    const repo = new InMemoryCognitiveRepository();
    const engine = new CognitiveEngine(repo, dataProvider);

    // Run discovery for User A
    const resultA = await engine.discover(userA, {
      evaluationTimestamp: evalTime,
      config: DEFAULT_COGNITIVE_CONFIG,
      persistFindings: true,
    });

    expect(resultA.findings.length).toBe(1);
    expect(resultA.findings[0].userId).toBe(userA);
    expect(resultA.findings[0].statement).toContain("Entity 'Apollo' was observed");

    // Clear provider and verify User B has 0 findings
    dataProvider.setContextData({
      fragments: [],
      entities: [],
      provenance: [],
      memories: [],
      relationships: [],
    });

    const resultB = await engine.discover(userB, {
      evaluationTimestamp: evalTime,
      config: DEFAULT_COGNITIVE_CONFIG,
      persistFindings: true,
    });

    expect(resultB.findings.length).toBe(0);

    // Verify repository isolation: User B cannot retrieve User A's candidate finding
    const findingAId = resultA.findings[0].id;
    const retrievedByB = await repo.getCandidateFinding(findingAId, userB);
    expect(retrievedByB).toBeNull();

    const retrievedByA = await repo.getCandidateFinding(findingAId, userA);
    expect(retrievedByA).not.toBeNull();
    expect(retrievedByA!.id).toBe(findingAId);
  });
});
