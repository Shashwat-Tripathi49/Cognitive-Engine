import {
  pgTable,
  uuid,
  text,
  varchar,
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
