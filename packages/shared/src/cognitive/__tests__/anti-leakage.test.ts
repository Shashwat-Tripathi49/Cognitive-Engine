import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { CognitiveEngine, InMemoryCognitiveDataProvider } from '../engine.js';
import { InMemoryCognitiveRepository } from '../repository.js';

describe('Cognitive Engine Anti-Interpretation & Anti-Causality Safeguards', () => {
  const userId = '00000000-0000-0000-0000-000000000001';
  const evalTime = new Date('2026-03-01T12:00:00.000Z');

  const BANNED_INTERPRETIVE_PHRASES = [
    'caused by',
    'causes',
    'led to',
    'responsible for',
    'makes user',
    'user felt',
    'stressed by',
    'frustrated with',
    'motivated by',
    'psychologically',
    'should',
    'recommends',
    'best option',
    'chosen because',
  ];

  it('verifies 0% banned interpretive or causal phrases in all emitted finding statements and summaries', async () => {
    const ent1 = { id: crypto.randomUUID(), canonicalName: 'Backend Engine', entityType: 'Project', status: 'ACTIVE', aliases: [], createdAt: new Date() };
    const ent2 = { id: crypto.randomUUID(), canonicalName: 'PostgreSQL', entityType: 'Tool', status: 'ACTIVE', aliases: [], createdAt: new Date() };

    const f1 = { id: crypto.randomUUID(), content: 'Journal 1', contentHash: '1111111111111111111111111111111111111111111111111111111111111111', capturedAt: new Date('2026-02-01') };
    const f2 = { id: crypto.randomUUID(), content: 'Journal 2', contentHash: '2222222222222222222222222222222222222222222222222222222222222222', capturedAt: new Date('2026-02-02') };

    const prov = [
      { id: 'p1', canonicalId: ent1.id, sourceFragmentId: f1.id, sourceContentHash: f1.contentHash, sourceMention: 'Backend Engine', confidence: 0.9, resolvedAt: f1.capturedAt },
      { id: 'p2', canonicalId: ent1.id, sourceFragmentId: f2.id, sourceContentHash: f2.contentHash, sourceMention: 'Backend Engine', confidence: 0.9, resolvedAt: f2.capturedAt },
    ];

    const rels = [
      {
        id: crypto.randomUUID(),
        sourceEntityId: ent1.id,
        targetEntityId: ent2.id,
        relationType: 'WORKED_ON',
        status: 'ACTIVE',
        confidence: 0.9,
        evidenceCount: 2,
        sourceFragmentId: f1.id,
        sourceContentHash: f1.contentHash,
        assertedAt: f1.capturedAt,
        validAt: f1.capturedAt,
      },
    ];

    const memories = [
      { id: 'm1', content: 'Database config', embedding: [1, 0], createdAt: new Date('2026-02-01') },
      { id: 'm2', content: 'Database migration', embedding: [0.98, 0.01], createdAt: new Date('2026-02-02') },
      { id: 'm3', content: 'Database indexing', embedding: [0.97, 0.02], createdAt: new Date('2026-02-03') },
    ];

    const dataProvider = new InMemoryCognitiveDataProvider();
    dataProvider.setContextData({
      fragments: [f1, f2],
      entities: [ent1, ent2],
      provenance: prov,
      relationships: rels,
      memories,
    });

    const engine = new CognitiveEngine(new InMemoryCognitiveRepository(), dataProvider);
    const result = await engine.discover(userId, { evaluationTimestamp: evalTime });

    expect(result.findings.length).toBeGreaterThan(0);

    for (const finding of result.findings) {
      const lowerStatement = finding.statement.toLowerCase();
      const lowerSummary = finding.summary.toLowerCase();

      for (const phrase of BANNED_INTERPRETIVE_PHRASES) {
        expect(lowerStatement).not.toContain(phrase);
        expect(lowerSummary).not.toContain(phrase);
      }
    }
  });

  it('guarantees zero ARCHITECTURAL_DECISION findings are emitted in Milestone 6 (DEFERRED)', async () => {
    const project = { id: crypto.randomUUID(), canonicalName: 'Cognitive Engine', entityType: 'Project', status: 'ACTIVE', aliases: [], createdAt: new Date() };
    const tool = { id: crypto.randomUUID(), canonicalName: 'PostgreSQL', entityType: 'Tool', status: 'ACTIVE', aliases: [], createdAt: new Date() };

    const f1 = { id: crypto.randomUUID(), content: 'Adopted PostgreSQL', contentHash: '1111111111111111111111111111111111111111111111111111111111111111', capturedAt: new Date('2026-02-01') };

    // Active USES_TECHNOLOGY relationship in graph
    const rels = [
      {
        id: crypto.randomUUID(),
        sourceEntityId: project.id,
        targetEntityId: tool.id,
        relationType: 'USES_TECHNOLOGY',
        status: 'ACTIVE',
        confidence: 0.95,
        evidenceCount: 1,
        sourceFragmentId: f1.id,
        sourceContentHash: f1.contentHash,
        assertedAt: f1.capturedAt,
        validAt: f1.capturedAt,
      },
    ];

    const dataProvider = new InMemoryCognitiveDataProvider();
    dataProvider.setContextData({
      fragments: [f1],
      entities: [project, tool],
      provenance: [],
      relationships: rels,
      memories: [],
    });

    const engine = new CognitiveEngine(new InMemoryCognitiveRepository(), dataProvider);
    const result = await engine.discover(userId, { evaluationTimestamp: evalTime });

    const archFindings = result.findings.filter((f) => f.findingType === 'ARCHITECTURAL_DECISION');
    expect(archFindings.length).toBe(0);
  });
});
