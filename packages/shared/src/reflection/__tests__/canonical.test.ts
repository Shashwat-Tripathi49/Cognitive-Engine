import { describe, it, expect } from 'vitest';
import {
  canonicalizeJson,
  computeBundleHash,
  buildReflectionInputBundle,
} from '../canonical.js';
import { ValidatedClaim, EvidenceChain } from '../../reasoning/types.js';

describe('Reflection Engine — Canonical Serialization & Hashing', () => {
  it('canonicalizeJson: sorts keys lexicographically and normalizes floats', () => {
    const obj1 = { z: 1, a: 2, m: 3.14159265 };
    const obj2 = { a: 2, m: 3.14159265, z: 1 };

    expect(canonicalizeJson(obj1)).toBe(canonicalizeJson(obj2));
    expect(canonicalizeJson(obj1)).toBe('{"a":2,"m":3.1416,"z":1}');
  });

  it('computeBundleHash: produces identical SHA-256 hash across 20 re-serializations', () => {
    const claim: ValidatedClaim = {
      id: 'claim-det-1',
      userId: 'user-1',
      sourceFindingId: 'find-1',
      evidenceChainId: 'chain-1',
      claimType: 'RECURRING_TOPIC_FOCUS',
      status: 'VALIDATED',
      statement: "Entity 'backend' observed repeatedly",
      deterministicSupportScore: 0.95,
      appliedRuleIds: ['RULE_001', 'RULE_002'],
      passedRuleIds: ['RULE_001', 'RULE_002'],
      failedRuleIds: [],
      involvedEntityIds: ['ent-backend', 'ent-api'],
      involvedRelationshipIds: ['rel-1'],
      temporalScope: {
        startDate: new Date('2026-08-01T00:00:00.000Z'),
        endDate: new Date('2026-08-16T00:00:00.000Z'),
      },
      reasoningVersion: '1.0.0',
      createdAt: new Date('2026-08-16T12:00:00.000Z'),
      updatedAt: new Date('2026-08-16T12:00:00.000Z'),
    };

    const chain: EvidenceChain = {
      id: 'chain-1',
      userId: 'user-1',
      claimId: 'claim-det-1',
      findingId: 'find-1',
      rootFragmentIds: ['frag-1', 'frag-2', 'frag-3', 'frag-4', 'frag-5'],
      evaluationRecords: [],
      chainIntegrityHash: 'chain-hash-abcdef1234567890',
      reasoningVersion: '1.0.0',
      createdAt: new Date('2026-08-16T12:00:00.000Z'),
    };

    const hashes: string[] = [];
    for (let i = 0; i < 20; i++) {
      const bundle = buildReflectionInputBundle(claim, chain);
      const hash = computeBundleHash(bundle);
      hashes.push(hash);
    }

    const firstHash = hashes[0];
    for (const h of hashes) {
      expect(h).toBe(firstHash);
    }
  });
});
