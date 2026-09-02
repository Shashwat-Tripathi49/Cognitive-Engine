import { describe, it, expect } from 'vitest';
import { ReasoningEngine } from '../engine.js';
import { InMemoryReasoningRepository } from '../repository.js';
import {
  EvidenceRetrievalService,
  InMemoryEvidenceStorageAdapter,
} from '../retrieval.js';
import { CandidateFinding } from '../types.js';

describe('Milestone 5 — Multi-Tenancy & Tenant Isolation', () => {
  const userA = '11111111-1111-1111-1111-111111111111';
  const userB = '22222222-2222-2222-2222-222222222222';

  const fragA = '33333333-3333-3333-3333-333333333333';
  const fragB = '44444444-4444-4444-4444-444444444444';
  const hashA = 'a'.repeat(64);
  const hashB = 'b'.repeat(64);

  it('should immediately REJECT a claim when User A finding references User B evidence', async () => {
    const storage = new InMemoryEvidenceStorageAdapter();

    // User A fragment
    storage.addFragment({
      id: fragA,
      userId: userA,
      contentHash: hashA,
      capturedAt: new Date('2026-08-01T10:00:00Z'),
      content: 'User A journal',
    });

    // User B fragment
    storage.addFragment({
      id: fragB,
      userId: userB,
      contentHash: hashB,
      capturedAt: new Date('2026-08-05T10:00:00Z'),
      content: 'User B confidential journal',
    });

    const retrieval = new EvidenceRetrievalService(storage);
    const repo = new InMemoryReasoningRepository();
    const engine = new ReasoningEngine(repo, retrieval);

    // Finding for User A attempting to reference User B's fragment
    const findingUserA: CandidateFinding = {
      id: 'find_exploit_001',
      userId: userA,
      findingType: 'SINGLE_EVENT_FACT',
      summary: 'Cross-tenant leak attempt',
      statement: 'Attempting to validate claim using User B evidence.',
      involvedEntityIds: [],
      involvedMemoryIds: [],
      involvedRelationshipIds: [],
      temporalScope: {
        startDate: new Date('2026-08-01T00:00:00Z'),
        endDate: new Date('2026-08-16T23:59:59Z'),
      },
      deterministicMetrics: { distinctFragmentCount: 1 },
      discoveryAlgorithm: 'test-v1',
      discoveryVersion: '1.0.0',
      discoveryConfidence: 0.9,
      provenanceReferences: [
        { fragmentId: fragB, contentHash: hashB, capturedAt: new Date('2026-08-05T10:00:00Z') },
      ],
    };

    const res = await engine.evaluateFinding({
      userId: userA,
      finding: findingUserA,
    });

    expect(res.claim.status).toBe('REJECTED');
    expect(res.claim.failedRuleIds).toContain('RULE_001_SOURCE_INTEGRITY');
    expect(res.evidenceChain.isVerified).toBe(false);
  });

  it('should enforce strict query isolation between tenants', async () => {
    const storage = new InMemoryEvidenceStorageAdapter();
    const retrieval = new EvidenceRetrievalService(storage);
    const repo = new InMemoryReasoningRepository();
    const engine = new ReasoningEngine(repo, retrieval);

    storage.addFragment({
      id: fragA,
      userId: userA,
      contentHash: hashA,
      capturedAt: new Date('2026-08-01T10:00:00Z'),
      content: 'User A journal',
    });

    const findingUserA: CandidateFinding = {
      id: 'find_user_a',
      userId: userA,
      findingType: 'SINGLE_EVENT_FACT',
      summary: 'User A fact',
      statement: 'User A worked on feature.',
      involvedEntityIds: [],
      involvedMemoryIds: [],
      involvedRelationshipIds: [],
      temporalScope: {
        startDate: new Date('2026-08-01T00:00:00Z'),
        endDate: new Date('2026-08-02T00:00:00Z'),
      },
      deterministicMetrics: { distinctFragmentCount: 1 },
      discoveryAlgorithm: 'test-v1',
      discoveryVersion: '1.0.0',
      discoveryConfidence: 0.95,
      provenanceReferences: [
        { fragmentId: fragA, contentHash: hashA, capturedAt: new Date('2026-08-01T10:00:00Z') },
      ],
    };

    const runA = await engine.evaluateFinding({
      userId: userA,
      finding: findingUserA,
    });

    // User A query retrieves claim
    const claimA = await engine.getClaim(runA.claim.id, userA);
    expect(claimA).not.toBeNull();

    // User B query for User A's claim returns null
    const leakClaim = await engine.getClaim(runA.claim.id, userB);
    expect(leakClaim).toBeNull();

    // User B query for User A's evidence chain returns null
    const leakChain = await engine.getEvidenceChain(runA.evidenceChain.id, userB);
    expect(leakChain).toBeNull();
  });
});
