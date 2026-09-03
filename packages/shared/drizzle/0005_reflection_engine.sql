CREATE TABLE IF NOT EXISTS "reflections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source_claim_id" uuid NOT NULL,
	"evidence_chain_id" uuid NOT NULL,
	"reflection_type" varchar(64) NOT NULL,
	"text" text NOT NULL,
	"structured_propositions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"grounded_segments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"chain_integrity_hash" varchar(64) NOT NULL,
	"bundle_integrity_hash" varchar(64) NOT NULL,
	"canonicalization_version" varchar(32) DEFAULT '1.0.0' NOT NULL,
	"synthesis_method" varchar(32) NOT NULL,
	"engine_version" varchar(32) DEFAULT '1.0.0' NOT NULL,
	"prompt_version" varchar(32) DEFAULT 'v1.0.0' NOT NULL,
	"model_info" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"validation_details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"temporal_start" timestamp with time zone NOT NULL,
	"temporal_end" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reflections" ADD CONSTRAINT "reflections_source_claim_id_validated_claims_id_fk" FOREIGN KEY ("source_claim_id") REFERENCES "public"."validated_claims"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reflections" ADD CONSTRAINT "reflections_evidence_chain_id_evidence_chains_id_fk" FOREIGN KEY ("evidence_chain_id") REFERENCES "public"."evidence_chains"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reflections_user_id_idx" ON "reflections" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reflections_claim_idx" ON "reflections" USING btree ("source_claim_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reflections_chain_idx" ON "reflections" USING btree ("evidence_chain_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reflections_created_at_idx" ON "reflections" USING btree ("user_id","created_at");
