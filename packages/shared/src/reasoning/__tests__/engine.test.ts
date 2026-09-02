import { describe, it, expect } from 'vitest';
import * as crypto from 'crypto';
import { ReasoningEngine } from '../engine.js';
import { InMemoryReasoningRepository } from '../repository.js';
import {
  EvidenceRetrievalService,
  InMemoryEvidenceStorageAdapter,
} from '../retrieval.js';
import { CandidateFinding } from '../types.js';

describe('Milestone 5 — Reasoning Engine Golden Path & End-to-End Slice', () => {
  const userId = '00000000-0000-0000-0000-000000000001';

  // Real journal entries from the 30-entry validation dataset
  const rawJournalEntries = [
    { id: 1, date: '2026-08-01T09:30:00Z', text: "Worked on the backend for a couple of hours today. Rahul helped me figure out why the API wasn't responding properly." },
    { id: 4, date: '2026-08-02T16:45:00Z', text: 'Finally understood a bit of the auth flow today. Still need to clean up the API though.' },
    { id: 11, date: '2026-08-06T16:00:00Z', text: 'Had another discussion with Rahul about the project. We went through the backend architecture.' },
    { id: 13, date: '2026-08-07T14:45:00Z', text: 'Spent the afternoon fixing the API routes.' },
    { id: 14, date: '2026-08-08T11:15:00Z', text: 'The backend is finally feeling less messy.' },
    { id: 19, date: '2026-08-10T15:30:00Z', text: 'Worked on the API again.' },
    { id: 21, date: '2026-08-11T16:15:00Z', text: 'Spoke to Rahul about the backend.' },
    { id: 30, date: '2026-08-16T10:00:00Z', text: "Looking back over the last few days, I've spent a ridiculous amount of time on backend and API problems." },
  ];

  it('Golden Path: should validate recurring backend/API focus finding with 100% evidence lineage', async () => {
    const storage = new InMemoryEvidenceStorageAdapter();
    const provenanceReferences: { fragmentId: string; contentHash: string; capturedAt: Date }[] = [];
    const fragmentIds: string[] = [];

    // Populate storage with the 8 journal entries
    for (const entry of rawJournalEntries) {
      const fragId = `00000000-0000-0000-0000-${entry.id.toString().padStart(12, '0')}`;
      const hash = crypto.createHash('sha256').update(entry.text).digest('hex');
      const capturedAt = new Date(entry.date);

      storage.addFragment({
        id: fragId,
        userId,
        contentHash: hash,
        capturedAt,
        content: entry.text,
      });

      storage.addMemory({
        id: `10000000-0000-0000-0000-${entry.id.toString().padStart(12, '0')}`,
        userId,
        content: entry.text,
        createdAt: capturedAt,
        metadata: { sourceFragmentId: fragId },
      });

      provenanceReferences.push({
        fragmentId: fragId,
        contentHash: hash,
        capturedAt,
      });
      fragmentIds.push(fragId);
    }

    // Add canonical entities & relationships
    const backendEntityId = '20000000-0000-0000-0000-000000000001';
    const apiEntityId = '20000000-0000-0000-0000-000000000002';
    storage.addEntity({
      id: backendEntityId,
      userId,
      canonicalName: 'backend',
      entityType: 'Topic',
      status: 'ACTIVE',
    });
    storage.addEntity({
      id: apiEntityId,
      userId,
      canonicalName: 'API',
      entityType: 'Topic',
      status: 'ACTIVE',
    });

    const relId = '30000000-0000-0000-0000-000000000001';
    storage.addRelationship({
      id: relId,
      userId,
      sourceEntityId: backendEntityId,
      targetEntityId: apiEntityId,
      relationType: 'MENTIONED_WITH',
      status: 'ACTIVE',
      assertedAt: new Date('2026-08-01T09:30:00Z'),
      validAt: new Date('2026-08-01T09:30:00Z'),
    });

    const retrieval = new EvidenceRetrievalService(storage);
    const repo = new InMemoryReasoningRepository();
    const engine = new ReasoningEngine(repo, retrieval);

    // Upstream CandidateFinding fixture
    const candidateFinding: CandidateFinding = {
      id: 'find_gold_backend_api_001',
      userId,
      findingType: 'RECURRING_TOPIC_FOCUS',
      summary: 'Recurring focus on Backend and API',
      statement: 'The user engaged in repeated backend and API implementation across 8 distinct journal entries between August 1 and August 16, 2026.',
      subjectEntityId: backendEntityId,
      objectEntityId: apiEntityId,
      involvedEntityIds: [backendEntityId, apiEntityId],
      involvedMemoryIds: rawJournalEntries.map(
        (e) => `10000000-0000-0000-0000-${e.id.toString().padStart(12, '0')}`
      ),
      involvedRelationshipIds: [relId],
      temporalScope: {
        startDate: new Date('2026-08-01T00:00:00Z'),
        endDate: new Date('2026-08-16T23:59:59Z'),
      },
      deterministicMetrics: {
        distinctFragmentCount: 8,
        totalMentionCount: 11,
        frequencyPerWeek: 3.5,
      },
      discoveryAlgorithm: 'deterministic-frequency-v1',
      discoveryVersion: '1.0.0',
      discoveryConfidence: 0.90,
      provenanceReferences,
    };

    const evaluationTimestamp = new Date('2026-08-20T12:00:00Z');
    const result = await engine.evaluateFinding({
      userId,
      finding: candidateFinding,
      evaluationTimestamp,
    });

    expect(result.success).toBe(true);
    expect(result.claim.status).toBe('VALIDATED');
    expect(result.claim.deterministicSupportScore).toBeGreaterThanOrEqual(0.60);
    expect(result.claim.passedRuleIds).toHaveLength(6);
    expect(result.claim.failedRuleIds).toHaveLength(0);

    // Verify Evidence Chain
    expect(result.evidenceChain.isVerified).toBe(true);
    expect(result.evidenceChain.chainIntegrityHash).toHaveLength(64);
    expect(result.evidenceChain.rootFragmentIds).toHaveLength(8);
    for (const fid of fragmentIds) {
      expect(result.evidenceChain.rootFragmentIds).toContain(fid);
    }
  });

  it('Failure Path: should produce INSUFFICIENT_EVIDENCE when candidate finding lacks sufficient independent fragments', async () => {
    const storage = new InMemoryEvidenceStorageAdapter();
    const fragId = '00000000-0000-0000-0000-000000000001';
    const hash = 'a'.repeat(64);

    storage.addFragment({
      id: fragId,
      userId,
      contentHash: hash,
      capturedAt: new Date('2026-08-01T10:00:00Z'),
      content: 'Single entry',
    });

    const retrieval = new EvidenceRetrievalService(storage);
    const repo = new InMemoryReasoningRepository();
    const engine = new ReasoningEngine(repo, retrieval);

    const weakFinding: CandidateFinding = {
      id: 'find_insufficient_001',
      userId,
      findingType: 'RECURRING_TOPIC_FOCUS',
      summary: 'Recurring pattern claim from only 1 fragment',
      statement: 'Claiming recurrence from a single observation.',
      involvedEntityIds: [],
      involvedMemoryIds: [],
      involvedRelationshipIds: [],
      temporalScope: {
        startDate: new Date('2026-08-01T00:00:00Z'),
        endDate: new Date('2026-08-02T00:00:00Z'),
      },
      deterministicMetrics: { distinctFragmentCount: 1 },
      discoveryAlgorithm: 'test-v1',
      discoveryVersion: '1.0.0',
      discoveryConfidence: 0.5,
      provenanceReferences: [
        { fragmentId: fragId, contentHash: hash, capturedAt: new Date('2026-08-01T10:00:00Z') },
      ],
    };

    const res = await engine.evaluateFinding({
      userId,
      finding: weakFinding,
      evaluationTimestamp: new Date('2026-08-20T00:00:00Z'),
    });

    expect(res.claim.status).toBe('INSUFFICIENT_EVIDENCE');
    expect(res.claim.failedRuleIds).toContain('RULE_002_EVIDENCE_MULTIPLICITY');
    expect(res.evidenceChain.isVerified).toBe(false);
  });
});
