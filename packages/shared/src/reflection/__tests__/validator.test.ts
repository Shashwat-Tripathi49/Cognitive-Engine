import { describe, it, expect } from 'vitest';
import { ReflectionValidator } from '../validator.js';
import { ReflectionInputBundle, LLMReflectionResponse } from '../types.js';

describe('ReflectionValidator — Gates G1 through G5', () => {
  const validator = new ReflectionValidator();

  const mockBundle: ReflectionInputBundle = {
    schemaVersion: '1.0.0',
    canonicalizationVersion: '1.0.0',
    claimId: 'claim-1',
    claimType: 'RECURRING_TOPIC_FOCUS',
    claimStatement: "Entity 'backend' was observed across 5 entries",
    evidenceChainId: 'chain-1',
    chainIntegrityHash: 'hash-1',
    authorizedFacts: {
      entities: [
        {
          factId: 'ent:1',
          entityId: '1',
          canonicalName: 'backend',
          entityType: 'TOPIC',
        },
        {
          factId: 'ent:2',
          entityId: '2',
          canonicalName: 'API',
          entityType: 'TOPIC',
        },
      ],
      relationships: [
        {
          factId: 'rel:1',
          sourceEntityId: '1',
          sourceEntityName: 'backend',
          targetEntityId: '2',
          targetEntityName: 'API',
          relationType: 'MENTIONED_WITH',
          status: 'ACTIVE',
        },
      ],
      temporalSpan: {
        factId: 'temp:span',
        startDate: '2026-08-01T00:00:00.000Z',
        endDate: '2026-08-16T00:00:00.000Z',
        durationDays: 15,
      },
      metrics: [
        {
          factId: 'metric:distinct_fragment_count',
          metricType: 'COUNT',
          value: 5,
        },
      ],
    },
    untrustedSnippets: [],
  };

  it('Gate G1: passes valid fact tuples and fails invalid predicates/facts', () => {
    const validResponse: LLMReflectionResponse = {
      propositions: [
        {
          propositionId: 'p1',
          subject: 'backend',
          predicate: 'MENTIONED_IN_ENTRIES',
          object: '5',
          authorizedFactId: 'ent:1',
        },
        {
          propositionId: 'p2',
          subject: 'backend',
          predicate: 'CO_OCCURS_WITH',
          object: 'API',
          authorizedFactId: 'rel:1',
        },
      ],
      segments: [
        {
          segmentId: 's1',
          text: 'backend was mentioned in 5 entries.',
          groundedPropositionIds: ['p1'],
        },
        {
          segmentId: 's2',
          text: 'backend and API were mentioned together.',
          groundedPropositionIds: ['p2'],
        },
      ],
      reflectionText:
        'backend was mentioned in 5 entries. backend and API were mentioned together.',
    };

    const result = validator.validate(mockBundle, validResponse);
    expect(result.passed).toBe(true);

    // Invalid: non-existent fact ID
    const badFactIdResponse: LLMReflectionResponse = {
      ...validResponse,
      propositions: [
        {
          ...validResponse.propositions[0],
          authorizedFactId: 'ent:unknown',
        },
      ],
    };
    const badFactResult = validator.validate(mockBundle, badFactIdResponse);
    expect(badFactResult.passed).toBe(false);
    expect(badFactResult.failureReason).toContain('references non-existent authorizedFactId');

    // Invalid: MENTIONED_WITH with illegal predicate COLLABORATED_WITH
    const illegalPredicateResponse: LLMReflectionResponse = {
      ...validResponse,
      propositions: [
        {
          ...validResponse.propositions[1],
          predicate: 'COLLABORATED_WITH',
        },
        validResponse.propositions[0],
      ],
    };
    const illegalPredResult = validator.validate(mockBundle, illegalPredicateResponse);
    expect(illegalPredResult.passed).toBe(false);
    expect(illegalPredResult.failureReason).toContain(
      "MENTIONED_WITH relationships must strictly use predicate 'CO_OCCURS_WITH'"
    );
  });

  it('Gate G2: rejects unauthorized quantities and raw percentages', () => {
    const rawPercentResponse: LLMReflectionResponse = {
      propositions: [
        {
          propositionId: 'p1',
          subject: 'backend',
          predicate: 'MENTIONED_IN_ENTRIES',
          object: '5',
          authorizedFactId: 'ent:1',
        },
      ],
      segments: [
        {
          segmentId: 's1',
          text: 'backend was mentioned in 5 entries with 95% confidence.',
          groundedPropositionIds: ['p1'],
        },
      ],
      reflectionText: 'backend was mentioned in 5 entries with 95% confidence.',
    };

    const percentResult = validator.validate(mockBundle, rawPercentResponse);
    expect(percentResult.passed).toBe(false);
    expect(percentResult.failureReason).toContain('Exposing raw percentage or probability score');

    // Invalid count (12 instead of 5)
    const badCountResponse: LLMReflectionResponse = {
      propositions: [
        {
          propositionId: 'p1',
          subject: 'backend',
          predicate: 'MENTIONED_IN_ENTRIES',
          object: '5',
          authorizedFactId: 'ent:1',
        },
      ],
      segments: [
        {
          segmentId: 's1',
          text: 'backend was mentioned across twelve distinct entries.',
          groundedPropositionIds: ['p1'],
        },
      ],
      reflectionText: 'backend was mentioned across twelve distinct entries.',
    };

    const countResult = validator.validate(mockBundle, badCountResponse);
    expect(countResult.passed).toBe(false);
    expect(countResult.failureReason).toContain('Unauthorized quantitative number');
  });

  it('Gate G3: rejects banned causal markers', () => {
    const causalResponse: LLMReflectionResponse = {
      propositions: [
        {
          propositionId: 'p1',
          subject: 'backend',
          predicate: 'MENTIONED_IN_ENTRIES',
          object: '5',
          authorizedFactId: 'ent:1',
        },
      ],
      segments: [
        {
          segmentId: 's1',
          text: 'backend work caused errors to be investigated.',
          groundedPropositionIds: ['p1'],
        },
      ],
      reflectionText: 'backend work caused errors to be investigated.',
    };

    const res = validator.validate(mockBundle, causalResponse);
    expect(res.passed).toBe(false);
    expect(res.failureReason).toContain("Banned causal marker 'caused'");
  });

  it('Gate G4: rejects emotional, psychological, and coaching markers', () => {
    const emotionalResponse: LLMReflectionResponse = {
      propositions: [
        {
          propositionId: 'p1',
          subject: 'backend',
          predicate: 'MENTIONED_IN_ENTRIES',
          object: '5',
          authorizedFactId: 'ent:1',
        },
      ],
      segments: [
        {
          segmentId: 's1',
          text: 'You felt stressed about backend work and should take a break.',
          groundedPropositionIds: ['p1'],
        },
      ],
      reflectionText: 'You felt stressed about backend work and should take a break.',
    };

    const res = validator.validate(mockBundle, emotionalResponse);
    expect(res.passed).toBe(false);
    expect(res.failureReason).toContain('Banned psychological/emotional marker');
  });

  it('Gate G5: rejects ungrounded entities and unauthorized action verbs', () => {
    // Mentions ungrounded entity Docker
    const ungroundedEntityResponse: LLMReflectionResponse = {
      propositions: [
        {
          propositionId: 'p1',
          subject: 'backend',
          predicate: 'MENTIONED_IN_ENTRIES',
          object: '5',
          authorizedFactId: 'ent:1',
        },
      ],
      segments: [
        {
          segmentId: 's1',
          text: 'backend was mentioned in 5 entries alongside API.',
          groundedPropositionIds: ['p1'], // Does NOT license API
        },
      ],
      reflectionText: 'backend was mentioned in 5 entries alongside API.',
    };

    const entityResult = validator.validate(mockBundle, ungroundedEntityResponse);
    expect(entityResult.passed).toBe(false);
    expect(entityResult.failureReason).toContain("mentions entity 'API' which is not licensed");

    // Realization frame violation: unauthorized action verb "solved" in CO_OCCURS_WITH
    const actionVerbResponse: LLMReflectionResponse = {
      propositions: [
        {
          propositionId: 'p1',
          subject: 'backend',
          predicate: 'CO_OCCURS_WITH',
          object: 'API',
          authorizedFactId: 'rel:1',
        },
      ],
      segments: [
        {
          segmentId: 's1',
          text: 'backend solved the API issues.',
          groundedPropositionIds: ['p1'],
        },
      ],
      reflectionText: 'backend solved the API issues.',
    };

    const actionResult = validator.validate(mockBundle, actionVerbResponse);
    expect(actionResult.passed).toBe(false);
    expect(actionResult.failureReason).toContain(
      "Unauthorized action verb 'solved' used in CO_OCCURS_WITH realization"
    );
  });
});
