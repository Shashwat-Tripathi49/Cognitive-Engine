import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
  jsonb,
  index,
  customType,
} from 'drizzle-orm/pg-core';

/**
 * Custom vector type for pgvector (384 dimensions for all-MiniLM-L6-v2)
 */
export const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(384)';
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
  fromDriver(value: string): number[] {
    return typeof value === 'string' ? JSON.parse(value) : value;
  },
});

/**
 * Cognitive Fragments Table — Sprint 1B Database Schema
 *
 * Persists raw, normalized, immutable cognitive fragments captured by the Capture Engine.
 */
export const cognitiveFragments = pgTable(
  'cognitive_fragments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    content: text('content').notNull(),
    modality: varchar('modality', { length: 32 }).notNull().default('text'),
    contentHash: varchar('content_hash', { length: 64 }).notNull(),
    capturedAt: timestamp('captured_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    metadata: jsonb('metadata').notNull().default({}),
  },
  (table) => [
    index('cognitive_fragments_user_id_idx').on(table.userId),
    index('cognitive_fragments_content_hash_idx').on(table.contentHash),
    index('cognitive_fragments_captured_at_idx').on(table.capturedAt),
  ]
);

export type CognitiveFragmentSelect = typeof cognitiveFragments.$inferSelect;
export type CognitiveFragmentInsert = typeof cognitiveFragments.$inferInsert;

/**
 * Memories Table — Sprint 1C-B Database Schema
 *
 * Derived semantic memories transformed from Cognitive Fragments, with 384-D vector embeddings.
 */
export const memories = pgTable(
  'memories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    fragmentId: uuid('fragment_id')
      .notNull()
      .references(() => cognitiveFragments.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    embedding: vector('embedding'),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('memories_user_id_idx').on(table.userId),
    index('memories_fragment_id_idx').on(table.fragmentId),
    index('memories_created_at_idx').on(table.createdAt),
  ]
);

export type MemorySelect = typeof memories.$inferSelect;
export type MemoryInsert = typeof memories.$inferInsert;

/**
 * Canonical Entities Table — Knowledge Graph Engine
 *
 * Persists deduplicated canonical entity nodes with multi-tenant isolation.
 */
export const canonicalEntities = pgTable(
  'canonical_entities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    canonicalName: varchar('canonical_name', { length: 255 }).notNull(),
    entityType: varchar('entity_type', { length: 64 }).notNull(),
    status: varchar('status', { length: 32 }).notNull().default('ACTIVE'),
    mergedIntoId: uuid('merged_into_id'),
    currentCanonicalId: uuid('current_canonical_id'),
    description: text('description'),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('canonical_entities_user_id_idx').on(table.userId),
    index('canonical_entities_user_status_idx').on(table.userId, table.status),
    index('canonical_entities_user_type_idx').on(table.userId, table.entityType),
    index('canonical_entities_user_current_idx').on(
      table.userId,
      table.currentCanonicalId
    ),
  ]
);

export type CanonicalEntitySelect = typeof canonicalEntities.$inferSelect;
export type CanonicalEntityInsert = typeof canonicalEntities.$inferInsert;

/**
 * Entity Aliases Table — Knowledge Graph Engine
 *
 * Stores verified and proposed surface aliases mapped to canonical entities.
 */
export const entityAliases = pgTable(
  'entity_aliases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    canonicalId: uuid('canonical_id')
      .notNull()
      .references(() => canonicalEntities.id, { onDelete: 'restrict' }),
    aliasName: varchar('alias_name', { length: 255 }).notNull(),
    normalizedAlias: varchar('normalized_alias', { length: 255 }).notNull(),
    status: varchar('status', { length: 32 }).notNull().default('ACTIVE'),
    verificationActor: varchar('verification_actor', { length: 32 })
      .notNull()
      .default('SYSTEM'),
    sourceMemoryId: uuid('source_memory_id'),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('entity_aliases_user_id_idx').on(table.userId),
    index('entity_aliases_user_norm_idx').on(
      table.userId,
      table.normalizedAlias,
      table.status
    ),
    index('entity_aliases_canonical_id_idx').on(table.canonicalId),
  ]
);

export type EntityAliasSelect = typeof entityAliases.$inferSelect;
export type EntityAliasInsert = typeof entityAliases.$inferInsert;

/**
 * Entity Resolution Provenance Table — Knowledge Graph Engine
 *
 * Immutable audit log recording every resolver decision and link to source evidence.
 */
export const entityResolutionProvenance = pgTable(
  'entity_resolution_provenance',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    mentionId: uuid('mention_id').notNull(),
    sourceFragmentId: uuid('source_fragment_id')
      .notNull()
      .references(() => cognitiveFragments.id, { onDelete: 'restrict' }),
    sourceFragmentRevisionId: uuid('source_fragment_revision_id'),
    sourceContentHash: varchar('source_content_hash', { length: 64 }).notNull(),
    sourceMemoryId: uuid('source_memory_id'),
    canonicalId: uuid('canonical_id').references(() => canonicalEntities.id, {
      onDelete: 'restrict',
    }),
    surfaceMention: varchar('surface_mention', { length: 255 }).notNull(),
    resolutionMethod: varchar('resolution_method', { length: 64 }).notNull(),
    similarityScore: customType<{ data: number; driverData: number }>({
      dataType() {
        return 'real';
      },
    })('similarity_score'),
    separationMargin: customType<{ data: number; driverData: number }>({
      dataType() {
        return 'real';
      },
    })('separation_margin'),
    resolverVersion: varchar('resolver_version', { length: 32 })
      .notNull()
      .default('v2.0.0'),
    decidedBy: varchar('decided_by', { length: 32 }).notNull().default('RESOLVER'),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('provenance_user_id_idx').on(table.userId),
    index('provenance_source_fragment_idx').on(table.sourceFragmentId),
    index('provenance_source_memory_idx').on(table.sourceMemoryId),
    index('provenance_canonical_id_idx').on(table.canonicalId),
  ]
);

export type EntityResolutionProvenanceSelect =
  typeof entityResolutionProvenance.$inferSelect;
export type EntityResolutionProvenanceInsert =
  typeof entityResolutionProvenance.$inferInsert;

/**
 * Candidate Confirmation Queue Table — Knowledge Graph Engine
 *
 * Stages ambiguous entity mentions requiring human or higher-order resolution.
 */
export const candidateConfirmationQueue = pgTable(
  'candidate_confirmation_queue',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    surfaceMention: varchar('surface_mention', { length: 255 }).notNull(),
    entityType: varchar('entity_type', { length: 64 }).notNull(),
    suggestedCanonicalId: uuid('suggested_canonical_id').references(
      () => canonicalEntities.id,
      { onDelete: 'set null' }
    ),
    similarityScore: customType<{ data: number; driverData: number }>({
      dataType() {
        return 'real';
      },
    })('similarity_score'),
    sourceMemoryId: uuid('source_memory_id'),
    sourceFragmentId: uuid('source_fragment_id').references(
      () => cognitiveFragments.id,
      { onDelete: 'cascade' }
    ),
    status: varchar('status', { length: 32 }).notNull().default('PENDING'),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('candidate_queue_user_status_idx').on(table.userId, table.status),
    index('candidate_queue_source_fragment_idx').on(table.sourceFragmentId),
  ]
);

export type CandidateConfirmationQueueSelect =
  typeof candidateConfirmationQueue.$inferSelect;
export type CandidateConfirmationQueueInsert =
  typeof candidateConfirmationQueue.$inferInsert;

/**
 * KG Relationships Table (Graph Assertions) — Knowledge Graph Engine
 *
 * Persists bitemporal, provenance-bound edges between canonical entities.
 */
export const kgRelationships = pgTable(
  'kg_relationships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    sourceEntityId: uuid('source_entity_id')
      .notNull()
      .references(() => canonicalEntities.id, { onDelete: 'restrict' }),
    targetEntityId: uuid('target_entity_id')
      .notNull()
      .references(() => canonicalEntities.id, { onDelete: 'restrict' }),
    relationType: varchar('relation_type', { length: 64 }).notNull(),
    confidence: customType<{ data: number; driverData: number }>({
      dataType() {
        return 'real';
      },
    })('confidence')
      .notNull()
      .default(1.0),
    evidenceCount: customType<{ data: number; driverData: number }>({
      dataType() {
        return 'integer';
      },
    })('evidence_count')
      .notNull()
      .default(1),
    sourceFragmentId: uuid('source_fragment_id')
      .notNull()
      .references(() => cognitiveFragments.id, { onDelete: 'restrict' }),
    sourceMemoryId: uuid('source_memory_id'),
    sourceContentHash: varchar('source_content_hash', { length: 64 }).notNull(),
    extractionRunId: varchar('extraction_run_id', { length: 64 }),
    status: varchar('status', { length: 32 }).notNull().default('ACTIVE'),
    assertedAt: timestamp('asserted_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    validAt: timestamp('valid_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('kg_relationships_user_id_idx').on(table.userId),
    index('kg_relationships_source_idx').on(
      table.userId,
      table.sourceEntityId
    ),
    index('kg_relationships_target_idx').on(
      table.userId,
      table.targetEntityId
    ),
    index('kg_relationships_type_idx').on(table.userId, table.relationType),
    index('kg_relationships_source_frag_idx').on(table.sourceFragmentId),
  ]
);

export type KgRelationshipSelect = typeof kgRelationships.$inferSelect;
export type KgRelationshipInsert = typeof kgRelationships.$inferInsert;

/**
 * Evidence Chains Table — Milestone 5 Reasoning Engine
 *
 * Machine-verifiable audit chains linking validated claims back to root cognitive fragments.
 */
export const evidenceChains = pgTable(
  'evidence_chains',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    findingId: varchar('finding_id', { length: 64 }).notNull(),
    isVerified: boolean('is_verified').notNull().default(true),
    chainIntegrityHash: varchar('chain_integrity_hash', { length: 64 }).notNull(),
    rootFragmentIds: jsonb('root_fragment_ids').notNull().default([]),
    ruleEvaluations: jsonb('rule_evaluations').notNull().default([]),
    verificationTimestamp: timestamp('verification_timestamp', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('evidence_chains_user_id_idx').on(table.userId),
    index('evidence_chains_finding_id_idx').on(table.userId, table.findingId),
  ]
);

export type EvidenceChainSelect = typeof evidenceChains.$inferSelect;
export type EvidenceChainInsert = typeof evidenceChains.$inferInsert;

/**
 * Evidence Objects Table — Milestone 5 Reasoning Engine
 *
 * Concrete atomic pieces of evidence backing an EvidenceChain.
 */
export const evidenceObjects = pgTable(
  'evidence_objects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    chainId: uuid('chain_id')
      .notNull()
      .references(() => evidenceChains.id, { onDelete: 'cascade' }),
    evidenceType: varchar('evidence_type', { length: 32 }).notNull(),
    sourceId: uuid('source_id').notNull(),
    sourceContentHash: varchar('source_content_hash', { length: 64 }),
    sourceTimestamp: timestamp('source_timestamp', { mode: 'date', withTimezone: true }),
    validFrom: timestamp('valid_from', { mode: 'date', withTimezone: true }),
    validTo: timestamp('valid_to', { mode: 'date', withTimezone: true }),
    summary: text('summary').notNull(),
    verified: boolean('verified').notNull().default(true),
    verificationDetails: text('verification_details'),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('evidence_objects_user_id_idx').on(table.userId),
    index('evidence_objects_chain_id_idx').on(table.chainId),
    index('evidence_objects_source_id_idx').on(table.userId, table.sourceId),
  ]
);

export type EvidenceObjectSelect = typeof evidenceObjects.$inferSelect;
export type EvidenceObjectInsert = typeof evidenceObjects.$inferInsert;

/**
 * Validated Claims Table — Milestone 5 Reasoning Engine
 *
 * Final deterministic claims emitted by the Reasoning Engine, linked to an EvidenceChain.
 */
export const validatedClaims = pgTable(
  'validated_claims',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    sourceFindingId: varchar('source_finding_id', { length: 64 }).notNull(),
    evidenceChainId: uuid('evidence_chain_id')
      .notNull()
      .references(() => evidenceChains.id, { onDelete: 'restrict' }),
    claimType: varchar('claim_type', { length: 64 }).notNull(),
    status: varchar('status', { length: 32 }).notNull(),
    subjectEntityId: uuid('subject_entity_id'),
    objectEntityId: uuid('object_entity_id'),
    statement: text('statement').notNull(),
    deterministicSupportScore: customType<{ data: number; driverData: number }>({
      dataType() {
        return 'real';
      },
    })('deterministic_support_score').notNull(),
    appliedRuleIds: jsonb('applied_rule_ids').notNull().default([]),
    passedRuleIds: jsonb('passed_rule_ids').notNull().default([]),
    failedRuleIds: jsonb('failed_rule_ids').notNull().default([]),
    rejectionReason: varchar('rejection_reason', { length: 128 }),
    temporalStart: timestamp('temporal_start', { mode: 'date', withTimezone: true }).notNull(),
    temporalEnd: timestamp('temporal_end', { mode: 'date', withTimezone: true }).notNull(),
    reasoningVersion: varchar('reasoning_version', { length: 32 }).notNull().default('1.0.0'),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('validated_claims_user_id_idx').on(table.userId),
    index('validated_claims_status_idx').on(table.userId, table.status),
    index('validated_claims_type_idx').on(table.userId, table.claimType),
    index('validated_claims_chain_idx').on(table.evidenceChainId),
    index('validated_claims_finding_idx').on(table.userId, table.sourceFindingId),
  ]
);

export type ValidatedClaimSelect = typeof validatedClaims.$inferSelect;
export type ValidatedClaimInsert = typeof validatedClaims.$inferInsert;

// ============================================================================
// 5. Cognitive Engine: Candidate Findings
// ============================================================================

/**
 * Candidate findings generated deterministically by Cognitive Engine discovery
 */
export const candidateFindings = pgTable(
  'candidate_findings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    findingType: varchar('finding_type', { length: 64 }).notNull(),
    summary: text('summary').notNull(),
    statement: text('statement').notNull(),
    subjectEntityId: uuid('subject_entity_id'),
    objectEntityId: uuid('object_entity_id'),
    involvedEntityIds: jsonb('involved_entity_ids').notNull().default([]),
    involvedMemoryIds: jsonb('involved_memory_ids').notNull().default([]),
    involvedRelationshipIds: jsonb('involved_relationship_ids').notNull().default([]),
    temporalStart: timestamp('temporal_start', { mode: 'date', withTimezone: true }).notNull(),
    temporalEnd: timestamp('temporal_end', { mode: 'date', withTimezone: true }).notNull(),
    deterministicMetrics: jsonb('deterministic_metrics').notNull().default({}),
    discoveryAlgorithm: varchar('discovery_algorithm', { length: 128 }).notNull(),
    discoveryVersion: varchar('discovery_version', { length: 32 }).notNull().default('1.0.0'),
    discoveryConfidence: customType<{ data: number; driverData: number }>({
      dataType() {
        return 'real';
      },
    })('discovery_confidence').notNull(),
    provenanceReferences: jsonb('provenance_references').notNull().default([]),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('candidate_findings_user_id_idx').on(table.userId),
    index('candidate_findings_type_idx').on(table.userId, table.findingType),
    index('candidate_findings_created_at_idx').on(table.userId, table.createdAt),
  ]
);

export type CandidateFindingSelect = typeof candidateFindings.$inferSelect;
export type CandidateFindingInsert = typeof candidateFindings.$inferInsert;



