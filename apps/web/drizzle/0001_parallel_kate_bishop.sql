CREATE TABLE "extension_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"name" varchar(80) DEFAULT 'Chrome extension' NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"token_prefix" varchar(24) NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "inspirations_canonical_url_unique";--> statement-breakpoint
DROP INDEX "inspirations_created_at_idx";--> statement-breakpoint
DROP INDEX "inspirations_kind_idx";--> statement-breakpoint
DROP INDEX "inspirations_favorite_idx";--> statement-breakpoint
DROP INDEX "tags_slug_unique";--> statement-breakpoint
ALTER TABLE "inspirations" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "owner_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "extension_tokens_hash_unique" ON "extension_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "extension_tokens_owner_created_at_idx" ON "extension_tokens" USING btree ("owner_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "inspirations_owner_canonical_url_unique" ON "inspirations" USING btree ("owner_id","canonical_url");--> statement-breakpoint
CREATE INDEX "inspirations_owner_created_at_idx" ON "inspirations" USING btree ("owner_id","created_at");--> statement-breakpoint
CREATE INDEX "inspirations_owner_kind_idx" ON "inspirations" USING btree ("owner_id","kind");--> statement-breakpoint
CREATE INDEX "inspirations_owner_favorite_idx" ON "inspirations" USING btree ("owner_id","favorite");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_owner_slug_unique" ON "tags" USING btree ("owner_id","slug");