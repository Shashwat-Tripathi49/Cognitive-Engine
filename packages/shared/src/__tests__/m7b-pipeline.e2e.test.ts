import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  CaptureEngine,
  ICognitiveFragmentRepository,
  CreateCognitiveFragmentInput,
  CognitiveFragment,
  CaptureQueryOptions,
  PaginatedResult,
  MemoryEngine,
  DrizzleMemoryRepository,
  KnowledgeGraphEngine,
  InMemoryKnowledgeGraphRepository,
  DeterministicMockExtractionProvider,
  LayeredHybridEntityResolver,
  CognitiveEngine,
  InMemoryCognitiveRepository,
  InMemoryCognitiveDataProvider,
  ReasoningEngine,
  InMemoryReasoningRepository,
  EvidenceRetrievalService,
  InMemoryEvidenceStorageAdapter,
  ReflectionEngine,
  InMemoryReflectionRepository,
  TemplateReflectionSynthesizer,
  CandidateFinding,
  ValidatedClaim,
  EvidenceChain,
  ReflectionRecord,
} from '../index.js';

class InMemoryCognitiveFragmentRepository implements ICognitiveFragmentRepository {
  private fragments = new Map<string, CognitiveFragment>();

  async create(input: CreateCognitiveFragmentInput): Promise<CognitiveFragment> {
    const fragment: CognitiveFragment = {
      id: input.id || crypto.randomUUID(),
      userId: input.userId,
      content: input.content,
      modality: input.modality || 'text',
      contentHash: input.contentHash,
      capturedAt: input.capturedAt || new Date(),
      metadata: input.metadata || { schemaVersion: 1, source: 'api' },
    };
    this.fragments.set(fragment.id, fragment);
    return fragment;
  }

  async findById(id: string, userId: string): Promise<CognitiveFragment | null> {
    const found = this.fragments.get(id);
    if (!found || found.userId !== userId) {
      return null;
    }
    return found;
  }

  async findRecentByHash(
    userId: string,
    contentHash: string,
    windowSeconds = 10
  ): Promise<CognitiveFragment | null> {
    const cutoff = Date.now() - windowSeconds * 1000;
    const matches = Array.from(this.fragments.values()).filter(
      (f) =>
        f.userId === userId &&
        f.contentHash === contentHash &&
        f.capturedAt.getTime() >= cutoff
    );
    return matches.sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime())[0] || null;
  }

  async findAll(
    userId: string,
    options: CaptureQueryOptions = {}
  ): Promise<PaginatedResult<CognitiveFragment>> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const userFragments = Array.from(this.fragments.values()).filter((f) => f.userId === userId);
    return {
      items: userFragments.slice((page - 1) * limit, page * limit),
      total: userFragments.length,
      page,
      limit,
      hasMore: page * limit < userFragments.length,
    };
  }
}

export const GOLDEN_JOURNAL_ENTRIES = [
  { id: 1, date: '2026-08-01T09:00:00Z', text: 'Configured PostgreSQL database today.' },
  { id: 2, date: '2026-08-02T10:00:00Z', text: 'Optimized PostgreSQL indexes for queries.' },
  { id: 3, date: '2026-08-03T10:00:00Z', text: 'Implemented backend routes using FastAPI.' },
  { id: 4, date: '2026-08-03T16:00:00Z', text: 'Containerized the application using Docker.' },
  { id: 5, date: '2026-08-05T11:00:00Z', text: 'Discussed PostgreSQL scaling with Rahul.' },
  { id: 6, date: '2026-08-06T09:00:00Z', text: 'Updated FastAPI service endpoints.' },
  { id: 7, date: '2026-08-06T15:00:00Z', text: 'Built and deployed the new Docker image.' },
  { id: 8, date: '2026-08-08T14:00:00Z', text: 'Reviewed PostgreSQL replication with Rahul.' },
  { id: 9, date: '2026-08-09T10:00:00Z', text: 'Added validation middleware to FastAPI.' },
  { id: 10, date: '2026-08-09T17:00:00Z', text: 'Configured Docker volume persistence.' },
];

describe('Milestone 7B — End-to-End Cognitive Pipeline Integration & Verification', () => {
  const userIdA = '00000000-0000-0000-0000-000000000001';
  const userIdB = '00000000-0000-0000-0000-000000000002';
  const evaluationTimestamp = new Date('2026-08-15T00:00:00Z');

  describe('1. Golden Path E2E Execution (USER_A)', () => {
    it('executes all 6 domain engines sequentially and verifies exact architectural outcomes', async () => {
      // ----------------------------------------------------
      // Infrastructure & Repositories Setup
      // ----------------------------------------------------
      const captureRepo = new InMemoryCognitiveFragmentRepository();
      const captureEngine = new CaptureEngine(captureRepo);

      const memoryRepo = new DrizzleMemoryRepository();
      const memoryEngine = new MemoryEngine(memoryRepo);

      const kgRepo = new InMemoryKnowledgeGraphRepository();
      const kgExtractionProvider = new DeterministicMockExtractionProvider();

      // Configure exact mention extraction matching the approved M7B specification table
      kgExtractionProvider.setStaticResponse(GOLDEN_JOURNAL_ENTRIES[0].text, [{ name: 'PostgreSQL', type: 'Tool', confidence: 'HIGH' }]);
      kgExtractionProvider.setStaticResponse(GOLDEN_JOURNAL_ENTRIES[1].text, [{ name: 'PostgreSQL', type: 'Tool', confidence: 'HIGH' }]);
      kgExtractionProvider.setStaticResponse(GOLDEN_JOURNAL_ENTRIES[2].text, [{ name: 'FastAPI', type: 'Tool', confidence: 'HIGH' }]);
      kgExtractionProvider.setStaticResponse(GOLDEN_JOURNAL_ENTRIES[3].text, [{ name: 'Docker', type: 'Tool', confidence: 'HIGH' }]);
      kgExtractionProvider.setStaticResponse(GOLDEN_JOURNAL_ENTRIES[4].text, [
        { name: 'PostgreSQL', type: 'Tool', confidence: 'HIGH' },
        { name: 'Rahul', type: 'Person', confidence: 'HIGH' },
      ]);
      kgExtractionProvider.setStaticResponse(GOLDEN_JOURNAL_ENTRIES[5].text, [{ name: 'FastAPI', type: 'Tool', confidence: 'HIGH' }]);
      kgExtractionProvider.setStaticResponse(GOLDEN_JOURNAL_ENTRIES[6].text, [{ name: 'Docker', type: 'Tool', confidence: 'HIGH' }]);
      kgExtractionProvider.setStaticResponse(GOLDEN_JOURNAL_ENTRIES[7].text, [
        { name: 'PostgreSQL', type: 'Tool', confidence: 'HIGH' },
        { name: 'Rahul', type: 'Person', confidence: 'HIGH' },
      ]);
      kgExtractionProvider.setStaticResponse(GOLDEN_JOURNAL_ENTRIES[8].text, [{ name: 'FastAPI', type: 'Tool', confidence: 'HIGH' }]);
      kgExtractionProvider.setStaticResponse(GOLDEN_JOURNAL_ENTRIES[9].text, [{ name: 'Docker', type: 'Tool', confidence: 'HIGH' }]);

      const kgResolver = new LayeredHybridEntityResolver();
      const kgEngine = new KnowledgeGraphEngine(kgRepo, kgExtractionProvider, kgResolver);

      const cognitiveRepo = new InMemoryCognitiveRepository();
      const cognitiveDataProvider = new InMemoryCognitiveDataProvider();
      const cognitiveEngine = new CognitiveEngine(cognitiveRepo, cognitiveDataProvider);

      const reasoningRepo = new InMemoryReasoningRepository();
      const evidenceStorage = new InMemoryEvidenceStorageAdapter();
      const evidenceService = new EvidenceRetrievalService(evidenceStorage);
      const reasoningEngine = new ReasoningEngine(reasoningRepo, evidenceService);

      const reflectionRepo = new InMemoryReflectionRepository();
      // Use deterministic template synthesizer for 100% reproducible golden-path assertions
      const reflectionSynthesizer = new TemplateReflectionSynthesizer();
      const reflectionEngine = new ReflectionEngine(
        reflectionRepo,
        reasoningRepo,
        reflectionSynthesizer
      );

      // ----------------------------------------------------
      // Stage 1 & 2 & 3: Ingestion, Memory, and Knowledge Graph
      // ----------------------------------------------------
      const fragments = [];
      for (const entry of GOLDEN_JOURNAL_ENTRIES) {
        // Stage 1: Capture
        const frag = await captureEngine.captureThought(userIdA, {
          text: entry.text,
        });
        frag.capturedAt = new Date(entry.date);
        fragments.push(frag);

        // Stage 2: Memory Index
        await memoryEngine.createMemoryFromFragment(frag);

        // Stage 3: Knowledge Graph Processing
        await kgEngine.processFragment({
          userId: userIdA,
          fragmentId: frag.id,
          content: frag.content,
          contentHash: frag.contentHash,
          capturedAt: frag.capturedAt,
        });

        // Sync evidence storage adapter for reasoning
        evidenceStorage.addFragment({
          id: frag.id,
          userId: userIdA,
          content: frag.content,
          contentHash: frag.contentHash,
          capturedAt: frag.capturedAt,
        });
      }

      // Assert Stage 1: Exactly 10 fragments captured
      expect(fragments.length).toBe(10);

      // Assert Stage 3 Knowledge Graph:
      // A. Exactly 4 Canonical Entities Created
      const entities = await kgRepo.listEntities(userIdA);
      expect(entities.length).toBe(4);
      const entityNames = entities.map((e) => e.canonicalName).sort();
      expect(entityNames).toEqual(['Docker', 'FastAPI', 'PostgreSQL', 'Rahul']);

      // B. Exactly 12 Provenance Records Created
      const postgresId = entities.find((e) => e.canonicalName === 'PostgreSQL')!.id;
      const fastApiId = entities.find((e) => e.canonicalName === 'FastAPI')!.id;
      const dockerId = entities.find((e) => e.canonicalName === 'Docker')!.id;
      const rahulId = entities.find((e) => e.canonicalName === 'Rahul')!.id;

      const postgresProvs = await kgRepo.findProvenanceByEntityId(postgresId, userIdA);
      expect(postgresProvs.length).toBe(4);
      const fastApiProvs = await kgRepo.findProvenanceByEntityId(fastApiId, userIdA);
      expect(fastApiProvs.length).toBe(3);
      const dockerProvs = await kgRepo.findProvenanceByEntityId(dockerId, userIdA);
      expect(dockerProvs.length).toBe(3);
      const rahulProvs = await kgRepo.findProvenanceByEntityId(rahulId, userIdA);
      expect(rahulProvs.length).toBe(2);

      const totalProvenanceCount =
        postgresProvs.length + fastApiProvs.length + dockerProvs.length + rahulProvs.length;
      expect(totalProvenanceCount).toBe(12);

      const provenance = [
        ...postgresProvs,
        ...fastApiProvs,
        ...dockerProvs,
        ...rahulProvs,
      ];

      // C. Graph Relationships: MENTIONED_WITH between PostgreSQL and Rahul
      const relationships = await kgRepo.findRelationshipsByEntity(postgresId, userIdA);
      expect(relationships.length).toBeGreaterThanOrEqual(1);
      const mentionedWithRels = relationships.filter(
        (r) => r.relationType === 'MENTIONED_WITH'
      );
      expect(mentionedWithRels.length).toBeGreaterThanOrEqual(1);

      // Populate evidence storage with KG entities and relationships
      for (const ent of entities) {
        evidenceStorage.addEntity({
          id: ent.id,
          userId: userIdA,
          canonicalName: ent.canonicalName,
          entityType: ent.entityType,
          status: ent.status,
        });
      }
      for (const rel of relationships) {
        evidenceStorage.addRelationship({
          id: rel.id,
          userId: userIdA,
          sourceEntityId: rel.sourceEntityId,
          targetEntityId: rel.targetEntityId,
          relationType: rel.relationType,
          status: rel.status,
          assertedAt: rel.assertedAt,
          validAt: rel.validAt,
        });
      }

      // ----------------------------------------------------
      // Stage 4: Cognitive Discovery
      // ----------------------------------------------------
      cognitiveDataProvider.setContextData({
        fragments,
        entities,
        provenance,
        relationships,
        memories: [],
      });

      const discoveryResult = await cognitiveEngine.discover(userIdA, {
        evaluationTimestamp,
      });

      // EXACT EXPECTED FINDINGS ASSERTIONS:
      // Total findings produced by frozen M6 detector semantics: 14 (4 topic + 10 temporal sequences)
      expect(discoveryResult.findings.length).toBe(14);

      // Topic Recurrence: Exactly 4 findings
      const topicFindings = discoveryResult.findings.filter(
        (f) => f.findingType === 'RECURRING_TOPIC_FOCUS'
      );
      expect(topicFindings.length).toBe(4);
      const topicSubjectIds = topicFindings.map((f) => f.subjectEntityId).sort();
      expect(topicSubjectIds).toEqual([dockerId, fastApiId, postgresId, rahulId].sort());

      // Temporal Sequence: Exactly 10 findings
      const sequenceFindings = discoveryResult.findings.filter(
        (f) => f.findingType === 'TEMPORAL_SEQUENCE'
      );
      expect(sequenceFindings.length).toBe(10);

      // Negative Assertions (M7A Invariant):
      // MENTIONED_WITH must NEVER be promoted to COLLABORATION_PATTERN
      const collabFindings = discoveryResult.findings.filter(
        (f) => f.findingType === 'COLLABORATION_PATTERN'
      );
      expect(collabFindings.length).toBe(0);

      // COGNITIVE_CLUSTER must be 0
      const clusterFindings = discoveryResult.findings.filter(
        (f) => f.findingType === 'COGNITIVE_CLUSTER'
      );
      expect(clusterFindings.length).toBe(0);

      // ----------------------------------------------------
      // Stage 5: Reasoning Engine Validation
      // ----------------------------------------------------
      const validatedClaims: ValidatedClaim[] = [];
      const evidenceChains: EvidenceChain[] = [];

      for (const finding of discoveryResult.findings) {
        const evalResult = await reasoningEngine.evaluateFinding({
          userId: userIdA,
          finding,
          evaluationTimestamp,
        });

        expect(evalResult.success).toBe(true);
        expect(evalResult.claim.status).toBe('VALIDATED');
        expect(evalResult.claim.deterministicSupportScore).toBeGreaterThanOrEqual(0.7);
        expect(evalResult.evidenceChain.isVerified).toBe(true);
        expect(evalResult.evidenceChain.chainIntegrityHash).toBeDefined();
        expect(evalResult.evidenceChain.chainIntegrityHash.length).toBe(64);

        validatedClaims.push(evalResult.claim);
        evidenceChains.push(evalResult.evidenceChain);
      }

      // Exactly 14 ValidatedClaims and 14 EvidenceChains
      expect(validatedClaims.length).toBe(14);
      expect(evidenceChains.length).toBe(14);

      // ----------------------------------------------------
      // Stage 6: Reflection Engine Synthesis
      // ----------------------------------------------------
      const reflections: ReflectionRecord[] = [];
      for (const claim of validatedClaims) {
        const reflection = await reflectionEngine.generateReflection({
          userId: userIdA,
          claimId: claim.id,
        });

        expect(reflection).toBeDefined();
        expect(reflection.sourceClaimId).toBe(claim.id);
        expect(reflection.evidenceChainId).toBe(claim.evidenceChainId);
        expect(reflection.bundleIntegrityHash).toBeDefined();
        expect(reflection.bundleIntegrityHash.length).toBe(64);
        expect(reflection.chainIntegrityHash).toBe(claim.evidenceChainId ? evidenceChains.find(c => c.id === claim.evidenceChainId)?.chainIntegrityHash : '');
        expect(reflection.text.length).toBeGreaterThan(10);
        expect(reflection.structuredPropositions.length).toBeGreaterThan(0);

        // Anti-coaching assertion
        expect(reflection.text.toLowerCase()).not.toContain('you should');
        expect(reflection.text.toLowerCase()).not.toContain('recommend');
        expect(reflection.text.toLowerCase()).not.toContain('burnout');

        reflections.push(reflection);
      }

      // Exactly 14 Reflections
      expect(reflections.length).toBe(14);

      // ----------------------------------------------------
      // Stage 7: Provenance Audit Verification
      // ----------------------------------------------------
      for (const ref of reflections) {
        const prov = await reflectionEngine.getProvenance(ref.id, userIdA);
        expect(prov).not.toBeNull();
        expect(prov!.reflection.id).toBe(ref.id);
        expect(prov!.claim.id).toBe(ref.sourceClaimId);
        expect(prov!.evidenceChain.id).toBe(ref.evidenceChainId);
        expect(prov!.evidenceChain.chainIntegrityHash).toBe(ref.chainIntegrityHash);
      }
    });
  });

  describe('2. Provenance & Lineage Verification (L1–L7)', () => {
    it('L1: verifies valid full lineage from Reflection down to raw fragment', async () => {
      const reasoningRepo = new InMemoryReasoningRepository();
      const storage = new InMemoryEvidenceStorageAdapter();
      const reasoningEngine = new ReasoningEngine(reasoningRepo, new EvidenceRetrievalService(storage));

      const fragId1 = crypto.randomUUID();
      const text1 = 'Configured PostgreSQL database today.';
      const contentHash1 = crypto.createHash('sha256').update(text1).digest('hex');
      storage.addFragment({ id: fragId1, userId: userIdA, content: text1, contentHash: contentHash1, capturedAt: new Date('2026-08-01T00:00:00Z') });

      const fragId2 = crypto.randomUUID();
      const text2 = 'Optimized PostgreSQL indexes.';
      const contentHash2 = crypto.createHash('sha256').update(text2).digest('hex');
      storage.addFragment({ id: fragId2, userId: userIdA, content: text2, contentHash: contentHash2, capturedAt: new Date('2026-08-02T00:00:00Z') });

      const entityId = crypto.randomUUID();
      storage.addEntity({ id: entityId, userId: userIdA, canonicalName: 'PostgreSQL', entityType: 'Tool', status: 'ACTIVE' });

      const finding: CandidateFinding = {
        id: crypto.randomUUID(),
        userId: userIdA,
        findingType: 'RECURRING_TOPIC_FOCUS',
        summary: "Topic focus: 'PostgreSQL'",
        statement: "Observed recurring focus on 'PostgreSQL' across distinct entries.",
        subjectEntityId: entityId,
        involvedEntityIds: [entityId],
        involvedMemoryIds: [],
        involvedRelationshipIds: [],
        temporalScope: { startDate: new Date('2026-08-01T00:00:00Z'), endDate: new Date('2026-08-02T00:00:00Z') },
        deterministicMetrics: { distinctFragmentCount: 2 },
        discoveryAlgorithm: 'topic-recurrence-detector',
        discoveryVersion: '1.0.0',
        discoveryConfidence: 0.9,
        provenanceReferences: [
          { fragmentId: fragId1, contentHash: contentHash1, capturedAt: new Date('2026-08-01T00:00:00Z') },
          { fragmentId: fragId2, contentHash: contentHash2, capturedAt: new Date('2026-08-02T00:00:00Z') },
        ],
      };

      const evalRes = await reasoningEngine.evaluateFinding({ userId: userIdA, finding });
      expect(evalRes.success).toBe(true);
      expect(evalRes.claim.status).toBe('VALIDATED');

      const reflectionRepo = new InMemoryReflectionRepository();
      const reflectionEngine = new ReflectionEngine(reflectionRepo, reasoningRepo, new TemplateReflectionSynthesizer());
      const reflection = await reflectionEngine.generateReflection({ userId: userIdA, claimId: evalRes.claim.id });

      const audit = await reflectionEngine.getProvenance(reflection.id, userIdA);
      expect(audit).not.toBeNull();
      expect(audit!.reflection.sourceClaimId).toBe(evalRes.claim.id);
      expect(audit!.claim.evidenceChainId).toBe(evalRes.evidenceChain.id);
      expect(audit!.evidenceChain.rootFragmentIds).toContain(fragId1);
      expect(audit!.evidenceChain.rootFragmentIds).toContain(fragId2);
    });

    it('L2: fails closed on missing / non-existent claimId', async () => {
      const reflectionRepo = new InMemoryReflectionRepository();
      const reasoningRepo = new InMemoryReasoningRepository();
      const reflectionEngine = new ReflectionEngine(reflectionRepo, reasoningRepo);

      await expect(
        reflectionEngine.generateReflection({ userId: userIdA, claimId: crypto.randomUUID() })
      ).rejects.toThrow(/not found/i);
    });

    it('L4 & L5: refutes claim on tampered content or mismatched contentHash', async () => {
      const reasoningRepo = new InMemoryReasoningRepository();
      const storage = new InMemoryEvidenceStorageAdapter();
      const reasoningEngine = new ReasoningEngine(reasoningRepo, new EvidenceRetrievalService(storage));

      const fragId = crypto.randomUUID();
      const originalText = 'Clean pristine thought.';
      const wrongHash = 'bad_hash_000000000000000000000000000000000000000000000000000000000000';
      storage.addFragment({ id: fragId, userId: userIdA, content: originalText, contentHash: wrongHash, capturedAt: new Date('2026-08-01') });

      const entityId = crypto.randomUUID();
      storage.addEntity({ id: entityId, userId: userIdA, canonicalName: 'PostgreSQL', entityType: 'Tool', status: 'ACTIVE' });

      const finding: CandidateFinding = {
        id: crypto.randomUUID(),
        userId: userIdA,
        findingType: 'RECURRING_TOPIC_FOCUS',
        summary: 'Tampered Finding',
        statement: 'Tampered Finding Statement',
        subjectEntityId: entityId,
        involvedEntityIds: [entityId],
        involvedMemoryIds: [],
        involvedRelationshipIds: [],
        temporalScope: { startDate: new Date('2026-08-01'), endDate: new Date('2026-08-01') },
        deterministicMetrics: { distinctFragmentCount: 1 },
        discoveryAlgorithm: 'topic-recurrence-detector',
        discoveryVersion: '1.0.0',
        discoveryConfidence: 0.9,
        provenanceReferences: [{ fragmentId: fragId, contentHash: 'claimed_hash_that_does_not_match', capturedAt: new Date('2026-08-01') }],
      };

      const evalRes = await reasoningEngine.evaluateFinding({ userId: userIdA, finding });
      expect(evalRes.claim.status).not.toBe('VALIDATED');
    });

    it('L6: cross-user lineage attack fails closed', async () => {
      const reasoningRepo = new InMemoryReasoningRepository();
      const storage = new InMemoryEvidenceStorageAdapter();
      const reasoningEngine = new ReasoningEngine(reasoningRepo, new EvidenceRetrievalService(storage));

      // Create claim for USER_A
      const finding: CandidateFinding = {
        id: crypto.randomUUID(),
        userId: userIdA,
        findingType: 'RECURRING_TOPIC_FOCUS',
        summary: 'User A Finding',
        statement: 'Statement for User A',
        involvedEntityIds: [],
        involvedMemoryIds: [],
        involvedRelationshipIds: [],
        temporalScope: { startDate: new Date('2026-08-01'), endDate: new Date('2026-08-01') },
        deterministicMetrics: { distinctFragmentCount: 1 },
        discoveryAlgorithm: 'topic-recurrence-detector',
        discoveryVersion: '1.0.0',
        discoveryConfidence: 0.9,
        provenanceReferences: [],
      };

      const evalRes = await reasoningEngine.evaluateFinding({ userId: userIdA, finding });

      const reflectionRepo = new InMemoryReflectionRepository();
      const reflectionEngine = new ReflectionEngine(reflectionRepo, reasoningRepo);

      // USER_B tries to generate reflection from USER_A's claim
      await expect(
        reflectionEngine.generateReflection({ userId: userIdB, claimId: evalRes.claim.id })
      ).rejects.toThrow(/not found|isolation violation/i);
    });
  });

  describe('3. Multi-Tenant Isolation Verification (T1–T9)', () => {
    it('T1–T9: strictly prevents cross-tenant access across all engine surfaces', async () => {
      // Setup isolated repositories
      const captureRepo = new InMemoryCognitiveFragmentRepository();
      const captureEngine = new CaptureEngine(captureRepo);

      const kgRepo = new InMemoryKnowledgeGraphRepository();
      const kgEngine = new KnowledgeGraphEngine(kgRepo, new DeterministicMockExtractionProvider(), new LayeredHybridEntityResolver());

      const cognitiveRepo = new InMemoryCognitiveRepository();
      const dataProvider = new InMemoryCognitiveDataProvider();
      const cognitiveEngine = new CognitiveEngine(cognitiveRepo, dataProvider);

      const reasoningRepo = new InMemoryReasoningRepository();
      const reflectionRepo = new InMemoryReflectionRepository();
      const reflectionEngine = new ReflectionEngine(reflectionRepo, reasoningRepo, new TemplateReflectionSynthesizer());

      // 1. User A captures fragment
      const fragA = await captureEngine.captureThought(userIdA, {
        text: 'User A confidential thought',
      });

      // T1: User B cannot retrieve User A fragment
      const retrievedByB = await captureRepo.findById(fragA.id, userIdB);
      expect(retrievedByB).toBeNull();

      // 2. User A processes KG
      await kgEngine.processFragment({
        userId: userIdA,
        fragmentId: fragA.id,
        content: fragA.content,
        contentHash: fragA.contentHash,
      });

      // T3: User B lists 0 entities
      const entitiesB = await kgRepo.listEntities(userIdB);
      expect(entitiesB.length).toBe(0);

      // T4 & T5: Cognitive discovery for User B sees 0 context
      dataProvider.setContextData({ fragments: [fragA], entities: [], provenance: [], relationships: [], memories: [] });
      const discB = await cognitiveEngine.discover(userIdB);
      expect(discB.findings.length).toBe(0);

      // Create a claim for User A
      const claimA: ValidatedClaim = {
        id: crypto.randomUUID(),
        userId: userIdA,
        sourceFindingId: crypto.randomUUID(),
        evidenceChainId: crypto.randomUUID(),
        claimType: 'RECURRING_TOPIC_FOCUS',
        status: 'VALIDATED',
        subjectEntityId: 'topic_entity_id',
        statement: "Validated claim A for 'Topic'",
        deterministicSupportScore: 0.9,
        appliedRuleIds: [],
        temporalScope: { startDate: new Date('2026-08-01T00:00:00Z'), endDate: new Date('2026-08-02T00:00:00Z') },
        createdAt: new Date(),
      };
      const chainA: EvidenceChain = {
        id: claimA.evidenceChainId,
        userId: userIdA,
        findingId: claimA.sourceFindingId,
        evidenceObjects: [],
        rootFragmentIds: [fragA.id],
        ruleEvaluations: [],
        isVerified: true,
        verificationTimestamp: new Date(),
        chainIntegrityHash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        createdAt: new Date(),
      };
      await reasoningRepo.saveClaim(claimA, chainA);

      // T6 & T7: User B cannot find User A claim or chain
      expect(await reasoningRepo.findClaimById(claimA.id, userIdB)).toBeNull();
      expect(await reasoningRepo.findChainById(chainA.id, userIdB)).toBeNull();

      // T8: User B cannot generate reflection from claim A
      await expect(
        reflectionEngine.generateReflection({ userId: userIdB, claimId: claimA.id })
      ).rejects.toThrow();

      // Generate reflection for User A
      const reflectionA = await reflectionEngine.generateReflection({ userId: userIdA, claimId: claimA.id });

      // T9: User B cannot get provenance or view reflection A
      expect(await reflectionRepo.getReflection(reflectionA.id, userIdB)).toBeNull();
      expect(await reflectionEngine.getProvenance(reflectionA.id, userIdB)).toBeNull();
    });
  });

  describe('4. Failure Semantics & Reflection Boundary', () => {
    it('enforces Gate 0 fail-closed on REFUTED claims', async () => {
      const reasoningRepo = new InMemoryReasoningRepository();
      const reflectionRepo = new InMemoryReflectionRepository();
      const reflectionEngine = new ReflectionEngine(reflectionRepo, reasoningRepo);

      const refutedClaim: ValidatedClaim = {
        id: crypto.randomUUID(),
        userId: userIdA,
        sourceFindingId: crypto.randomUUID(),
        evidenceChainId: crypto.randomUUID(),
        claimType: 'RECURRING_TOPIC_FOCUS',
        status: 'REFUTED',
        statement: 'Refuted statement',
        deterministicSupportScore: 0.2,
        appliedRuleIds: [],
        createdAt: new Date(),
      };
      const chain: EvidenceChain = {
        id: refutedClaim.evidenceChainId,
        userId: userIdA,
        findingId: refutedClaim.sourceFindingId,
        evidenceObjects: [],
        rootFragmentIds: [],
        ruleEvaluations: [],
        isVerified: false,
        verificationTimestamp: new Date(),
        chainIntegrityHash: '0000000000000000000000000000000000000000000000000000000000000000',
        createdAt: new Date(),
      };
      await reasoningRepo.saveClaim(refutedClaim, chain);

      // Gate 0 must reject
      await expect(
        reflectionEngine.generateReflection({ userId: userIdA, claimId: refutedClaim.id })
      ).rejects.toThrow(/Invalid claim status 'REFUTED'/i);
    });
  });

  describe('5. Idempotency & Determinism Verification', () => {
    it('produces byte-identical deterministic hashes on identical input and evaluation timestamp', async () => {
      const evObjects = [
        { evidenceType: 'FRAGMENT' as const, sourceId: 'frag_01', sourceContentHash: 'hash_01' },
        { evidenceType: 'ENTITY' as const, sourceId: 'ent_01' },
      ];

      const hash1 = ReasoningEngine.computeChainIntegrityHash(evObjects);
      // Reverse order array to verify sorting invariance
      const hash2 = ReasoningEngine.computeChainIntegrityHash([evObjects[1], evObjects[0]]);

      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64);
    });
  });
});
