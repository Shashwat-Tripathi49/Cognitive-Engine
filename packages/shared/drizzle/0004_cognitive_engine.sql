-- Migration 0004: Cognitive Engine Candidate Findings Table
CREATE TABLE IF NOT EXISTS "candidate_findings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "finding_type" varchar(64) NOT NULL,
  "summary" text NOT NULL,
  "statement" text NOT NULL,
  "subject_entity_id" uuid,
  "object_entity_id" uuid,
  "involved_entity_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "involved_memory_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "involved_relationship_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "temporal_start" timestamp with time zone NOT NULL,
  "temporal_end" timestamp with time zone NOT NULL,
  "deterministic_metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "discovery_algorithm" varchar(128) NOT NULL,
  "discovery_version" varchar(32) DEFAULT '1.0.0' NOT NULL,
  "discovery_confidence" real NOT NULL,
  "provenance_references" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "candidate_findings_user_id_idx" ON "candidate_findings" ("user_id");
CREATE INDEX IF NOT EXISTS "candidate_findings_type_idx" ON "candidate_findings" ("user_id", "finding_type");
CREATE INDEX IF NOT EXISTS "candidate_findings_created_at_idx" ON "candidate_findings" ("user_id", "created_at");
