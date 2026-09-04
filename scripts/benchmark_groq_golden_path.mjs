import {
  CognitiveEngine,
  InMemoryCognitiveDataProvider,
  InMemoryCognitiveRepository,
  ReasoningEngine,
  InMemoryReasoningRepository,
  EvidenceRetrievalService,
  InMemoryEvidenceStorageAdapter,
  ReflectionEngine,
  InMemoryReflectionRepository,
  OpenRouterReflectionSynthesizer,
  GroqReflectionSynthesizer,
} from '../packages/shared/dist/index.js';

// 30 Raw Journal Entries
const JOURNAL_ENTRIES = [
  { id: 1, date: '2026-08-01T09:30:00Z', text: "Worked on the backend for a couple of hours today. Rahul helped me figure out why the API wasn't responding properly. Still feels like there's a lot I don't understand." },
  { id: 2, date: '2026-08-01T14:00:00Z', text: 'Had a pretty unproductive morning. Kept switching between the backend and random YouTube videos. Need to get more disciplined about this.' },
  { id: 3, date: '2026-08-02T10:15:00Z', text: "Talked to R about the authentication issue. He thinks the middleware is probably where I'm messing something up. Going to look at that tomorrow." },
  { id: 4, date: '2026-08-02T16:45:00Z', text: 'Finally understood a bit of the auth flow today. The middleware thing makes much more sense now. Still need to clean up the API though.' },
  { id: 5, date: '2026-08-03T11:00:00Z', text: 'Spent most of today working on the Cognitive Engine. The basic capture part is actually working surprisingly well. Need to figure out what comes after memory.' },
  { id: 6, date: '2026-08-03T17:30:00Z', text: 'Rahul asked how the Cognitive Engine is coming along. Told him the memory search works but the actual intelligence part is still pretty basic.' },
  { id: 7, date: '2026-08-04T12:00:00Z', text: "Didn't really work today. Was supposed to work on the engine but ended up going out with friends in the evening. Feeling a little guilty about wasting the day." },
  { id: 8, date: '2026-08-05T09:00:00Z', text: 'Started reading about knowledge graphs. At first it sounded unnecessarily complicated, but I think it might actually make sense for the project.' },
  { id: 9, date: '2026-08-05T15:20:00Z', text: 'R sent me a paper about entity resolution. Haven\'t read it properly yet but the idea of connecting different names to the same thing seems important.' },
  { id: 10, date: '2026-08-06T10:00:00Z', text: 'Spent the morning setting up a simple graph structure. Nodes for entities, edges for relationships. It feels right conceptually.' },
  { id: 11, date: '2026-08-06T16:00:00Z', text: 'Had another discussion with Rahul about the project. We went through the backend architecture again. He suggested breaking things into smaller modules.' },
  { id: 12, date: '2026-08-07T09:30:00Z', text: 'Tried implementing the modular approach Rahul suggested. It\'s cleaner, but now I have to rewire a bunch of imports.' },
  { id: 13, date: '2026-08-07T14:45:00Z', text: 'Spent the afternoon fixing the API routes. Most things are working again now. Still need to write proper tests.' },
  { id: 14, date: '2026-08-08T11:15:00Z', text: 'The backend is finally feeling less messy. Wrote a few unit tests for the entity extraction pipeline. They pass, but edge cases definitely exist.' },
  { id: 15, date: '2026-08-08T18:00:00Z', text: 'Took the evening off. Watched a movie. Brain needed a reset.' },
  { id: 16, date: '2026-08-09T10:30:00Z', text: 'Sunday morning reflection. Wondering if I\'m overengineering this. Maybe a simple vector search is enough and the graph is overkill?' },
  { id: 17, date: '2026-08-09T15:00:00Z', text: 'R called to check in. Talked through the graph vs vector thing. He made a good point: vectors give similarity, graphs give structure. You need both.' },
  { id: 18, date: '2026-08-10T09:00:00Z', text: 'Monday motivation is decent today. Planning to implement the hybrid search combining graph edges and embeddings.' },
  { id: 19, date: '2026-08-10T15:30:00Z', text: 'Worked on the API again. Added an endpoint for querying entity connections. Seems fast enough on local data.' },
  { id: 20, date: '2026-08-11T10:00:00Z', text: 'Dealing with annoying TypeScript errors all morning. Type inference is great until it completely breaks down on nested graph types.' },
  { id: 21, date: '2026-08-11T16:15:00Z', text: 'Spoke to Rahul about the backend type definitions. He showed me a utility type pattern that solved the nested issue in 10 minutes.' },
  { id: 22, date: '2026-08-12T11:00:00Z', text: 'Got the entity resolution working on sample data. Merged a few duplicate entities successfully. Felt pretty satisfying.' },
  { id: 23, date: '2026-08-12T17:00:00Z', text: 'Read through some old journal entries to see how realistic my test data is. Real journal text is much messier than I assumed.' },
  { id: 24, date: '2026-08-13T09:45:00Z', text: 'Started writing the cognitive discovery layer. Looking for recurring patterns in the graph. The logic is tricky to get right without false positives.' },
  { id: 25, date: '2026-08-13T16:00:00Z', text: 'Still tuning the pattern discovery. It\'s finding too many trivial patterns. Need stricter thresholds.' },
  { id: 26, date: '2026-08-14T10:30:00Z', text: 'Friday. Cleaned up the codebase. Removed dead imports, formatted everything, updated the README. Good housekeeping day.' },
  { id: 27, date: '2026-08-14T15:00:00Z', text: 'Quick sync with R. Showed him the pattern discovery output. He thought the recurrence detection was cool but wanted to see real reasoning on top.' },
  { id: 28, date: '2026-08-15T12:00:00Z', text: 'Independence Day holiday. Spent an hour fixing a minor bug in the entity resolver, then took the rest of the day off.' },
  { id: 29, date: '2026-08-16T10:00:00Z', text: 'Looking back over the last few weeks, the project has come a long way. The capture-memory-graph-reasoning pipeline actually works together now.' },
  { id: 30, date: '2026-08-16T17:00:00Z', text: 'Finalizing the test suite for the reasoning engine. All tests green. Ready to move on to reflection.' },
];

async function main() {
  const userId = '00000000-0000-0000-0000-000000000001';
  const evalTimestamp = new Date('2026-08-20T12:00:00Z');

  const backendEntityId = '20000000-0000-0000-0000-000000000001';
  const apiEntityId = '20000000-0000-0000-0000-000000000002';
  const rahulEntityId = '20000000-0000-0000-0000-000000000003';

  const entities = [
    { id: backendEntityId, canonicalName: 'backend', entityType: 'Topic', status: 'ACTIVE', aliases: [], createdAt: new Date('2026-08-01') },
    { id: apiEntityId, canonicalName: 'API', entityType: 'Topic', status: 'ACTIVE', aliases: [], createdAt: new Date('2026-08-01') },
    { id: rahulEntityId, canonicalName: 'Rahul', entityType: 'Person', status: 'ACTIVE', aliases: [], createdAt: new Date('2026-08-01') },
  ];

  const fragments = [];
  const provenance = [];
  const reasoningStorage = new InMemoryEvidenceStorageAdapter();

  for (const entry of JOURNAL_ENTRIES) {
    const fragId = `00000000-0000-0000-0000-${entry.id.toString().padStart(12, '0')}`;
    const capturedAt = new Date(entry.date);
    const text = entry.text;
    const contentHash = 'hash_' + entry.id.toString().padStart(59, '0');

    fragments.push({
      id: fragId,
      content: text,
      contentHash,
      capturedAt,
      memoryId: `mem_${entry.id}`,
    });

    reasoningStorage.addFragment({
      id: fragId,
      userId,
      contentHash,
      capturedAt,
      content: text,
    });

    if (text.toLowerCase().includes('backend')) {
      provenance.push({
        id: `prov_backend_${entry.id}`,
        canonicalId: backendEntityId,
        sourceFragmentId: fragId,
        sourceContentHash: contentHash,
        sourceMention: 'backend',
        confidence: 0.95,
        resolvedAt: capturedAt,
      });
    }

    if (text.toLowerCase().includes('api')) {
      provenance.push({
        id: `prov_api_${entry.id}`,
        canonicalId: apiEntityId,
        sourceFragmentId: fragId,
        sourceContentHash: contentHash,
        sourceMention: 'API',
        confidence: 0.95,
        resolvedAt: capturedAt,
      });
    }

    if (text.toLowerCase().includes('rahul')) {
      provenance.push({
        id: `prov_rahul_${entry.id}`,
        canonicalId: rahulEntityId,
        sourceFragmentId: fragId,
        sourceContentHash: contentHash,
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

  // 1. Cognitive Discovery
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

  const discoveryResult = await cognitiveEngine.discover(userId, {
    evaluationTimestamp: evalTimestamp,
  });

  console.log(`Discovered ${discoveryResult.findings.length} findings from 30 journal entries.`);

  // 2. Reasoning Evaluation
  const reasoningRepo = new InMemoryReasoningRepository();
  const reasoningEngine = new ReasoningEngine(
    reasoningRepo,
    new EvidenceRetrievalService(reasoningStorage)
  );

  const validatedClaims = [];
  for (const finding of discoveryResult.findings) {
    const evalRes = await reasoningEngine.evaluateFinding({
      userId,
      finding,
      evaluationTimestamp: evalTimestamp,
    });
    if (evalRes.success && evalRes.claim.status === 'VALIDATED') {
      validatedClaims.push(evalRes.claim);
    }
  }

  console.log(`Reasoning Engine validated ${validatedClaims.length} claims.`);

  // 3. Real Reflection Generation (OpenRouter or Groq)
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Neither OPENROUTER_API_KEY nor GROQ_API_KEY found in process.env");
  }

  const isOR = Boolean(process.env.OPENROUTER_API_KEY);
  const providerName = isOR ? 'OpenRouter' : 'Groq';
  const modelName = isOR ? 'meta-llama/llama-3.3-70b-instruct' : 'openai/gpt-oss-120b';

  const realSynthesizer = isOR
    ? new OpenRouterReflectionSynthesizer(apiKey, modelName, 0.0)
    : new GroqReflectionSynthesizer(apiKey, modelName, 0.0);

  const reflectionRepo = new InMemoryReflectionRepository();
  const reflectionEngine = new ReflectionEngine(
    reflectionRepo,
    reasoningRepo,
    realSynthesizer
  );

  console.log(`\nStarting Reflection synthesis against real ${providerName} (${modelName})...`);

  const results = [];
  for (const claim of validatedClaims) {
    console.log(`\nEvaluating claim: "${claim.statement}" (Type: ${claim.claimType})`);
    const reflection = await reflectionEngine.generateReflection({
      userId,
      claimId: claim.id,
    });

    results.push({
      claimId: claim.id,
      statement: claim.statement,
      synthesisMethod: reflection.synthesisMethod,
      attempts: reflection.validationDetails?.attempts || 1,
      text: reflection.text,
      error: reflection.validationDetails?.error,
    });

    console.log(`Outcome: ${reflection.synthesisMethod} (Attempts: ${reflection.validationDetails?.attempts || 1})`);
    console.log(`Reflection text: "${reflection.text}"`);
    if (reflection.validationDetails?.error) {
      console.log(`Rejection reason: ${reflection.validationDetails.error}`);
    }
  }

  console.log('\n========================================');
  console.log(`REAL-MODEL BENCHMARK SUMMARY (${modelName})`);
  console.log('========================================');
  const constrainedCount = results.filter(r => r.synthesisMethod === 'LLM_CONSTRAINED').length;
  const fallbackCount = results.filter(r => r.synthesisMethod === 'DETERMINISTIC_FALLBACK').length;
  console.log(`Total claims evaluated: ${results.length}`);
  console.log(`LLM_CONSTRAINED: ${constrainedCount} (${((constrainedCount / results.length) * 100).toFixed(1)}%)`);
  console.log(`DETERMINISTIC_FALLBACK: ${fallbackCount} (${((fallbackCount / results.length) * 100).toFixed(1)}%)`);
  console.log('Detailed breakdown:\n', JSON.stringify(results, null, 2));
}

main().catch(err => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
