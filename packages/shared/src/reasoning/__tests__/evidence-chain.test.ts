import { describe, it, expect } from 'vitest';
import { ReasoningEngine } from '../engine.js';
import { EvidenceObject } from '../types.js';

describe('Milestone 5 — Evidence Chain Canonical Hashing', () => {
  const dummyUser = '00000000-0000-0000-0000-000000000001';
  const frag1 = '11111111-1111-1111-1111-111111111111';
  const frag2 = '22222222-2222-2222-2222-222222222222';
  const ent1 = '33333333-3333-3333-3333-333333333333';

  const evListA: EvidenceObject[] = [
    {
      id: 'ev_1',
      userId: dummyUser,
      evidenceType: 'COGNITIVE_FRAGMENT',
      sourceId: frag1,
      sourceContentHash: 'a'.repeat(64),
      sourceTimestamp: new Date('2026-08-01T10:00:00Z'),
      summary: 'Fragment 1',
      verified: true,
    },
    {
      id: 'ev_2',
      userId: dummyUser,
      evidenceType: 'COGNITIVE_FRAGMENT',
      sourceId: frag2,
      sourceContentHash: 'b'.repeat(64),
      sourceTimestamp: new Date('2026-08-05T14:00:00Z'),
      summary: 'Fragment 2',
      verified: true,
    },
    {
      id: 'ev_3',
      userId: dummyUser,
      evidenceType: 'CANONICAL_ENTITY',
      sourceId: ent1,
      summary: 'Entity 1',
      verified: true,
    },
  ];

  it('should generate identical chain hash regardless of array/retrieval ordering', () => {
    // Array in original order
    const hashA = ReasoningEngine.computeChainIntegrityHash(evListA);

    // Array in reverse order
    const evListB = [...evListA].reverse();
    const hashB = ReasoningEngine.computeChainIntegrityHash(evListB);

    // Array in permuted order
    const evListC = [evListA[1], evListA[2], evListA[0]];
    const hashC = ReasoningEngine.computeChainIntegrityHash(evListC);

    expect(hashA).toBe(hashB);
    expect(hashA).toBe(hashC);
    expect(hashA).toHaveLength(64); // Valid SHA-256 hex string
  });

  it('should generate different chain hash when source content hash changes', () => {
    const hashOriginal = ReasoningEngine.computeChainIntegrityHash(evListA);

    const evModified = evListA.map((ev, idx) =>
      idx === 0 ? { ...ev, sourceContentHash: 'f'.repeat(64) } : ev
    );
    const hashModified = ReasoningEngine.computeChainIntegrityHash(evModified);

    expect(hashModified).not.toBe(hashOriginal);
  });

  it('should generate different chain hash when an evidence object is added or removed', () => {
    const hashOriginal = ReasoningEngine.computeChainIntegrityHash(evListA);

    // Remove 1 item
    const evSubset = evListA.slice(0, 2);
    const hashSubset = ReasoningEngine.computeChainIntegrityHash(evSubset);
    expect(hashSubset).not.toBe(hashOriginal);

    // Add 1 item
    const evSuperset = [
      ...evListA,
      {
        id: 'ev_4',
        userId: dummyUser,
        evidenceType: 'RELATIONSHIP_ASSERTION' as const,
        sourceId: '44444444-4444-4444-4444-444444444444',
        summary: 'Extra relationship',
        verified: true,
      },
    ];
    const hashSuperset = ReasoningEngine.computeChainIntegrityHash(evSuperset);
    expect(hashSuperset).not.toBe(hashOriginal);
  });
});
