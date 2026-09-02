-- Milestone 5: Reasoning Engine Database Schema Migration

CREATE TABLE IF NOT EXISTS "evidence_chains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"finding_id" varchar(64) NOT NULL,
	"is_verified" boolean DEFAULT true NOT NULL,
	"chain_integrity_hash" varchar(64) NOT NULL,
	"root_fragment_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rule_evaluations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verification_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "evidence_objects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"chain_id" uuid NOT NULL REFERENCES "evidence_chains"("id") ON DELETE cascade,
	"evidence_type" varchar(32) NOT NULL,
	"source_id" uuid NOT NULL,
	"source_content_hash" varchar(64),
	"source_timestamp" timestamp with time zone,
	"valid_from" timestamp with time zone,
	"valid_to" timestamp with time zone,
	"summary" text NOT NULL,
	"verified" boolean DEFAULT true NOT NULL,
	"verification_details" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "validated_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source_finding_id" varchar(64) NOT NULL,
	"evidence_chain_id" uuid NOT NULL REFERENCES "evidence_chains"("id") ON DELETE restrict,
	"claim_type" varchar(64) NOT NULL,
	"status" varchar(32) NOT NULL,
	"subject_entity_id" uuid,
	"object_entity_id" uuid,
	"statement" text NOT NULL,
	"deterministic_support_score" real NOT NULL,
	"applied_rule_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"passed_rule_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"failed_rule_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rejection_reason" varchar(128),
	"temporal_start" timestamp with time zone NOT NULL,
	"temporal_end" timestamp with time zone NOT NULL,
	"reasoning_version" varchar(32) DEFAULT '1.0.0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "evidence_chains_user_id_idx" ON "evidence_chains" ("user_id");
CREATE INDEX IF NOT EXISTS "evidence_chains_finding_id_idx" ON "evidence_chains" ("user_id", "finding_id");

CREATE INDEX IF NOT EXISTS "evidence_objects_user_id_idx" ON "evidence_objects" ("user_id");
CREATE INDEX IF NOT EXISTS "evidence_objects_chain_id_idx" ON "evidence_objects" ("chain_id");
CREATE INDEX IF NOT EXISTS "evidence_objects_source_id_idx" ON "evidence_objects" ("user_id", "source_id");

CREATE INDEX IF NOT EXISTS "validated_claims_user_id_idx" ON "validated_claims" ("user_id");
CREATE INDEX IF NOT EXISTS "validated_claims_status_idx" ON "validated_claims" ("user_id", "status");
CREATE INDEX IF NOT EXISTS "validated_claims_type_idx" ON "validated_claims" ("user_id", "claim_type");
CREATE INDEX IF NOT EXISTS "validated_claims_chain_idx" ON "validated_claims" ("evidence_chain_id");
CREATE INDEX IF NOT EXISTS "validated_claims_finding_idx" ON "validated_claims" ("user_id", "source_finding_id");
