CREATE TABLE "cognitive_fragments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"modality" varchar(32) DEFAULT 'text' NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE INDEX "cognitive_fragments_user_id_idx" ON "cognitive_fragments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cognitive_fragments_content_hash_idx" ON "cognitive_fragments" USING btree ("content_hash");--> statement-breakpoint
CREATE INDEX "cognitive_fragments_captured_at_idx" ON "cognitive_fragments" USING btree ("captured_at");