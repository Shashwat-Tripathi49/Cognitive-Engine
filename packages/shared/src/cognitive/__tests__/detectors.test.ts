import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  TopicRecurrenceDetector,
  TemporalSequenceMiner,
  DeterministicVectorClusterer,
  GraphCoOccurrenceMiner,
} from '../detectors/index.js';
import { CognitiveDiscoveryContext } from '../types.js';
import { DEFAULT_COGNITIVE_CONFIG } from '../config.js';

describe('Cognitive Engine Detectors (Unit Tests)', () => {
  const userId = '00000000-0000-0000-0000-000000000001';
  const evalTime = new Date('2026-03-01T12:00:00.000Z');

  function makeContext(overrides: Partial<CognitiveDiscoveryContext> = {}): CognitiveDiscoveryContext {
    return {
      userId,
      evaluationTimestamp: evalTime,
      config: DEFAULT_COGNITIVE_CONFIG,
      fragments: [],
      memories: [],
      entities: [],
      provenance: [],
      relationships: [],
      ...overrides,
    };
  }

  describe('TopicRecurrenceDetector', () => {
    it('discovers recurring topic when entity appears in >= minRecurrenceFragments (N=2)', async () => {
      const detector = new TopicRecurrenceDetector();

      const frag1 = {
        id: crypto.randomUUID(),
        content: 'Worked on Apollo GraphQL API',
        contentHash: 'hash1111111111111111111111111111111111111111111111111111111111111111',
        capturedAt: new Date('2026-02-01T10:00:00.000Z'),
      };
      const frag2 = {
        id: crypto.randomUUID(),
        content: 'Refactored Apollo resolvers',
        contentHash: 'hash2222222222222222222222222222222222222222222222222222222222222222',
        capturedAt: new Date('2026-02-05T10:00:00.000Z'),
      };

      const entityId = crypto.randomUUID();
      const entity = {
        id: entityId,
        canonicalName: 'Apollo',
        entityType: 'Tool',
        status: 'ACTIVE',
        aliases: ['Apollo GraphQL'],
        createdAt: new Date('2026-02-01T10:00:00.000Z'),
      };

      const prov = [
        {
          id: crypto.randomUUID(),
          canonicalId: entityId,
          sourceFragmentId: frag1.id,
          sourceContentHash: frag1.contentHash,
          sourceMention: 'Apollo',
          confidence: 0.95,
          resolvedAt: frag1.capturedAt,
        },
        {
          id: crypto.randomUUID(),
          canonicalId: entityId,
          sourceFragmentId: frag2.id,
          sourceContentHash: frag2.contentHash,
          sourceMention: 'Apollo',
          confidence: 0.95,
          resolvedAt: frag2.capturedAt,
        },
      ];

      const context = makeContext({
        fragments: [frag1, frag2],
        entities: [entity],
        provenance: prov,
      });

      const findings = await detector.discover(context);

      expect(findings.length).toBe(1);
      const f = findings[0];
      expect(f.findingType).toBe('RECURRING_TOPIC_FOCUS');
      expect(f.subjectEntityId).toBe(entityId);
      expect(f.deterministicMetrics.distinctFragmentCount).toBe(2);
      expect(f.discoveryConfidence).toBeGreaterThanOrEqual(0.6);
      expect(f.provenanceReferences.length).toBe(2);
      expect(f.statement).toContain("Entity 'Apollo' was observed across 2 independent journal entries");
    });

    it('emits nothing when entity appears in only 1 fragment (N < minRecurrenceFragments)', async () => {
      const detector = new TopicRecurrenceDetector();

      const frag1 = {
        id: crypto.randomUUID(),
        content: 'Investigated Redis caching',
        contentHash: 'hash1111111111111111111111111111111111111111111111111111111111111111',
        capturedAt: new Date('2026-02-01T10:00:00.000Z'),
      };

      const entityId = crypto.randomUUID();
      const entity = {
        id: entityId,
        canonicalName: 'Redis',
        entityType: 'Tool',
        status: 'ACTIVE',
        aliases: [],
        createdAt: new Date('2026-02-01T10:00:00.000Z'),
      };

      const prov = [
        {
          id: crypto.randomUUID(),
          canonicalId: entityId,
          sourceFragmentId: frag1.id,
          sourceContentHash: frag1.contentHash,
          sourceMention: 'Redis',
          confidence: 0.95,
          resolvedAt: frag1.capturedAt,
        },
      ];

      const context = makeContext({
        fragments: [frag1],
        entities: [entity],
        provenance: prov,
      });

      const findings = await detector.discover(context);
      expect(findings.length).toBe(0);
    });

    it('treats multiple mentions in the same fragment as 1 distinct fragment', async () => {
      const detector = new TopicRecurrenceDetector();

      const frag1 = {
        id: crypto.randomUUID(),
        content: 'Redis is fast. I love Redis caching and Redis clusters.',
        contentHash: 'hash1111111111111111111111111111111111111111111111111111111111111111',
        capturedAt: new Date('2026-02-01T10:00:00.000Z'),
      };

      const entityId = crypto.randomUUID();
      const entity = {
        id: entityId,
        canonicalName: 'Redis',
        entityType: 'Tool',
        status: 'ACTIVE',
        aliases: [],
        createdAt: new Date('2026-02-01T10:00:00.000Z'),
      };

      // 3 provenance records for 3 mentions in the same fragment
      const prov = [1, 2, 3].map(() => ({
        id: crypto.randomUUID(),
        canonicalId: entityId,
        sourceFragmentId: frag1.id,
        sourceContentHash: frag1.contentHash,
        sourceMention: 'Redis',
        confidence: 0.95,
        resolvedAt: frag1.capturedAt,
      }));

      const context = makeContext({
        fragments: [frag1],
        entities: [entity],
        provenance: prov,
      });

      const findings = await detector.discover(context);
      // N_frag = 1 < 2 => emit nothing
      expect(findings.length).toBe(0);
    });
  });

  describe('TemporalSequenceMiner', () => {
    it('discovers chronological sequence A -> B when occurring >= 2 times within 72h window', async () => {
      const miner = new TemporalSequenceMiner();

      const entA = {
        id: crypto.randomUUID(),
        canonicalName: 'Design Review',
        entityType: 'Topic',
        status: 'ACTIVE',
        aliases: [],
        createdAt: new Date('2026-01-01'),
      };
      const entB = {
        id: crypto.randomUUID(),
        canonicalName: 'Database Migration',
        entityType: 'Topic',
        status: 'ACTIVE',
        aliases: [],
        createdAt: new Date('2026-01-01'),
      };

      // Pair 1: Day 1 -> Day 2 (24h delta)
      const f1 = {
        id: crypto.randomUUID(),
        content: 'Conducted Design Review',
        contentHash: 'h1111111111111111111111111111111111111111111111111111111111111111',
        capturedAt: new Date('2026-02-01T10:00:00Z'),
      };
      const f2 = {
        id: crypto.randomUUID(),
        content: 'Executed Database Migration',
        contentHash: 'h2222222222222222222222222222222222222222222222222222222222222222',
        capturedAt: new Date('2026-02-02T10:00:00Z'),
      };

      // Pair 2: Day 10 -> Day 11 (24h delta)
      const f3 = {
        id: crypto.randomUUID(),
        content: 'Second Design Review for v2',
        contentHash: 'h3333333333333333333333333333333333333333333333333333333333333333',
        capturedAt: new Date('2026-02-10T10:00:00Z'),
      };
      const f4 = {
        id: crypto.randomUUID(),
        content: 'Executed second Database Migration',
        contentHash: 'h4444444444444444444444444444444444444444444444444444444444444444',
        capturedAt: new Date('2026-02-11T10:00:00Z'),
      };

      const prov = [
        { id: crypto.randomUUID(), canonicalId: entA.id, sourceFragmentId: f1.id, sourceContentHash: f1.contentHash, sourceMention: 'Design Review', confidence: 0.9, resolvedAt: f1.capturedAt },
        { id: crypto.randomUUID(), canonicalId: entB.id, sourceFragmentId: f2.id, sourceContentHash: f2.contentHash, sourceMention: 'Database Migration', confidence: 0.9, resolvedAt: f2.capturedAt },
        { id: crypto.randomUUID(), canonicalId: entA.id, sourceFragmentId: f3.id, sourceContentHash: f3.contentHash, sourceMention: 'Design Review', confidence: 0.9, resolvedAt: f3.capturedAt },
        { id: crypto.randomUUID(), canonicalId: entB.id, sourceFragmentId: f4.id, sourceContentHash: f4.contentHash, sourceMention: 'Database Migration', confidence: 0.9, resolvedAt: f4.capturedAt },
      ];

      const context = makeContext({
        fragments: [f1, f2, f3, f4],
        entities: [entA, entB],
        provenance: prov,
      });

      const findings = await miner.discover(context);
      expect(findings.length).toBe(1);
      const f = findings[0];
      expect(f.findingType).toBe('TEMPORAL_SEQUENCE');
      expect(f.subjectEntityId).toBe(entA.id);
      expect(f.objectEntityId).toBe(entB.id);
      expect(f.deterministicMetrics.sequenceOccurrences).toBe(2);
      expect(f.statement).toContain("Observed chronological sequence where 'Design Review' was followed by 'Database Migration'");
    });

    it('rejects sequence pairs when delta exceeds maxSequenceGapHours (72h)', async () => {
      const miner = new TemporalSequenceMiner();

      const entA = { id: crypto.randomUUID(), canonicalName: 'Design Review', entityType: 'Topic', status: 'ACTIVE', aliases: [], createdAt: new Date() };
      const entB = { id: crypto.randomUUID(), canonicalName: 'Database Migration', entityType: 'Topic', status: 'ACTIVE', aliases: [], createdAt: new Date() };

      // 100 hours apart (> 72h)
      const f1 = { id: crypto.randomUUID(), content: 'A', contentHash: 'h1111111111111111111111111111111111111111111111111111111111111111', capturedAt: new Date('2026-02-01T10:00:00Z') };
      const f2 = { id: crypto.randomUUID(), content: 'B', contentHash: 'h2222222222222222222222222222222222222222222222222222222222222222', capturedAt: new Date('2026-02-05T15:00:00Z') };

      const prov = [
        { id: crypto.randomUUID(), canonicalId: entA.id, sourceFragmentId: f1.id, sourceContentHash: f1.contentHash, sourceMention: 'A', confidence: 0.9, resolvedAt: f1.capturedAt },
        { id: crypto.randomUUID(), canonicalId: entB.id, sourceFragmentId: f2.id, sourceContentHash: f2.contentHash, sourceMention: 'B', confidence: 0.9, resolvedAt: f2.capturedAt },
      ];

      const context = makeContext({
        fragments: [f1, f2],
        entities: [entA, entB],
        provenance: prov,
      });

      const findings = await miner.discover(context);
      expect(findings.length).toBe(0);
    });
  });

  describe('DeterministicVectorClusterer (Option B: Connected Components)', () => {
    it('discovers cluster when >= 3 memories form a connected component with cosine similarity >= 0.82', async () => {
      const clusterer = new DeterministicVectorClusterer();

      // 3 highly similar vectors
      const mem1 = { id: crypto.randomUUID(), content: 'API routes and endpoints', embedding: [1, 0, 0, 0], createdAt: new Date('2026-02-01') };
      const mem2 = { id: crypto.randomUUID(), content: 'API controller methods', embedding: [0.98, 0.1, 0, 0], createdAt: new Date('2026-02-02') };
      const mem3 = { id: crypto.randomUUID(), content: 'API validation middleware', embedding: [0.97, 0.12, 0, 0], createdAt: new Date('2026-02-03') };

      const context = makeContext({
        memories: [mem1, mem2, mem3],
      });

      const findings = await clusterer.discover(context);
      expect(findings.length).toBe(1);
      const f = findings[0];
      expect(f.findingType).toBe('COGNITIVE_CLUSTER');
      expect(f.deterministicMetrics.clusterSize).toBe(3);
      expect(f.deterministicMetrics.cohesionScore).toBeGreaterThanOrEqual(0.95);
      expect(f.involvedMemoryIds).toContain(mem1.id);
      expect(f.involvedMemoryIds).toContain(mem2.id);
      expect(f.involvedMemoryIds).toContain(mem3.id);
      expect(f.summary).toMatch(/Vector cluster \[3 memories, cohesion: 0\.\d{3}\]/);
    });

    it('rejects clusters with size < 3 (minClusterSize requirement)', async () => {
      const clusterer = new DeterministicVectorClusterer();

      // Only 2 memories
      const mem1 = { id: crypto.randomUUID(), content: 'API routes', embedding: [1, 0, 0, 0], createdAt: new Date('2026-02-01') };
      const mem2 = { id: crypto.randomUUID(), content: 'API controller', embedding: [0.98, 0.1, 0, 0], createdAt: new Date('2026-02-02') };

      const context = makeContext({
        memories: [mem1, mem2],
      });

      const findings = await clusterer.discover(context);
      expect(findings.length).toBe(0);
    });

    it('is invariant to the order of memory nodes in the input array', async () => {
      const clusterer = new DeterministicVectorClusterer();

      const mem1 = { id: 'm1', content: 'A', embedding: [1, 0, 0], createdAt: new Date('2026-02-01') };
      const mem2 = { id: 'm2', content: 'B', embedding: [0.95, 0.05, 0], createdAt: new Date('2026-02-02') };
      const mem3 = { id: 'm3', content: 'C', embedding: [0.94, 0.06, 0], createdAt: new Date('2026-02-03') };

      const run1 = await clusterer.discover(makeContext({ memories: [mem1, mem2, mem3] }));
      const run2 = await clusterer.discover(makeContext({ memories: [mem3, mem1, mem2] }));

      expect(run1.length).toBe(1);
      expect(run2.length).toBe(1);
      expect(run1[0].deterministicMetrics.cohesionScore).toBe(run2[0].deterministicMetrics.cohesionScore);
      expect(run1[0].involvedMemoryIds.sort()).toEqual(run2[0].involvedMemoryIds.sort());
    });
  });

  describe('GraphCoOccurrenceMiner', () => {
    it('discovers COLLABORATION_PATTERN when semantic relationship exists across >= 2 fragments', async () => {
      const miner = new GraphCoOccurrenceMiner();

      const person = { id: crypto.randomUUID(), canonicalName: 'Rahul', entityType: 'Person', status: 'ACTIVE', aliases: [], createdAt: new Date() };
      const project = { id: crypto.randomUUID(), canonicalName: 'Expense Tracker', entityType: 'Project', status: 'ACTIVE', aliases: [], createdAt: new Date() };

      const f1 = { id: crypto.randomUUID(), content: 'Worked with Rahul', contentHash: 'h1111111111111111111111111111111111111111111111111111111111111111', capturedAt: new Date('2026-02-01') };
      const f2 = { id: crypto.randomUUID(), content: 'Rahul finished frontend', contentHash: 'h2222222222222222222222222222222222222222222222222222222222222222', capturedAt: new Date('2026-02-05') };

      const rels = [
        {
          id: crypto.randomUUID(),
          sourceEntityId: person.id,
          targetEntityId: project.id,
          relationType: 'WORKED_ON',
          status: 'ACTIVE',
          confidence: 0.9,
          evidenceCount: 1,
          sourceFragmentId: f1.id,
          sourceContentHash: f1.contentHash,
          assertedAt: f1.capturedAt,
          validAt: f1.capturedAt,
        },
        {
          id: crypto.randomUUID(),
          sourceEntityId: person.id,
          targetEntityId: project.id,
          relationType: 'WORKED_ON',
          status: 'ACTIVE',
          confidence: 0.9,
          evidenceCount: 1,
          sourceFragmentId: f2.id,
          sourceContentHash: f2.contentHash,
          assertedAt: f2.capturedAt,
          validAt: f2.capturedAt,
        },
      ];

      const context = makeContext({
        entities: [person, project],
        relationships: rels,
        fragments: [f1, f2],
      });

      const findings = await miner.discover(context);
      expect(findings.length).toBe(1);
      const f = findings[0];
      expect(f.findingType).toBe('COLLABORATION_PATTERN');
      expect(f.involvedEntityIds).toContain(person.id);
      expect(f.involvedEntityIds).toContain(project.id);
      expect(f.deterministicMetrics.distinctFragmentCount).toBe(2);
      expect(f.statement).toContain("Observed recurring collaboration relationship");
    });

    it('strictly preserves MENTIONED_WITH boundary (NEVER promotes co-occurrence to collaboration)', async () => {
      const miner = new GraphCoOccurrenceMiner();

      const person = { id: crypto.randomUUID(), canonicalName: 'Alice', entityType: 'Person', status: 'ACTIVE', aliases: [], createdAt: new Date() };
      const project = { id: crypto.randomUUID(), canonicalName: 'Backend Engine', entityType: 'Project', status: 'ACTIVE', aliases: [], createdAt: new Date() };

      const f1 = { id: crypto.randomUUID(), content: 'Alice and Backend Engine mentioned', contentHash: 'h1111111111111111111111111111111111111111111111111111111111111111', capturedAt: new Date('2026-02-01') };

      // Only MENTIONED_WITH relationship
      const rels = [
        {
          id: crypto.randomUUID(),
          sourceEntityId: person.id,
          targetEntityId: project.id,
          relationType: 'MENTIONED_WITH',
          status: 'ACTIVE',
          confidence: 0.5,
          evidenceCount: 1,
          sourceFragmentId: f1.id,
          sourceContentHash: f1.contentHash,
          assertedAt: f1.capturedAt,
          validAt: f1.capturedAt,
        },
      ];

      const context = makeContext({
        entities: [person, project],
        relationships: rels,
        fragments: [f1],
      });

      const findings = await miner.discover(context);
      // Must NOT promote to COLLABORATION_PATTERN
      const collabFindings = findings.filter((f) => f.findingType === 'COLLABORATION_PATTERN');
      expect(collabFindings.length).toBe(0);
    });
  });
});
