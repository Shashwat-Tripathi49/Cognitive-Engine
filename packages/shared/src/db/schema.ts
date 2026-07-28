import { pgTable, uuid, text, varchar, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

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
