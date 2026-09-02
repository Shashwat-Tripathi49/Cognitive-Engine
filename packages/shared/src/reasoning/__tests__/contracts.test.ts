import { describe, it, expect } from 'vitest';
import {
  CandidateFindingSchema,
  EvidenceObjectSchema,
  EvidenceChainSchema,
  ValidatedClaimSchema,
} from '../types.js';

describe('Milestone 5 — Reasoning Engine Contracts & Schemas', () => {
  const dummyUser = '00000000-0000-0000-0000-000000000001';
  const dummyFrag = '11111111-1111-1111-1111-111111111111';
  const dummyChain = '22222222-2222-2222-2222-222222222222';
  const dummyClaim = '33333333-3333-3333-3333-333333333333';
  const dummyEv = '44444444-4444-4444-4444-444444444444';

  it('should validate a structured CandidateFinding', () => {
    const rawFinding = {
      id: 'find_001',
      userId: dummyUser,
      findingType: 'RECURRING_TOPIC_FOCUS',
      summary: 'Recurring focus on Backend and API',
      statement: 'The user focused repeatedly on backend and API development.',
      involvedEntityIds: [],
      involvedMemoryIds: [],
      involvedRelationshipIds: [],
      temporalScope: {
        startDate: '2026-08-01T00:00:00Z',
        endDate: '2026-08-16T23:59:59Z',
      },
      deterministicMetrics: {
        distinctFragmentCount: 8,
        totalMentionCount: 11,
      },
      discoveryAlgorithm: 'deterministic-frequency-v1',
      discoveryVersion: '1.0.0',
      discoveryConfidence: 0.9,
      provenanceReferences: [
        {
          fragmentId: dummyFrag,
          contentHash: 'a'.repeat(64),
          capturedAt: '2026-08-01T09:30:00Z',
        },
      ],
    };

    const parsed = CandidateFindingSchema.safeParse(rawFinding);
    expect(parsed.success).toBe(true);
  });

  it('should validate an EvidenceObject', () => {
    const rawEvidence = {
      id: dummyEv,
      userId: dummyUser,
      evidenceType: 'COGNITIVE_FRAGMENT',
      sourceId: dummyFrag,
      sourceContentHash: 'b'.repeat(64),
      sourceTimestamp: '2026-08-01T09:30:00Z',
      summary: 'Cognitive fragment reference',
      verified: true,
    };

    const parsed = EvidenceObjectSchema.safeParse(rawEvidence);
    expect(parsed.success).toBe(true);
  });

  it('should validate an EvidenceChain', () => {
    const rawChain = {
      id: dummyChain,
      userId: dummyUser,
      findingId: 'find_001',
      evidenceObjects: [
        {
          id: dummyEv,
          userId: dummyUser,
          evidenceType: 'COGNITIVE_FRAGMENT',
          sourceId: dummyFrag,
          sourceContentHash: 'b'.repeat(64),
          sourceTimestamp: '2026-08-01T09:30:00Z',
          summary: 'Cognitive fragment reference',
          verified: true,
        },
      ],
      rootFragmentIds: [dummyFrag],
      isVerified: true,
      verificationTimestamp: '2026-08-16T12:00:00Z',
      chainIntegrityHash: 'c'.repeat(64),
      createdAt: '2026-08-16T12:00:00Z',
    };

    const parsed = EvidenceChainSchema.safeParse(rawChain);
    expect(parsed.success).toBe(true);
  });

  it('should validate a ValidatedClaim', () => {
    const rawClaim = {
      id: dummyClaim,
      userId: dummyUser,
      sourceFindingId: 'find_001',
      evidenceChainId: dummyChain,
      claimType: 'RECURRING_TOPIC_FOCUS',
      status: 'VALIDATED',
      statement: 'The user focused repeatedly on backend and API development.',
      deterministicSupportScore: 0.92,
      appliedRuleIds: ['RULE_001_SOURCE_INTEGRITY'],
      passedRuleIds: ['RULE_001_SOURCE_INTEGRITY'],
      failedRuleIds: [],
      temporalScope: {
        startDate: '2026-08-01T00:00:00Z',
        endDate: '2026-08-16T23:59:59Z',
      },
      reasoningEngineVersion: '1.0.0',
      createdAt: '2026-08-16T12:00:00Z',
      updatedAt: '2026-08-16T12:00:00Z',
    };

    const parsed = ValidatedClaimSchema.safeParse(rawClaim);
    expect(parsed.success).toBe(true);
  });
});
