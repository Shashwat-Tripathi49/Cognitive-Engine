import { describe, it, expect } from 'vitest';
import { TemplateReflectionSynthesizer, renderRelationshipFallback } from '../fallback.js';
import { ReflectionValidator } from '../validator.js';
import { ReflectionInputBundle } from '../types.js';

describe('Reflection Engine — Deterministic Fallback Generator', () => {
  const synthesizer = new TemplateReflectionSynthesizer();
  const validator = new ReflectionValidator();

  it('renderRelationshipFallback: strictly enforces co-mention for MENTIONED_WITH', () => {
    const text = renderRelationshipFallback(
      'MENTIONED_WITH',
      'Rahul',
      'Expense Tracker',
      3,
      '2026-08-01',
      '2026-08-16'
    );

    expect(text).toContain("recurring co-mention of 'Rahul' and 'Expense Tracker'");
    expect(text).not.toContain('collaboration');
    expect(text).not.toContain('teamwork');
    expect(text).not.toContain('worked on');
  });

  it('renderRelationshipFallback: permits collaboration for COLLABORATED_WITH', () => {
    const text = renderRelationshipFallback(
      'COLLABORATED_WITH',
      'Alice',
      'Bob',
      4,
      '2026-08-01',
      '2026-08-16'
    );

    expect(text).toContain("recurring verified collaboration between 'Alice' and 'Bob'");
  });

  it('generateFallback: output passes ReflectionValidator with zero errors', () => {
    const bundle: ReflectionInputBundle = {
      schemaVersion: '1.0.0',
      canonicalizationVersion: '1.0.0',
      claimId: 'claim-fb',
      claimType: 'COLLABORATION_PATTERN',
      claimStatement: "Verified collaboration between 'Alice' and 'Bob'",
      evidenceChainId: 'chain-fb',
      chainIntegrityHash: 'hash-fb',
      authorizedFacts: {
        entities: [
          { factId: 'ent:1', entityId: '1', canonicalName: 'Alice', entityType: 'PERSON' },
          { factId: 'ent:2', entityId: '2', canonicalName: 'Bob', entityType: 'PERSON' },
        ],
        relationships: [
          {
            factId: 'rel:1',
            sourceEntityId: '1',
            sourceEntityName: 'Alice',
            targetEntityId: '2',
            targetEntityName: 'Bob',
            relationType: 'COLLABORATED_WITH',
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
            value: 4,
          },
        ],
      },
      untrustedSnippets: [],
    };

    const response = synthesizer.generateFallback(bundle);
    const valResult = validator.validate(bundle, response);

    expect(valResult.passed).toBe(true);
    expect(response.reflectionText).toContain('recurring verified collaboration');
  });

  it('generateFallback: cognitive cluster fallback is strictly mathematical', () => {
    const clusterBundle: ReflectionInputBundle = {
      schemaVersion: '1.0.0',
      canonicalizationVersion: '1.0.0',
      claimId: 'claim-cl',
      claimType: 'COGNITIVE_CLUSTER',
      claimStatement: 'Vector cluster identified',
      evidenceChainId: 'chain-cl',
      chainIntegrityHash: 'hash-cl',
      authorizedFacts: {
        entities: [],
        relationships: [],
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
            value: 4,
          },
          {
            factId: 'metric:cluster_cohesion',
            metricType: 'COHESION_SCORE',
            value: 0.88,
          },
        ],
      },
      untrustedSnippets: [],
    };

    const response = synthesizer.generateFallback(clusterBundle);
    const valResult = validator.validate(clusterBundle, response);

    expect(valResult.passed).toBe(true);
    expect(response.reflectionText).toContain('average pairwise cosine cohesion of 0.880');
    expect(response.reflectionText).not.toContain('theme');
    expect(response.reflectionText).not.toContain('productivity');
  });
});
