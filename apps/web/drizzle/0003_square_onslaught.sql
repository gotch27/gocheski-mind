CREATE TABLE "extension_capture_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"inspiration_id" uuid NOT NULL,
	"extension_token_id" uuid NOT NULL,
	"receipt_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "extension_capture_receipts" ADD CONSTRAINT "extension_capture_receipts_inspiration_id_inspirations_id_fk" FOREIGN KEY ("inspiration_id") REFERENCES "public"."inspirations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extension_capture_receipts" ADD CONSTRAINT "extension_capture_receipts_extension_token_id_extension_tokens_id_fk" FOREIGN KEY ("extension_token_id") REFERENCES "public"."extension_tokens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "extension_capture_receipts_hash_unique" ON "extension_capture_receipts" USING btree ("receipt_hash");--> statement-breakpoint
CREATE INDEX "extension_capture_receipts_expires_at_idx" ON "extension_capture_receipts" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "extension_capture_receipts_token_created_at_idx" ON "extension_capture_receipts" USING btree ("extension_token_id","created_at");