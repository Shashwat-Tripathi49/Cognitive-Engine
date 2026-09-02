import { describe, it, expect } from 'vitest';
import { CognitiveEngine, InMemoryCognitiveDataProvider } from '../engine.js';
import { InMemoryCognitiveRepository } from '../repository.js';
import { DEFAULT_COGNITIVE_CONFIG } from '../config.js';

describe('Cognitive Engine Determinism & 20-Run Replay Tests', () => {
  const userId = '00000000-0000-0000-0000-000000000001';
  const fixedEvalTime = new Date('2026-03-01T12:00:00.000Z');

  it('produces 100% byte-for-byte identical candidate findings across 20 consecutive runs', async () => {
    // Setup deterministic synthetic dataset
    const ent1 = { id: '00000000-0000-0000-0000-000000000011', canonicalName: 'GraphQL API', entityType: 'Project', status: 'ACTIVE', aliases: [], createdAt: new Date('2026-01-01') };
    const ent2 = { id: '00000000-0000-0000-0000-000000000012', canonicalName: 'PostgreSQL', entityType: 'Tool', status: 'ACTIVE', aliases: [], createdAt: new Date('2026-01-01') };

    const f1 = { id: '00000000-0000-0000-0000-000000000021', content: 'Started GraphQL API', contentHash: '1111111111111111111111111111111111111111111111111111111111111111', capturedAt: new Date('2026-02-01T10:00:00Z') };
    const f2 = { id: '00000000-0000-0000-0000-000000000022', content: 'Configured PostgreSQL for GraphQL API', contentHash: '2222222222222222222222222222222222222222222222222222222222222222', capturedAt: new Date('2026-02-02T10:00:00Z') };
    const f3 = { id: '00000000-0000-0000-0000-000000000023', content: 'Optimized GraphQL API resolvers', contentHash: '3333333333333333333333333333333333333333333333333333333333333333', capturedAt: new Date('2026-02-05T10:00:00Z') };

    const prov = [
      { id: 'p1', canonicalId: ent1.id, sourceFragmentId: f1.id, sourceContentHash: f1.contentHash, sourceMention: 'GraphQL API', confidence: 0.9, resolvedAt: f1.capturedAt },
      { id: 'p2', canonicalId: ent1.id, sourceFragmentId: f2.id, sourceContentHash: f2.contentHash, sourceMention: 'GraphQL API', confidence: 0.9, resolvedAt: f2.capturedAt },
      { id: 'p3', canonicalId: ent2.id, sourceFragmentId: f2.id, sourceContentHash: f2.contentHash, sourceMention: 'PostgreSQL', confidence: 0.9, resolvedAt: f2.capturedAt },
      { id: 'p4', canonicalId: ent1.id, sourceFragmentId: f3.id, sourceContentHash: f3.contentHash, sourceMention: 'GraphQL API', confidence: 0.9, resolvedAt: f3.capturedAt },
    ];

    const memories = [
      { id: 'm1', content: 'GraphQL architecture', embedding: [1, 0, 0], createdAt: new Date('2026-02-01') },
      { id: 'm2', content: 'GraphQL schema design', embedding: [0.96, 0.05, 0], createdAt: new Date('2026-02-02') },
      { id: 'm3', content: 'GraphQL mutations', embedding: [0.95, 0.06, 0], createdAt: new Date('2026-02-03') },
    ];

    const dataProvider = new InMemoryCognitiveDataProvider();
    dataProvider.setContextData({
      fragments: [f1, f2, f3],
      entities: [ent1, ent2],
      provenance: prov,
      memories,
      relationships: [],
    });

    const repo = new InMemoryCognitiveRepository();
    const engine = new CognitiveEngine(repo, dataProvider);

    let baselineSerialized = '';

    for (let run = 0; run < 20; run++) {
      const result = await engine.discover(userId, {
        evaluationTimestamp: fixedEvalTime,
        config: DEFAULT_COGNITIVE_CONFIG,
        persistFindings: false,
      });

      expect(result.findings.length).toBeGreaterThanOrEqual(2);

      // Normalize findings (excluding generated random UUID) to verify structural determinism
      const normalizedFindings = result.findings.map((f) => ({
        findingType: f.findingType,
        summary: f.summary,
        statement: f.statement,
        subjectEntityId: f.subjectEntityId,
        objectEntityId: f.objectEntityId,
        involvedEntityIds: f.involvedEntityIds,
        involvedMemoryIds: f.involvedMemoryIds,
        involvedRelationshipIds: f.involvedRelationshipIds,
        temporalScope: {
          startDate: f.temporalScope.startDate.toISOString(),
          endDate: f.temporalScope.endDate.toISOString(),
        },
        deterministicMetrics: f.deterministicMetrics,
        discoveryAlgorithm: f.discoveryAlgorithm,
        discoveryVersion: f.discoveryVersion,
        discoveryConfidence: f.discoveryConfidence,
        provenanceReferences: f.provenanceReferences.map((p) => ({
          fragmentId: p.fragmentId,
          contentHash: p.contentHash,
          capturedAt: p.capturedAt.toISOString(),
        })),
      }));

      const serialized = JSON.stringify(normalizedFindings);

      if (run === 0) {
        baselineSerialized = serialized;
      } else {
        expect(serialized).toBe(baselineSerialized);
      }
    }
  });
});
