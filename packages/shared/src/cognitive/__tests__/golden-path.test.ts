import { describe, it, expect } from 'vitest';
import * as crypto from 'crypto';
import { CognitiveEngine, InMemoryCognitiveDataProvider } from '../engine.js';
import { InMemoryCognitiveRepository } from '../repository.js';
import {
  ReasoningEngine,
  InMemoryReasoningRepository,
  EvidenceRetrievalService,
  InMemoryEvidenceStorageAdapter,
} from '../../reasoning/index.js';

describe('Cognitive Engine Golden-Path Validation (30 Journal Entries Dataset)', () => {
  const userId = '00000000-0000-0000-0000-000000000001';
  const evalTimestamp = new Date('2026-08-20T12:00:00Z');

  // Real journal entries from the 30-entry validation dataset mentioning backend / API / Rahul
  const realJournalDataset = [
    { id: 1, date: '2026-08-01T09:30:00Z', text: "Worked on the backend for a couple of hours today. Rahul helped me figure out why the API wasn't responding properly." },
    { id: 4, date: '2026-08-02T16:45:00Z', text: 'Finally understood a bit of the auth flow today. Still need to clean up the API though.' },
    { id: 11, date: '2026-08-06T16:00:00Z', text: 'Had another discussion with Rahul about the project. We went through the backend architecture.' },
    { id: 13, date: '2026-08-07T14:45:00Z', text: 'Spent the afternoon fixing the API routes.' },
    { id: 14, date: '2026-08-08T11:15:00Z', text: 'The backend is finally feeling less messy.' },
    { id: 19, date: '2026-08-10T15:30:00Z', text: 'Worked on the API again.' },
    { id: 21, date: '2026-08-11T16:15:00Z', text: 'Spoke to Rahul about the backend.' },
    { id: 30, date: '2026-08-16T10:00:00Z', text: "Looking back over the last few days, I've spent a ridiculous amount of time on backend and API problems." },
  ];

  it('autonomously discovers recurring backend and API topics from raw structured data and validates them', async () => {
    const backendEntityId = '20000000-0000-0000-0000-000000000001';
    const apiEntityId = '20000000-0000-0000-0000-000000000002';
    const rahulEntityId = '20000000-0000-0000-0000-000000000003';

    const entities = [
      { id: backendEntityId, canonicalName: 'backend', entityType: 'Topic', status: 'ACTIVE', aliases: [], createdAt: new Date('2026-08-01') },
      { id: apiEntityId, canonicalName: 'API', entityType: 'Topic', status: 'ACTIVE', aliases: [], createdAt: new Date('2026-08-01') },
      { id: rahulEntityId, canonicalName: 'Rahul', entityType: 'Person', status: 'ACTIVE', aliases: [], createdAt: new Date('2026-08-01') },
    ];

    const fragments: { id: string; content: string; contentHash: string; capturedAt: Date; memoryId?: string }[] = [];
    const provenance: { id: string; canonicalId: string; sourceFragmentId: string; sourceContentHash: string; sourceMention: string; confidence: number; resolvedAt: Date }[] = [];

    const reasoningStorage = new InMemoryEvidenceStorageAdapter();

    for (const entry of realJournalDataset) {
      const fragId = `00000000-0000-0000-0000-${entry.id.toString().padStart(12, '0')}`;
      const hash = crypto.createHash('sha256').update(entry.text).digest('hex');
      const capturedAt = new Date(entry.date);

      fragments.push({
        id: fragId,
        content: entry.text,
        contentHash: hash,
        capturedAt,
        memoryId: `mem_${entry.id}`,
      });

      reasoningStorage.addFragment({
        id: fragId,
        userId,
        contentHash: hash,
        capturedAt,
        content: entry.text,
      });

      if (entry.text.toLowerCase().includes('backend')) {
        provenance.push({
          id: `prov_b_${entry.id}`,
          canonicalId: backendEntityId,
          sourceFragmentId: fragId,
          sourceContentHash: hash,
          sourceMention: 'backend',
          confidence: 0.95,
          resolvedAt: capturedAt,
        });
      }

      if (entry.text.toLowerCase().includes('api')) {
        provenance.push({
          id: `prov_a_${entry.id}`,
          canonicalId: apiEntityId,
          sourceFragmentId: fragId,
          sourceContentHash: hash,
          sourceMention: 'API',
          confidence: 0.95,
          resolvedAt: capturedAt,
        });
      }

      if (entry.text.toLowerCase().includes('rahul')) {
        provenance.push({
          id: `prov_r_${entry.id}`,
          canonicalId: rahulEntityId,
          sourceFragmentId: fragId,
          sourceContentHash: hash,
          sourceMention: 'Rahul',
          confidence: 0.95,
          resolvedAt: capturedAt,
        });
      }
    }

    for (const ent of entities) {
      reasoningStorage.addEntity({
        id: ent.id,
        userId,
        canonicalName: ent.canonicalName,
        entityType: ent.entityType,
        status: ent.status,
      });
    }

    // Initialize Cognitive Engine
    const cognitiveProvider = new InMemoryCognitiveDataProvider();
    cognitiveProvider.setContextData({
      fragments,
      entities,
      provenance,
      memories: [],
      relationships: [],
    });

    const cognitiveEngine = new CognitiveEngine(
      new InMemoryCognitiveRepository(),
      cognitiveProvider
    );

    // Initialize Reasoning Engine
    const reasoningEngine = new ReasoningEngine(
      new InMemoryReasoningRepository(),
      new EvidenceRetrievalService(reasoningStorage)
    );

    // 1. Run Autonomous Discovery
    const discoveryResult = await cognitiveEngine.discover(userId, {
      evaluationTimestamp: evalTimestamp,
    });

    expect(discoveryResult.findings.length).toBeGreaterThanOrEqual(2);

    const backendFinding = discoveryResult.findings.find(
      (f) => f.subjectEntityId === backendEntityId && f.findingType === 'RECURRING_TOPIC_FOCUS'
    );
    expect(backendFinding).toBeDefined();
    expect(backendFinding!.deterministicMetrics.distinctFragmentCount).toBe(5);
    expect(backendFinding!.provenanceReferences.length).toBe(5);

    const apiFinding = discoveryResult.findings.find(
      (f) => f.subjectEntityId === apiEntityId && f.findingType === 'RECURRING_TOPIC_FOCUS'
    );
    expect(apiFinding).toBeDefined();
    expect(apiFinding!.deterministicMetrics.distinctFragmentCount).toBe(5);
    expect(apiFinding!.provenanceReferences.length).toBe(5);

    // Negative case assertions: verify absence of unsupported finding types
    const spuriousClusters = discoveryResult.findings.filter(
      (f) => f.findingType === 'COGNITIVE_CLUSTER'
    );
    expect(spuriousClusters).toHaveLength(0);

    const spuriousCollaborations = discoveryResult.findings.filter(
      (f) => f.findingType === 'COLLABORATION_PATTERN'
    );
    expect(spuriousCollaborations).toHaveLength(0);

    const spuriousDecisions = discoveryResult.findings.filter(
      (f) => f.findingType === 'ARCHITECTURAL_DECISION'
    );
    expect(spuriousDecisions).toHaveLength(0);

    // 2. Validate Discovered Findings through Reasoning Engine
    const evalBackend = await reasoningEngine.evaluateFinding({
      userId,
      finding: backendFinding!,
      evaluationTimestamp: evalTimestamp,
    });

    expect(evalBackend.success).toBe(true);
    expect(evalBackend.claim.status).toBe('VALIDATED');
    expect(evalBackend.claim.deterministicSupportScore).toBeGreaterThanOrEqual(0.60);
    expect(evalBackend.evidenceChain.isVerified).toBe(true);
    expect(evalBackend.evidenceChain.rootFragmentIds).toHaveLength(5);
  });
});
