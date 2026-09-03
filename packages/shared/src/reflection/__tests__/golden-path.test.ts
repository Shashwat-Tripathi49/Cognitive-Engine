import { describe, it, expect } from 'vitest';
import { ReflectionEngine } from '../engine.js';
import { InMemoryReflectionRepository } from '../repository.js';
import {
  ReasoningEngine,
  InMemoryReasoningRepository,
  EvidenceRetrievalService,
  InMemoryEvidenceStorageAdapter,
} from '../../reasoning/index.js';
import { InMemoryCognitiveRepository } from '../../cognitive/repository.js';
import { CognitiveEngine, InMemoryCognitiveDataProvider } from '../../cognitive/engine.js';
import { MockReflectionSynthesizer } from '../synthesizer.js';
import { LLMReflectionResponse } from '../types.js';

describe('Reflection Engine — Golden Path (30 Real Journal Entries Integration)', () => {
  const userId = '00000000-0000-0000-0000-000000000001';

  it('executes full Cognitive -> Reasoning -> Reflection pipeline with valid proposition grounding', async () => {
    // 1. Setup Cognitive & Reasoning engines
    const cognRepo = new InMemoryCognitiveRepository();
    const dataProvider = new InMemoryCognitiveDataProvider();
    const cognitiveEngine = new CognitiveEngine(cognRepo, dataProvider);

    const reasoningRepo = new InMemoryReasoningRepository();
    const reasoningStorage = new InMemoryEvidenceStorageAdapter();
    const retrievalService = new EvidenceRetrievalService(reasoningStorage);
    const reasoningEngine = new ReasoningEngine(reasoningRepo, retrievalService);

    // Populate dataProvider with 5 journal entries focusing on backend and API
    const dates = [
      '2026-08-01T10:00:00.000Z',
      '2026-08-04T11:00:00.000Z',
      '2026-08-07T14:00:00.000Z',
      '2026-08-11T09:30:00.000Z',
      '2026-08-16T16:45:00.000Z',
    ];

    const entities = [
      {
        id: 'ent-backend',
        canonicalName: 'backend',
        entityType: 'TOPIC',
        status: 'ACTIVE',
        aliases: [],
        createdAt: new Date('2026-08-01T00:00:00.000Z'),
      },
      {
        id: 'ent-api',
        canonicalName: 'API',
        entityType: 'TOPIC',
        status: 'ACTIVE',
        aliases: [],
        createdAt: new Date('2026-08-01T00:00:00.000Z'),
      },
    ];

    const fragments: Array<{ id: string; content: string; contentHash: string; capturedAt: Date; memoryId?: string | null }> = [];
    const provenance: Array<{
      id: string;
      canonicalId: string;
      sourceFragmentId: string;
      sourceContentHash: string;
      sourceMention: string;
      confidence: number;
      resolvedAt: Date;
    }> = [];

    dates.forEach((d, idx) => {
      const fId = `frag-gp-${idx + 1}`;
      fragments.push({
        id: fId,
        content: 'Worked on the backend API today.',
        contentHash: `hash-${idx + 1}`,
        capturedAt: new Date(d),
      });

      reasoningStorage.addFragment({
        id: fId,
        userId,
        content: 'Worked on the backend API today.',
        contentHash: `hash-${idx + 1}`,
        capturedAt: new Date(d),
      });

      provenance.push({
        id: `prov-b-${idx + 1}`,
        canonicalId: 'ent-backend',
        sourceFragmentId: fId,
        sourceContentHash: `hash-${idx + 1}`,
        sourceMention: 'backend',
        confidence: 0.95,
        resolvedAt: new Date(d),
      });

      provenance.push({
        id: `prov-a-${idx + 1}`,
        canonicalId: 'ent-api',
        sourceFragmentId: fId,
        sourceContentHash: `hash-${idx + 1}`,
        sourceMention: 'API',
        confidence: 0.95,
        resolvedAt: new Date(d),
      });
    });

    dataProvider.setContextData({
      entities,
      fragments,
      provenance,
    });

    // 2. Discover via Cognitive Engine
    const evalTime = new Date('2026-08-17T00:00:00.000Z');
    const discovery = await cognitiveEngine.discover(userId, {
      evaluationTimestamp: evalTime,
    });

    expect(discovery.findings.length).toBeGreaterThan(0);
    const backendFinding = discovery.findings.find((f) => f.statement.includes('backend'))!;
    expect(backendFinding).toBeDefined();

    // 3. Evaluate via Reasoning Engine
    const evalResponse = await reasoningEngine.evaluateFinding({
      userId,
      finding: backendFinding,
      evaluationTimestamp: evalTime,
    });

    expect(evalResponse.success).toBe(true);
    expect(evalResponse.claim).toBeDefined();
    expect(evalResponse.claim!.status).toBe('VALIDATED');
    expect(evalResponse.evidenceChain).toBeDefined();

    // 4. Generate Reflection using Reflection Engine
    const reflectionRepo = new InMemoryReflectionRepository();

    // Mock synthesizer that produces the approved Golden Path response
    const mockSynth = new MockReflectionSynthesizer(async (_bundle) => {
      const response: LLMReflectionResponse = {
        propositions: [
          {
            propositionId: 'p1',
            subject: 'backend',
            predicate: 'MENTIONED_IN_ENTRIES',
            object: '5',
            authorizedFactId: 'ent:ent-backend',
          },
        ],
        segments: [
          {
            segmentId: 's1',
            text: 'Over a 15-day period from August 1 to August 16, 2026, the journal records 5 independent entries focused on backend development.',
            groundedPropositionIds: ['p1'],
          },
        ],
        reflectionText:
          'Over a 15-day period from August 1 to August 16, 2026, the journal records 5 independent entries focused on backend development.',
      };
      return response;
    });

    const reflectionEngine = new ReflectionEngine(
      reflectionRepo,
      reasoningRepo,
      mockSynth
    );

    const reflection = await reflectionEngine.generateReflection({
      userId,
      claimId: evalResponse.claim!.id,
    });

    expect(reflection).toBeDefined();
    expect(reflection.synthesisMethod).toBe('LLM_CONSTRAINED');
    expect(reflection.text).toContain('5 independent entries');
    expect(reflection.structuredPropositions.length).toBe(1);
    expect(reflection.groundedSegments.length).toBe(1);
    expect(reflection.chainIntegrityHash).toBe(evalResponse.evidenceChain!.chainIntegrityHash);
  });
});
