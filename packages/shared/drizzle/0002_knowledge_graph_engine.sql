CREATE TABLE IF NOT EXISTS "canonical_entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"canonical_name" varchar(255) NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"status" varchar(32) DEFAULT 'ACTIVE' NOT NULL,
	"merged_into_id" uuid,
	"current_canonical_id" uuid,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "canonical_entities_user_id_idx" ON "canonical_entities" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "canonical_entities_user_status_idx" ON "canonical_entities" USING btree ("user_id", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "canonical_entities_user_type_idx" ON "canonical_entities" USING btree ("user_id", "entity_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "canonical_entities_user_current_idx" ON "canonical_entities" USING btree ("user_id", "current_canonical_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "entity_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"canonical_id" uuid NOT NULL REFERENCES "canonical_entities"("id") ON DELETE RESTRICT,
	"alias_name" varchar(255) NOT NULL,
	"normalized_alias" varchar(255) NOT NULL,
	"status" varchar(32) DEFAULT 'ACTIVE' NOT NULL,
	"verification_actor" varchar(32) DEFAULT 'SYSTEM' NOT NULL,
	"source_memory_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "entity_aliases_user_id_idx" ON "entity_aliases" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "entity_aliases_user_norm_idx" ON "entity_aliases" USING btree ("user_id", "normalized_alias", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "entity_aliases_canonical_id_idx" ON "entity_aliases" USING btree ("canonical_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "entity_resolution_provenance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"mention_id" uuid NOT NULL,
	"source_fragment_id" uuid NOT NULL REFERENCES "cognitive_fragments"("id") ON DELETE RESTRICT,
	"source_fragment_revision_id" uuid,
	"source_content_hash" varchar(64) NOT NULL,
	"source_memory_id" uuid,
	"canonical_id" uuid REFERENCES "canonical_entities"("id") ON DELETE RESTRICT,
	"surface_mention" varchar(255) NOT NULL,
	"resolution_method" varchar(64) NOT NULL,
	"similarity_score" real,
	"separation_margin" real,
	"resolver_version" varchar(32) DEFAULT 'v2.0.0' NOT NULL,
	"decided_by" varchar(32) DEFAULT 'RESOLVER' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "provenance_user_id_idx" ON "entity_resolution_provenance" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "provenance_source_fragment_idx" ON "entity_resolution_provenance" USING btree ("source_fragment_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "provenance_source_memory_idx" ON "entity_resolution_provenance" USING btree ("source_memory_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "provenance_canonical_id_idx" ON "entity_resolution_provenance" USING btree ("canonical_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "candidate_confirmation_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"surface_mention" varchar(255) NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"suggested_canonical_id" uuid REFERENCES "canonical_entities"("id") ON DELETE SET NULL,
	"similarity_score" real,
	"source_memory_id" uuid,
	"source_fragment_id" uuid REFERENCES "cognitive_fragments"("id") ON DELETE CASCADE,
	"status" varchar(32) DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "candidate_queue_user_status_idx" ON "candidate_confirmation_queue" USING btree ("user_id", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "candidate_queue_source_fragment_idx" ON "candidate_confirmation_queue" USING btree ("source_fragment_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kg_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source_entity_id" uuid NOT NULL REFERENCES "canonical_entities"("id") ON DELETE RESTRICT,
	"target_entity_id" uuid NOT NULL REFERENCES "canonical_entities"("id") ON DELETE RESTRICT,
	"relation_type" varchar(64) NOT NULL,
	"confidence" real DEFAULT 1.0 NOT NULL,
	"evidence_count" integer DEFAULT 1 NOT NULL,
	"source_fragment_id" uuid NOT NULL REFERENCES "cognitive_fragments"("id") ON DELETE RESTRICT,
	"source_memory_id" uuid,
	"source_content_hash" varchar(64) NOT NULL,
	"extraction_run_id" varchar(64),
	"status" varchar(32) DEFAULT 'ACTIVE' NOT NULL,
	"asserted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kg_relationships_user_id_idx" ON "kg_relationships" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kg_relationships_source_idx" ON "kg_relationships" USING btree ("user_id", "source_entity_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kg_relationships_target_idx" ON "kg_relationships" USING btree ("user_id", "target_entity_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kg_relationships_type_idx" ON "kg_relationships" USING btree ("user_id", "relation_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kg_relationships_source_frag_idx" ON "kg_relationships" USING btree ("source_fragment_id");
