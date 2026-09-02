import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  KnowledgeGraphEngine,
  InMemoryKnowledgeGraphRepository,
  DeterministicMockExtractionProvider,
  LayeredHybridEntityResolver,
  MiniLMEmbeddingProvider,
  CanonicalEntity,
  GraphRelationship,
  EntityResolutionProvenance,
  CandidateConfirmationItem,
} from '@cognitive-engine/shared';

// 30 Raw Journal Entries provided by user
const JOURNAL_ENTRIES: { id: number; date: string; text: string }[] = [
  {
    id: 1,
    date: '2026-08-01T09:30:00Z',
    text: "Worked on the backend for a couple of hours today. Rahul helped me figure out why the API wasn't responding properly. Still feels like there's a lot I don't understand.",
  },
  {
    id: 2,
    date: '2026-08-01T14:00:00Z',
    text: 'Had a pretty unproductive morning. Kept switching between the backend and random YouTube videos. Need to get more disciplined about this.',
  },
  {
    id: 3,
    date: '2026-08-02T10:15:00Z',
    text: "Talked to R about the authentication issue. He thinks the middleware is probably where I'm messing something up. Going to look at that tomorrow.",
  },
  {
    id: 4,
    date: '2026-08-02T16:45:00Z',
    text: 'Finally understood a bit of the auth flow today. The middleware thing makes much more sense now. Still need to clean up the API though.',
  },
  {
    id: 5,
    date: '2026-08-03T11:00:00Z',
    text: 'Spent most of today working on the Cognitive Engine. The basic capture part is actually working surprisingly well. Need to figure out what comes after memory.',
  },
  {
    id: 6,
    date: '2026-08-03T17:30:00Z',
    text: 'Rahul asked how the Cognitive Engine is coming along. Told him the memory search works but the actual intelligence part is still pretty basic.',
  },
  {
    id: 7,
    date: '2026-08-04T12:00:00Z',
    text: "Didn't really work today. Was supposed to work on the engine but ended up going out with friends in the evening. Feeling a little guilty about wasting the day.",
  },
  {
    id: 8,
    date: '2026-08-05T09:00:00Z',
    text: 'Started reading about knowledge graphs. At first it sounded unnecessarily complicated, but I think it might actually make sense for the project.',
  },
  {
    id: 9,
    date: '2026-08-05T15:20:00Z',
    text: 'R sent me a paper about entity resolution. Haven\'t read it properly yet but the idea of connecting different names to the same thing seems important.',
  },
  {
    id: 10,
    date: '2026-08-06T10:00:00Z',
    text: "Worked on entity extraction today. The annoying part is that the model sometimes identifies things that aren't actually entities. Need some kind of strict filter.",
  },
  {
    id: 11,
    date: '2026-08-06T16:00:00Z',
    text: 'Had another discussion with Rahul about the project. We went through the backend architecture and he pointed out that I was trying to build too much at once.',
  },
  {
    id: 12,
    date: '2026-08-07T09:30:00Z',
    text: 'I think he\'s right. I should probably finish one complete pipeline instead of constantly adding new features.',
  },
  {
    id: 13,
    date: '2026-08-07T14:45:00Z',
    text: 'Spent the afternoon fixing the API routes. Nothing major, just a bunch of stupid little issues that somehow took forever.',
  },
  {
    id: 14,
    date: '2026-08-08T11:15:00Z',
    text: 'The backend is finally feeling less messy. Still not happy with the way some of the database stuff is organized though.',
  },
  {
    id: 15,
    date: '2026-08-08T17:00:00Z',
    text: "Started working on the knowledge graph properly today. Entities, aliases, relationships, provenance... there's a lot going on.",
  },
  {
    id: 16,
    date: '2026-08-09T10:30:00Z',
    text: 'Got confused between the project name and the actual topic today. Need to be careful about how these things are classified.',
  },
  {
    id: 17,
    date: '2026-08-09T16:00:00Z',
    text: "Rahul mentioned that the resolver shouldn't confidently match two things just because their names look similar. That probably explains some of the weird results I was seeing.",
  },
  {
    id: 18,
    date: '2026-08-10T11:00:00Z',
    text: 'Tried the resolver again with a few variations of the same name. Much better this time. The alias thing seems pretty useful.',
  },
  {
    id: 19,
    date: '2026-08-10T15:30:00Z',
    text: 'Worked on the API again. I keep saying I\'m going to stop touching it and move on, and then I find one more thing that needs fixing.',
  },
  {
    id: 20,
    date: '2026-08-11T09:45:00Z',
    text: 'Had a decent day today. Got the capture to memory to graph flow working end to end. It\'s not perfect, but at least there\'s finally a proper pipeline.',
  },
  {
    id: 21,
    date: '2026-08-11T16:15:00Z',
    text: 'Didn\'t mention Rahul by name today but spoke to him about the backend. He suggested keeping the first version simple and testing it with real journal entries.',
  },
  {
    id: 22,
    date: '2026-08-12T10:00:00Z',
    text: 'I\'m going to do that. Instead of inventing more test cases, I want to see what happens when the system processes actual messy writing.',
  },
  {
    id: 23,
    date: '2026-08-12T14:30:00Z',
    text: 'Tested a few entries and noticed that some things are getting created twice. Need to check whether the resolver is failing or whether extraction itself is the problem.',
  },
  {
    id: 24,
    date: '2026-08-13T11:00:00Z',
    text: 'The duplicate problem seems to happen mostly when I describe the same thing differently. This is probably exactly what the alias system is supposed to help with.',
  },
  {
    id: 25,
    date: '2026-08-13T17:00:00Z',
    text: 'Took a break from coding and went for a walk. Came back with a much clearer idea of how the graph should work. Sometimes stepping away actually helps.',
  },
  {
    id: 26,
    date: '2026-08-14T10:30:00Z',
    text: 'Worked on the entity resolver again. I don\'t want it making aggressive guesses. If it\'s genuinely unsure, I\'d rather have it say ambiguous than silently create the wrong connection.',
  },
  {
    id: 27,
    date: '2026-08-14T16:00:00Z',
    text: 'The graph is starting to look useful. I can see the project, the people involved, the technical topics, and some of the things I\'ve been working on repeatedly.',
  },
  {
    id: 28,
    date: '2026-08-15T11:30:00Z',
    text: 'One thing I\'m still worried about is all these mentioned-with relationships. Just because two things appear in the same journal entry doesn\'t necessarily mean they\'re actually related.',
  },
  {
    id: 29,
    date: '2026-08-15T17:00:00Z',
    text: 'I think the next real challenge is figuring out what the system can actually conclude from the graph without making things up. That\'s probably where the reasoning part comes in.',
  },
  {
    id: 30,
    date: '2026-08-16T10:00:00Z',
    text: 'Looking back over the last few days, I\'ve spent a ridiculous amount of time on backend and API problems. At least the system now has enough information to potentially notice patterns like that.',
  },
];

async function runValidation() {
  console.log('================================================================');
  console.log('Cognitive Engine — KG Real-Data Validation Run (30 Entries)');
  console.log('================================================================\n');

  const userId = '00000000-0000-0000-0000-000000000001';
  const repository = new InMemoryKnowledgeGraphRepository();
  const extractor = new DeterministicMockExtractionProvider();
  const embeddingProvider = new MiniLMEmbeddingProvider();
  const resolver = new LayeredHybridEntityResolver(embeddingProvider);
  const engine = new KnowledgeGraphEngine(repository, extractor, resolver);

  const fragmentLogs: any[] = [];
  let totalExtractionCount = 0;
  let totalResolvedCount = 0;
  let totalCreatedCount = 0;
  let totalAmbiguousCount = 0;

  console.log('Processing 30 entries sequentially through KG pipeline...\n');

  for (const entry of JOURNAL_ENTRIES) {
    const fragmentId = `frag_${entry.id.toString().padStart(3, '0')}`;
    const memoryId = `mem_${entry.id.toString().padStart(3, '0')}`;
    const contentHash = crypto.createHash('sha256').update(entry.text).digest('hex');
    const capturedAt = new Date(entry.date);

    const result = await engine.processFragment({
      userId,
      fragmentId,
      content: entry.text,
      contentHash,
      memoryId,
      capturedAt,
    });

    totalExtractionCount += result.entitiesExtracted;
    totalResolvedCount += result.entitiesResolved;
    totalCreatedCount += result.entitiesCreated;
    totalAmbiguousCount += result.entitiesAmbiguous;

    fragmentLogs.push({
      entryId: entry.id,
      date: entry.date,
      text: entry.text,
      fragmentId,
      contentHash,
      result,
    });

    console.log(
      `[Entry ${entry.id.toString().padStart(2, '0')}] Extracted: ${result.entitiesExtracted} | Resolved: ${result.entitiesResolved} | Created: ${result.entitiesCreated} | Ambiguous: ${result.entitiesAmbiguous} | Edges: ${result.relationshipsCreated}`
    );
  }

  // Audit all graph data
  const allEntities = await repository.listEntities(userId);
  const pendingCandidates = await repository.listPendingCandidates(userId);
  const allRelationships = (await repository.getSubgraph(userId, { limit: 1000 })).edges;

  // Compile full provenance audit
  const provenanceList: EntityResolutionProvenance[] = [];
  for (const log of fragmentLogs) {
    const provs = await repository.findProvenanceByFragmentId(log.fragmentId, userId);
    provenanceList.push(...provs);
  }

  console.log('\n================================================================');
  console.log('AUDIT SUMMARY');
  console.log('================================================================');
  console.log(`Total Fragments Ingested:        ${JOURNAL_ENTRIES.length}`);
  console.log(`Total Entity Mentions Extracted: ${totalExtractionCount}`);
  console.log(`Total Decisions - RESOLVED:     ${totalResolvedCount}`);
  console.log(`Total Decisions - NO_MATCH:      ${totalCreatedCount}`);
  console.log(`Total Decisions - AMBIGUOUS:     ${totalAmbiguousCount}`);
  console.log(`Total Canonical Entities:        ${allEntities.length}`);
  console.log(`Total Pending Candidate Items:   ${pendingCandidates.length}`);
  console.log(`Total Relationship Assertions:   ${allRelationships.length}`);
  console.log(`Total Provenance Records:        ${provenanceList.length}`);
  console.log('================================================================\n');

  console.log('--- Canonical Entities Created ---');
  for (const ent of allEntities) {
    console.log(
      `• [${ent.entityType}] "${ent.canonicalName}" (ID: ${ent.id}) | Aliases: [${(ent.aliases || []).join(', ')}]`
    );
  }

  console.log('\n--- Relationship Assertions ---');
  for (const rel of allRelationships) {
    const src = allEntities.find((e) => e.id === rel.sourceEntityId)?.canonicalName || rel.sourceEntityId;
    const tgt = allEntities.find((e) => e.id === rel.targetEntityId)?.canonicalName || rel.targetEntityId;
    console.log(
      `• (${src}) --[${rel.relationType} (evidence: ${rel.evidenceCount})]--> (${tgt}) | Frag: ${rel.sourceFragmentId}`
    );
  }

  console.log('\n--- Pending Candidates Queue ---');
  for (const cand of pendingCandidates) {
    console.log(
      `• Mention: "${cand.surfaceMention}" [${cand.entityType}] | Status: ${cand.status} | Frag: ${cand.sourceFragmentId}`
    );
  }

  // Save audit artifact
  const outputDir = path.resolve(__dirname, '../experiments/journal-clustering/results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const auditReport = {
    metadata: {
      timestamp: new Date().toISOString(),
      totalEntries: JOURNAL_ENTRIES.length,
      operatingPoint: {
        stringThreshold: 0.85,
        embedThreshold: 0.80,
        separationMargin: 0.04,
        confirmationLowerBound: 0.75,
        modifierTrapMinDelta: 3,
      },
    },
    metrics: {
      totalFragments: JOURNAL_ENTRIES.length,
      totalMentionsExtracted: totalExtractionCount,
      decisionsResolved: totalResolvedCount,
      decisionsNoMatchCreated: totalCreatedCount,
      decisionsAmbiguous: totalAmbiguousCount,
      totalCanonicalEntities: allEntities.length,
      totalPendingCandidates: pendingCandidates.length,
      totalRelationshipAssertions: allRelationships.length,
      totalProvenanceRecords: provenanceList.length,
    },
    canonicalEntities: allEntities,
    relationships: allRelationships,
    pendingCandidates,
    fragmentExecutionLogs: fragmentLogs,
  };

  const outputPath = path.join(outputDir, 'real_data_validation_results.json');
  fs.writeFileSync(outputPath, JSON.stringify(auditReport, null, 2), 'utf-8');
  console.log(`\nSaved detailed audit results to: ${outputPath}`);
}

runValidation().catch((err) => {
  console.error('Validation failed with error:', err);
  process.exit(1);
});
