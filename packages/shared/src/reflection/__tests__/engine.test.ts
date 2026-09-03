import { describe, it, expect } from 'vitest';
import { ReflectionEngine } from '../engine.js';
import { InMemoryReflectionRepository } from '../repository.js';
import { InMemoryReasoningRepository } from '../../reasoning/repository.js';
import { MockReflectionSynthesizer } from '../synthesizer.js';
import { ValidatedClaim, EvidenceChain } from '../../reasoning/types.js';

describe('ReflectionEngine — Orchestrator, Invariants & Provenance', () => {
  const userId = '00000000-0000-0000-0000-000000000001';
  const otherUserId = '00000000-0000-0000-0000-000000000002';

  const validClaim: ValidatedClaim = {
    id: 'claim-val-1',
    userId,
    sourceFindingId: 'find-1',
    evidenceChainId: 'chain-val-1',
    claimType: 'RECURRING_TOPIC_FOCUS',
    status: 'VALIDATED',
    subjectEntityId: 'backend',
    statement: "Topic 'backend' observed repeatedly",
    deterministicSupportScore: 0.95,
    appliedRuleIds: ['RULE_001'],
    passedRuleIds: ['RULE_001'],
    failedRuleIds: [],
    involvedEntityIds: ['backend'],
    involvedRelationshipIds: [],
    temporalScope: {
      startDate: new Date('2026-08-01T00:00:00.000Z'),
      endDate: new Date('2026-08-16T00:00:00.000Z'),
    },
    reasoningVersion: '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const validChain: EvidenceChain = {
    id: 'chain-val-1',
    userId,
    claimId: 'claim-val-1',
    findingId: 'find-1',
    rootFragmentIds: ['frag-1', 'frag-2', 'frag-3', 'frag-4', 'frag-5'],
    evaluationRecords: [],
    chainIntegrityHash: 'chain-hash-123456',
    reasoningVersion: '1.0.0',
    createdAt: new Date(),
  };

  it('generates and persists reflection with full provenance lineage', async () => {
    const reflectionRepo = new InMemoryReflectionRepository();
    const reasoningRepo = new InMemoryReasoningRepository();
    await reasoningRepo.saveClaim(validClaim, validChain);

    const mockSynthesizer = new MockReflectionSynthesizer();
    const engine = new ReflectionEngine(reflectionRepo, reasoningRepo, mockSynthesizer);

    const reflection = await engine.generateReflection({
      userId,
      claimId: validClaim.id,
    });

    expect(reflection.id).toBeDefined();
    expect(reflection.userId).toBe(userId);
    expect(reflection.sourceClaimId).toBe(validClaim.id);
    expect(reflection.evidenceChainId).toBe(validChain.id);
    expect(reflection.chainIntegrityHash).toBe(validChain.chainIntegrityHash);
    expect(reflection.bundleIntegrityHash).toBeDefined();
    expect(reflection.canonicalizationVersion).toBe('1.0.0');

    // Retrieve from repository
    const stored = await engine.getReflection(reflection.id, userId);
    expect(stored).not.toBeNull();
    expect(stored?.text).toBe(reflection.text);

    // Retrieve provenance
    const prov = await engine.getProvenance(reflection.id, userId);
    expect(prov).not.toBeNull();
    expect(prov?.claim.id).toBe(validClaim.id);
    expect(prov?.evidenceChain.id).toBe(validChain.id);
  });

  it('fails closed when claim status is not VALIDATED', async () => {
    const reflectionRepo = new InMemoryReflectionRepository();
    const reasoningRepo = new InMemoryReasoningRepository();

    const rejectedClaim: ValidatedClaim = {
      ...validClaim,
      id: 'claim-rej-1',
      status: 'REJECTED',
    };
    await reasoningRepo.saveClaim(rejectedClaim, { ...validChain, claimId: 'claim-rej-1' });

    const engine = new ReflectionEngine(reflectionRepo, reasoningRepo);

    await expect(
      engine.generateReflection({
        userId,
        claimId: rejectedClaim.id,
      })
    ).rejects.toThrow(/Reflection Engine only consumes claims with status 'VALIDATED'/);
  });

  it('fails closed on cross-tenant access', async () => {
    const reflectionRepo = new InMemoryReflectionRepository();
    const reasoningRepo = new InMemoryReasoningRepository();
    await reasoningRepo.saveClaim(validClaim, validChain);

    const engine = new ReflectionEngine(reflectionRepo, reasoningRepo);

    // Other user attempts to generate reflection for validClaim belonging to userId
    await expect(
      engine.generateReflection({
        userId: otherUserId,
        claimId: validClaim.id,
      })
    ).rejects.toThrow(/not found for user/);
  });
});
