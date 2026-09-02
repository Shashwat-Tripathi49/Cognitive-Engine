import { describe, it, expect } from 'vitest';
import { InMemoryKnowledgeGraphRepository } from '../repository.js';
import { LayeredHybridEntityResolver } from '../resolution/resolver.js';
import { KnowledgeGraphEngine } from '../engine.js';
import { DeterministicMockExtractionProvider } from '../extraction/mock-provider.js';

describe('Domain Invariants & Multi-Tenancy Enforcement', () => {
  const userA = '11111111-1111-1111-1111-111111111111';
  const userB = '22222222-2222-2222-2222-222222222222';

  it('Invariant 1 & 2: Evidence Lineage — assertions and provenance must link to valid source fragment and hash', async () => {
    const repo = new InMemoryKnowledgeGraphRepository();
    const extractor = new DeterministicMockExtractionProvider();
    const resolver = new LayeredHybridEntityResolver();
    const engine = new KnowledgeGraphEngine(repo, extractor, resolver);

    const fragmentId = 'frag_inv_01';
    const contentHash = 'hash_abcdef123456';
    const text = 'Worked with Rahul on Expense Tracker';

    await engine.processFragment({
      userId: userA,
      fragmentId,
      content: text,
      contentHash,
      memoryId: 'mem_01',
    });

    // Verify provenance records
    const provs = await repo.findProvenanceByFragmentId(fragmentId, userA);
    expect(provs.length).toBeGreaterThan(0);
    for (const p of provs) {
      expect(p.sourceFragmentId).toBe(fragmentId);
      expect(p.sourceContentHash).toBe(contentHash);
      expect(p.userId).toBe(userA);
    }

    // Verify relationships
    const rels = await repo.findRelationshipsByFragment(fragmentId, userA);
    expect(rels.length).toBeGreaterThan(0);
    for (const r of rels) {
      expect(r.sourceFragmentId).toBe(fragmentId);
      expect(r.sourceContentHash).toBe(contentHash);
      expect(r.userId).toBe(userA);
    }
  });

  it('Invariant 3: Confidence Origin — confidence is calculated mathematically by the engine, not emitted by LLM', async () => {
    const resolver = new LayeredHybridEntityResolver();

    // Exact match confidence is 1.0
    const sampleCanonicals = [
      {
        id: 'ent_1',
        userId: userA,
        canonicalName: 'FitTrack',
        entityType: 'Project' as const,
        status: 'ACTIVE' as const,
        aliases: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const exactMatch = await resolver.resolve('FitTrack', 'Project', sampleCanonicals);
    expect(typeof exactMatch.confidence).toBe('number');
    expect(exactMatch.confidence).toBe(1.0);

    // Modifier trap confidence
    const modTrap = await resolver.resolve('FitTrack Pro Edition', 'Project', sampleCanonicals);
    expect(modTrap.outcome).toBe('NO_MATCH');
    expect(modTrap.confidence).toBe(0.2);
  });

  it('Invariant 9: Multi-Tenant Isolation — User A data cannot be queried, resolved to, or modified by User B', async () => {
    const repo = new InMemoryKnowledgeGraphRepository();
    const extractor = new DeterministicMockExtractionProvider();
    const resolver = new LayeredHybridEntityResolver();
    const engine = new KnowledgeGraphEngine(repo, extractor, resolver);

    // User A processes a fragment creating "Expense Tracker"
    await engine.processFragment({
      userId: userA,
      fragmentId: 'frag_user_a',
      content: 'Started Expense Tracker project',
      contentHash: 'hash_user_a',
    });

    const userAEntities = await repo.listEntities(userA);
    expect(userAEntities).toHaveLength(1);
    expect(userAEntities[0].canonicalName).toBe('Expense Tracker');

    // User B query must return empty
    const userBEntities = await repo.listEntities(userB);
    expect(userBEntities).toHaveLength(0);

    // User B direct lookup for User A's entity ID must return null
    const userALeakCheck = await repo.findEntityById(userAEntities[0].id, userB);
    expect(userALeakCheck).toBeNull();

    // User B processing the same mention creates User B's own isolated canonical entity
    await engine.processFragment({
      userId: userB,
      fragmentId: 'frag_user_b',
      content: 'Started Expense Tracker project',
      contentHash: 'hash_user_b',
    });

    const userBEntitiesAfter = await repo.listEntities(userB);
    expect(userBEntitiesAfter).toHaveLength(1);
    expect(userBEntitiesAfter[0].id).not.toBe(userAEntities[0].id);
  });
});
