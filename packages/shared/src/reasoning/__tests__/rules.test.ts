import { describe, it, expect } from 'vitest';
import {
  SourceIntegrityRule,
  EvidenceMultiplicityRule,
  TemporalConsistencyRule,
  GraphPathValidityRule,
  ContradictionRule,
  SupportScoreRule,
} from '../rules/index.js';
import { CandidateFinding, ReasoningRuleContext } from '../types.js';

describe('Milestone 5 — Deterministic Reasoning Rules', () => {
  const dummyUser = '00000000-0000-0000-0000-000000000001';
  const frag1 = '11111111-1111-1111-1111-111111111111';
  const frag2 = '22222222-2222-2222-2222-222222222222';
  const hash1 = 'a'.repeat(64);
  const hash2 = 'b'.repeat(64);

  const baseFinding: CandidateFinding = {
    id: 'find_001',
    userId: dummyUser,
    findingType: 'RECURRING_TOPIC_FOCUS',
    summary: 'Recurring focus on Backend and API',
    statement: 'The user focused repeatedly on backend and API development.',
    involvedEntityIds: ['ent_1'],
    involvedMemoryIds: ['mem_1'],
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

  const createBaseContext = (): ReasoningRuleContext => ({
    userId: dummyUser,
    finding: { ...baseFinding },
    evidence: [
      {
        id: 'ev_1',
        userId: dummyUser,
        evidenceType: 'COGNITIVE_FRAGMENT',
        sourceId: frag1,
        sourceContentHash: hash1,
        sourceTimestamp: new Date('2026-08-01T10:00:00Z'),
        summary: 'Frag 1',
        verified: true,
      },
      {
        id: 'ev_2',
        userId: dummyUser,
        evidenceType: 'COGNITIVE_FRAGMENT',
        sourceId: frag2,
        sourceContentHash: hash2,
        sourceTimestamp: new Date('2026-08-05T14:00:00Z'),
        summary: 'Frag 2',
        verified: true,
      },
      {
        id: 'ev_3',
        userId: dummyUser,
        evidenceType: 'CANONICAL_ENTITY',
        sourceId: 'ent_1',
        summary: 'Entity 1',
        verified: true,
      },
      {
        id: 'ev_4',
        userId: dummyUser,
        evidenceType: 'RELATIONSHIP_ASSERTION',
        sourceId: 'rel_1',
        summary: 'Rel 1',
        verified: true,
      },
      {
        id: 'ev_5',
        userId: dummyUser,
        evidenceType: 'MEMORY_NODE',
        sourceId: 'mem_1',
        summary: 'Mem 1',
        verified: true,
      },
    ],
    rootFragments: [
      { id: frag1, contentHash: hash1, capturedAt: new Date('2026-08-01T10:00:00Z') },
      { id: frag2, contentHash: hash2, capturedAt: new Date('2026-08-05T14:00:00Z') },
    ],
    entities: new Map([
      ['ent_1', { id: 'ent_1', canonicalName: 'Backend', entityType: 'Topic', status: 'ACTIVE' }],
    ]),
    relationships: new Map([
      [
        'rel_1',
        {
          id: 'rel_1',
          sourceEntityId: 'ent_1',
          targetEntityId: 'ent_2',
          relationType: 'MENTIONED_WITH',
          status: 'ACTIVE',
        },
      ],
    ]),
    memories: new Map([['mem_1', { id: 'mem_1', content: 'Memory content' }]]),
    evaluationTimestamp: new Date('2026-08-20T00:00:00Z'),
  });

  it('Rule 1 (SourceIntegrity): should pass valid evidence and reject tampered content hash', async () => {
    const rule = new SourceIntegrityRule();
    const ctx = createBaseContext();

    const passResult = await rule.evaluate(ctx);
    expect(passResult.passed).toBe(true);

    // Tampered hash
    ctx.rootFragments[0].contentHash = 'corrupted_hash'.padStart(64, '0');
    const failResult = await rule.evaluate(ctx);
    expect(failResult.passed).toBe(false);
    expect(failResult.resultingStatus).toBe('REJECTED');
  });

  it('Rule 2 (EvidenceMultiplicity): should enforce finding-type specific fragment thresholds', async () => {
    const rule = new EvidenceMultiplicityRule();

    // 1. Single event fact with N=1 fragment -> PASS
    const ctxSingle = createBaseContext();
    ctxSingle.finding.findingType = 'SINGLE_EVENT_FACT';
    ctxSingle.finding.provenanceReferences = [
      { fragmentId: frag1, contentHash: hash1, capturedAt: new Date('2026-08-01T10:00:00Z') },
    ];
    ctxSingle.evidence = [ctxSingle.evidence[0]];
    const resSingle = await rule.evaluate(ctxSingle);
    expect(resSingle.passed).toBe(true);

    // 2. Recurring topic focus with only N=1 fragment -> FAIL (INSUFFICIENT_EVIDENCE)
    const ctxRecurring1 = createBaseContext();
    ctxRecurring1.finding.findingType = 'RECURRING_TOPIC_FOCUS';
    ctxRecurring1.finding.provenanceReferences = [
      { fragmentId: frag1, contentHash: hash1, capturedAt: new Date('2026-08-01T10:00:00Z') },
    ];
    ctxRecurring1.evidence = [ctxRecurring1.evidence[0]];
    const resRecurring1 = await rule.evaluate(ctxRecurring1);
    expect(resRecurring1.passed).toBe(false);
    expect(resRecurring1.resultingStatus).toBe('INSUFFICIENT_EVIDENCE');

    // 3. Multiple mentions within the SAME fragment must count as 1 independent fragment
    const ctxMultipleMentions = createBaseContext();
    ctxMultipleMentions.finding.findingType = 'RECURRING_TOPIC_FOCUS';
    ctxMultipleMentions.finding.provenanceReferences = [
      { fragmentId: frag1, contentHash: hash1, capturedAt: new Date('2026-08-01T10:00:00Z') },
      { fragmentId: frag1, contentHash: hash1, capturedAt: new Date('2026-08-01T10:00:00Z') },
    ];
    ctxMultipleMentions.evidence = [ctxMultipleMentions.evidence[0], ctxMultipleMentions.evidence[0]];
    const resMultiMention = await rule.evaluate(ctxMultipleMentions);
    expect(resMultiMention.passed).toBe(false);
    expect(resMultiMention.resultingStatus).toBe('INSUFFICIENT_EVIDENCE');
  });

  it('Rule 3 (TemporalConsistency): should check window alignment relative to evaluationTimestamp', async () => {
    const rule = new TemporalConsistencyRule();
    const ctx = createBaseContext();

    // Valid window relative to evaluationTimestamp (2026-08-20)
    const passResult = await rule.evaluate(ctx);
    expect(passResult.passed).toBe(true);

    // Out-of-window evidence
    ctx.rootFragments[0].capturedAt = new Date('2026-07-15T00:00:00Z'); // Before Aug 1
    const failWindow = await rule.evaluate(ctx);
    expect(failWindow.passed).toBe(false);
    expect(failWindow.resultingStatus).toBe('REJECTED');

    // Future evidence relative to evaluationTimestamp
    const ctxFuture = createBaseContext();
    ctxFuture.evaluationTimestamp = new Date('2026-08-02T00:00:00Z'); // Evidence in frag2 is Aug 5
    const failFuture = await rule.evaluate(ctxFuture);
    expect(failFuture.passed).toBe(false);
    expect(failFuture.resultingStatus).toBe('REJECTED');
  });

  it('Rule 4 (GraphPathValidity): should reject causality or collaboration claimed solely from MENTIONED_WITH', async () => {
    const rule = new GraphPathValidityRule();

    // Finding claiming collaboration supported only by MENTIONED_WITH -> REJECTED
    const ctxCollab = createBaseContext();
    ctxCollab.finding.findingType = 'COLLABORATION_PATTERN';
    ctxCollab.relationships.set('rel_1', {
      id: 'rel_1',
      sourceEntityId: 'ent_1',
      targetEntityId: 'ent_2',
      relationType: 'MENTIONED_WITH',
      status: 'ACTIVE',
    });

    const resCollab = await rule.evaluate(ctxCollab);
    expect(resCollab.passed).toBe(false);
    expect(resCollab.resultingStatus).toBe('REJECTED');

    // Finding claiming collaboration with WORKED_ON edge -> PASS
    ctxCollab.relationships.set('rel_1', {
      id: 'rel_1',
      sourceEntityId: 'ent_1',
      targetEntityId: 'ent_2',
      relationType: 'WORKED_ON',
      status: 'ACTIVE',
    });
    const resCollabPass = await rule.evaluate(ctxCollab);
    expect(resCollabPass.passed).toBe(true);

    // Causal claim statement with only MENTIONED_WITH -> REJECTED
    const ctxCausal = createBaseContext();
    ctxCausal.finding.statement = 'API problems caused user frustration.';
    const resCausal = await rule.evaluate(ctxCausal);
    expect(resCausal.passed).toBe(false);
    expect(resCausal.resultingStatus).toBe('REJECTED');
  });

  it('Rule 5 (Contradiction): should detect mutually exclusive active relationships', async () => {
    const rule = new ContradictionRule();
    const ctx = createBaseContext();

    // Clean state -> PASS
    const passResult = await rule.evaluate(ctx);
    expect(passResult.passed).toBe(true);

    // Contradictory active relationships (USES_TECHNOLOGY vs REJECTED_TECHNOLOGY)
    ctx.relationships.set('rel_uses', {
      id: 'rel_uses',
      sourceEntityId: 'ent_user',
      targetEntityId: 'ent_tech',
      relationType: 'USES_TECHNOLOGY',
      status: 'ACTIVE',
    });
    ctx.relationships.set('rel_rejected', {
      id: 'rel_rejected',
      sourceEntityId: 'ent_user',
      targetEntityId: 'ent_tech',
      relationType: 'REJECTED_TECHNOLOGY',
      status: 'ACTIVE',
    });

    const failContradiction = await rule.evaluate(ctx);
    expect(failContradiction.passed).toBe(false);
    expect(failContradiction.resultingStatus).toBe('CONTRADICTED');
  });

  it('Rule 6 (SupportScore): should calculate score deterministically and enforce 0.60 threshold', async () => {
    const rule = new SupportScoreRule();

    // High support: discovery 0.90, 4 fragments, 100% coverage
    const ctxHigh = createBaseContext();
    ctxHigh.finding.discoveryConfidence = 0.90;
    ctxHigh.finding.provenanceReferences = [
      { fragmentId: frag1, contentHash: hash1, capturedAt: new Date('2026-08-01T10:00:00Z') },
      { fragmentId: frag2, contentHash: hash2, capturedAt: new Date('2026-08-05T14:00:00Z') },
      { fragmentId: '33333333-3333-3333-3333-333333333333', contentHash: hash1, capturedAt: new Date('2026-08-08T10:00:00Z') },
      { fragmentId: '44444444-4444-4444-4444-444444444444', contentHash: hash1, capturedAt: new Date('2026-08-10T10:00:00Z') },
    ];
    const resHigh = await rule.evaluate(ctxHigh);
    expect(resHigh.passed).toBe(true);
    expect(resHigh.scoreImpact).toBeGreaterThanOrEqual(0.60);

    // Low support: discovery 0.10, 1 fragment, 50% coverage
    const ctxLow = createBaseContext();
    ctxLow.finding.discoveryConfidence = 0.10;
    ctxLow.finding.provenanceReferences = [
      { fragmentId: frag1, contentHash: hash1, capturedAt: new Date('2026-08-01T10:00:00Z') },
    ];
    ctxLow.evidence = [
      { ...ctxLow.evidence[0], verified: true },
      { ...ctxLow.evidence[1], verified: false },
    ];
    const resLow = await rule.evaluate(ctxLow);
    expect(resLow.passed).toBe(false);
    expect(resLow.resultingStatus).toBe('INSUFFICIENT_EVIDENCE');
    expect(resLow.scoreImpact).toBeLessThan(0.60);
  });
});
