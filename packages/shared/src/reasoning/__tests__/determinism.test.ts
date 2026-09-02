import { describe, it, expect } from 'vitest';
import { ReasoningEngine } from '../engine.js';
import { InMemoryReasoningRepository } from '../repository.js';
import {
  EvidenceRetrievalService,
  InMemoryEvidenceStorageAdapter,
} from '../retrieval.js';
import { CandidateFinding } from '../types.js';

describe('Milestone 5 — Determinism & Reproducibility (20-Run Replay)', () => {
  const dummyUser = '00000000-0000-0000-0000-000000000001';
  const frag1 = '11111111-1111-1111-1111-111111111111';
  const frag2 = '22222222-2222-2222-2222-222222222222';
  const hash1 = 'a'.repeat(64);
  const hash2 = 'b'.repeat(64);
  const fixedEvalTime = new Date('2026-08-20T12:00:00Z');

  const finding: CandidateFinding = {
    id: 'find_det_001',
    userId: dummyUser,
    findingType: 'RECURRING_TOPIC_FOCUS',
    summary: 'Recurring focus on Backend and API',
    statement: 'The user focused repeatedly on backend and API development.',
    involvedEntityIds: ['ent_1'],
    involvedMemoryIds: [],
    involvedRelationshipIds: ['rel_1'],
    temporalScope: {
      startDate: new Date('2026-08-01T00:00:00Z'),
      endDate: new Date('2026-08-16T23:59:59Z'),
    },
    deterministicMetrics: {
      distinctFragmentCount: 2,
    },
    discoveryAlgorithm: 'deterministic-frequency-v1',
    discoveryVersion: '1.0.0',
    discoveryConfidence: 0.85,
    provenanceReferences: [
      { fragmentId: frag1, contentHash: hash1, capturedAt: new Date('2026-08-01T10:00:00Z') },
      { fragmentId: frag2, contentHash: hash2, capturedAt: new Date('2026-08-05T14:00:00Z') },
    ],
  };

  it('should produce 100% identical status, score, rule outcomes, and chain hash across 20 evaluations', async () => {
    const storage = new InMemoryEvidenceStorageAdapter();
    storage.addFragment({
      id: frag1,
      userId: dummyUser,
      contentHash: hash1,
      capturedAt: new Date('2026-08-01T10:00:00Z'),
      content: 'Worked on backend',
    });
    storage.addFragment({
      id: frag2,
      userId: dummyUser,
      contentHash: hash2,
      capturedAt: new Date('2026-08-05T14:00:00Z'),
      content: 'Fixed API routes',
    });
    storage.addEntity({
      id: 'ent_1',
      userId: dummyUser,
      canonicalName: 'Backend',
      entityType: 'Topic',
      status: 'ACTIVE',
    });
    storage.addRelationship({
      id: 'rel_1',
      userId: dummyUser,
      sourceEntityId: 'ent_1',
      targetEntityId: 'ent_2',
      relationType: 'MENTIONED_WITH',
      status: 'ACTIVE',
      assertedAt: new Date('2026-08-01T10:00:00Z'),
      validAt: new Date('2026-08-01T10:00:00Z'),
    });

    const retrieval = new EvidenceRetrievalService(storage);
    const repo = new InMemoryReasoningRepository();
    const engine = new ReasoningEngine(repo, retrieval);

    const firstRun = await engine.evaluateFinding({
      userId: dummyUser,
      finding,
      evaluationTimestamp: fixedEvalTime,
    });

    const expectedStatus = firstRun.claim.status;
    const expectedScore = firstRun.claim.deterministicSupportScore;
    const expectedPassedRules = firstRun.claim.passedRuleIds;
    const expectedChainHash = firstRun.evidenceChain.chainIntegrityHash;

    for (let i = 1; i <= 20; i++) {
      const run = await engine.evaluateFinding({
        userId: dummyUser,
        finding,
        evaluationTimestamp: fixedEvalTime,
      });

      expect(run.claim.status).toBe(expectedStatus);
      expect(run.claim.deterministicSupportScore).toBe(expectedScore);
      expect(run.claim.passedRuleIds).toEqual(expectedPassedRules);
      expect(run.evidenceChain.chainIntegrityHash).toBe(expectedChainHash);
    }
  });
});
