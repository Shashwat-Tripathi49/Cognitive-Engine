import { describe, it, expect } from 'vitest';
import { InMemoryKnowledgeGraphRepository } from '../repository.js';
import { DeterministicMockExtractionProvider } from '../extraction/mock-provider.js';
import { LayeredHybridEntityResolver } from '../resolution/resolver.js';
import { KnowledgeGraphEngine } from '../engine.js';

describe('Phase KG-05 — End-to-End Knowledge Graph Vertical Slice', () => {
  const userId = '00000000-0000-0000-0000-000000000001';

  it('should process real CognitiveFragments sequentially, maintaining canonical identity and bitemporal assertions', async () => {
    const repository = new InMemoryKnowledgeGraphRepository();
    const extractionProvider = new DeterministicMockExtractionProvider();
    const resolver = new LayeredHybridEntityResolver();
    const engine = new KnowledgeGraphEngine(repository, extractionProvider, resolver);

    // =========================================================================
    // Fragment 1: Initial Thought
    // =========================================================================
    const frag1CapturedAt = new Date('2026-08-01T10:00:00Z');
    const result1 = await engine.processFragment({
      userId,
      fragmentId: 'frag_001',
      content: 'Met Rahul in Bangalore to build Expense Tracker using React and PostgreSQL.',
      contentHash: 'hash_frag_001_sha256',
      capturedAt: frag1CapturedAt,
      memoryId: 'mem_001',
    });

    expect(result1.entitiesExtracted).toBe(5);
    expect(result1.entitiesCreated).toBe(5); // 5 new canonical entities
    expect(result1.entitiesResolved).toBe(0);
    expect(result1.relationshipsCreated).toBeGreaterThanOrEqual(4);
    expect(result1.provenanceIds).toHaveLength(5);

    // Verify entities in repository
    const entities = await repository.listEntities(userId);
    expect(entities).toHaveLength(5);
    const names = entities.map((e) => e.canonicalName);
    expect(names).toContain('Rahul');
    expect(names).toContain('Bangalore');
    expect(names).toContain('Expense Tracker');
    expect(names).toContain('React');
    expect(names).toContain('PostgreSQL');

    // =========================================================================
    // Fragment 2: Follow-up Thought using Aliases and New Tools
    // =========================================================================
    // Add verified aliases for Expense Tracker and Rahul to test verified alias resolution
    const expenseEntity = entities.find((e) => e.canonicalName === 'Expense Tracker')!;
    await repository.addAlias({
      userId,
      canonicalId: expenseEntity.id,
      aliasName: 'personal finance tool',
    });

    const rahulEntity = entities.find((e) => e.canonicalName === 'Rahul')!;
    await repository.addAlias({
      userId,
      canonicalId: rahulEntity.id,
      aliasName: 'Rahul Sharma',
    });

    const frag2CapturedAt = new Date('2026-08-05T14:30:00Z');
    // Register custom mock rule for this specific phrasing
    const customMockRules = [
      { pattern: /\b(Rahul\s+Sharma)\b/i, name: 'Rahul Sharma', type: 'Person' },
      { pattern: /\b(personal\s+finance\s+tool)\b/i, name: 'personal finance tool', type: 'Project' },
      { pattern: /\b(Drizzle\s+ORM)\b/i, name: 'Drizzle ORM', type: 'Tool' },
    ];
    const customExtractor = new DeterministicMockExtractionProvider(customMockRules);
    const engineWithCustom = new KnowledgeGraphEngine(repository, customExtractor, resolver);

    const result2 = await engineWithCustom.processFragment({
      userId,
      fragmentId: 'frag_002',
      content: 'Discussed with Rahul Sharma about improving the personal finance tool with Drizzle ORM.',
      contentHash: 'hash_frag_002_sha256',
      capturedAt: frag2CapturedAt,
      memoryId: 'mem_002',
    });

    expect(result2.entitiesExtracted).toBe(3);
    expect(result2.entitiesResolved).toBe(2); // Rahul Sharma -> Rahul, personal finance tool -> Expense Tracker
    expect(result2.entitiesCreated).toBe(1); // Drizzle ORM is new
    expect(result2.relationshipsCreated).toBeGreaterThanOrEqual(2);

    // Total entities should now be 6 (5 + 1 new)
    const updatedEntities = await repository.listEntities(userId);
    expect(updatedEntities).toHaveLength(6);

    // =========================================================================
    // Fragment 3: Ambiguous Thought staged into Candidate Queue
    // =========================================================================
    const ambiguousMockRules = [
      { pattern: /\b(the\s+project)\b/i, name: 'the project', type: 'Project' },
    ];
    const ambiguousExtractor = new DeterministicMockExtractionProvider(ambiguousMockRules);
    const engineAmbiguous = new KnowledgeGraphEngine(repository, ambiguousExtractor, resolver);

    const result3 = await engineAmbiguous.processFragment({
      userId,
      fragmentId: 'frag_003',
      content: 'Thinking about the project timeline and next steps.',
      contentHash: 'hash_frag_003_sha256',
    });

    expect(result3.entitiesAmbiguous).toBe(1);
    expect(result3.entitiesCreated).toBe(0);
    expect(result3.entitiesResolved).toBe(0);

    const pendingCandidates = await engine.getPendingCandidates(userId);
    expect(pendingCandidates).toHaveLength(1);
    expect(pendingCandidates[0].surfaceMention).toBe('the project');
    expect(pendingCandidates[0].status).toBe('PENDING');

    // =========================================================================
    // Subgraph Query Verification
    // =========================================================================
    const subgraph = await engine.getSubgraph(userId, {
      entityId: expenseEntity.id,
    });

    expect(subgraph.nodes.length).toBeGreaterThanOrEqual(4);
    const subgraphNodeNames = subgraph.nodes.map((n) => n.canonicalName);
    expect(subgraphNodeNames).toContain('Expense Tracker');
    expect(subgraphNodeNames).toContain('Rahul');
    expect(subgraph.edges.length).toBeGreaterThanOrEqual(3);

    // Verify bitemporal dates on relationship edges
    for (const edge of subgraph.edges) {
      expect(edge.assertedAt).toBeInstanceOf(Date);
      expect(edge.validAt).toBeInstanceOf(Date);
      expect(edge.sourceContentHash).toBeDefined();
      expect(edge.sourceFragmentId).toBeDefined();
    }
  });
});
