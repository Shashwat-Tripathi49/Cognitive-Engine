import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { CognitiveEngine, InMemoryCognitiveDataProvider } from '../engine.js';
import { InMemoryCognitiveRepository } from '../repository.js';
import {
  ReasoningEngine,
  InMemoryReasoningRepository,
  EvidenceRetrievalService,
  InMemoryEvidenceStorageAdapter,
} from '../../reasoning/index.js';

describe('Cognitive -> Reasoning End-to-End Pipeline Integration Tests', () => {
  const userId = '00000000-0000-0000-0000-000000000001';
  const evalTime = new Date('2026-03-01T12:00:00.000Z');

  it('discovers a recurring topic and validates it through Reasoning Engine to produce a VALIDATED claim', async () => {
    // 1. Setup shared storage/providers
    const entity = {
      id: crypto.randomUUID(),
      canonicalName: 'Apollo GraphQL',
      entityType: 'Tool',
      status: 'ACTIVE',
      aliases: ['Apollo'],
      createdAt: new Date('2026-01-01'),
    };

    const f1 = {
      id: crypto.randomUUID(),
      content: 'Configured Apollo GraphQL server',
      contentHash: '1111111111111111111111111111111111111111111111111111111111111111',
      capturedAt: new Date('2026-02-01T10:00:00Z'),
    };
    const f2 = {
      id: crypto.randomUUID(),
      content: 'Optimized Apollo GraphQL queries',
      contentHash: '2222222222222222222222222222222222222222222222222222222222222222',
      capturedAt: new Date('2026-02-05T10:00:00Z'),
    };
    const f3 = {
      id: crypto.randomUUID(),
      content: 'Added Apollo GraphQL caching',
      contentHash: '3333333333333333333333333333333333333333333333333333333333333333',
      capturedAt: new Date('2026-02-10T10:00:00Z'),
    };

    const prov = [
      { id: crypto.randomUUID(), canonicalId: entity.id, sourceFragmentId: f1.id, sourceContentHash: f1.contentHash, sourceMention: 'Apollo GraphQL', confidence: 0.95, resolvedAt: f1.capturedAt },
      { id: crypto.randomUUID(), canonicalId: entity.id, sourceFragmentId: f2.id, sourceContentHash: f2.contentHash, sourceMention: 'Apollo GraphQL', confidence: 0.95, resolvedAt: f2.capturedAt },
      { id: crypto.randomUUID(), canonicalId: entity.id, sourceFragmentId: f3.id, sourceContentHash: f3.contentHash, sourceMention: 'Apollo GraphQL', confidence: 0.95, resolvedAt: f3.capturedAt },
    ];

    // Setup Cognitive Data Provider
    const cognitiveProvider = new InMemoryCognitiveDataProvider();
    cognitiveProvider.setContextData({
      fragments: [f1, f2, f3],
      entities: [entity],
      provenance: prov,
      memories: [],
      relationships: [],
    });

    const cognitiveEngine = new CognitiveEngine(
      new InMemoryCognitiveRepository(),
      cognitiveProvider
    );

    // Setup Reasoning Engine storage adapter
    const reasoningAdapter = new InMemoryEvidenceStorageAdapter();
    for (const f of [f1, f2, f3]) {
      reasoningAdapter.addFragment({
        id: f.id,
        userId,
        contentHash: f.contentHash,
        capturedAt: f.capturedAt,
        content: f.content,
      });
    }
    reasoningAdapter.addEntity({
      id: entity.id,
      userId,
      canonicalName: entity.canonicalName,
      entityType: entity.entityType,
      status: entity.status,
    });

    const reasoningEngine = new ReasoningEngine(
      new InMemoryReasoningRepository(),
      new EvidenceRetrievalService(reasoningAdapter)
    );

    // 2. Execute End-to-End Pipeline
    const pipelineResult = await cognitiveEngine.runPipeline(userId, reasoningEngine, {
      evaluationTimestamp: evalTime,
    });

    expect(pipelineResult.discovery.findings.length).toBe(1);
    const discoveredFinding = pipelineResult.discovery.findings[0];
    expect(discoveredFinding.findingType).toBe('RECURRING_TOPIC_FOCUS');

    expect(pipelineResult.evaluations.length).toBe(1);
    const evaluation = pipelineResult.evaluations[0];

    // Assert Reasoning validation status
    expect(evaluation.claim.status).toBe('VALIDATED');
    expect(evaluation.claim.deterministicSupportScore).toBeGreaterThanOrEqual(0.6);
    expect(evaluation.evidenceChain.isVerified).toBe(true);
    expect(evaluation.evidenceChain.chainIntegrityHash).toBeDefined();
    expect(evaluation.evidenceChain.chainIntegrityHash.length).toBe(64);
    expect(evaluation.evidenceChain.ruleEvaluations.length).toBe(6);
    expect(evaluation.evidenceChain.ruleEvaluations.every((r) => r.passed)).toBe(true);
  });
});
