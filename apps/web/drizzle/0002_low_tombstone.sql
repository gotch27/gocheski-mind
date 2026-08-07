CREATE TABLE "application_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level" varchar(10) NOT NULL,
	"source" varchar(120) NOT NULL,
	"message" text NOT NULL,
	"process" varchar(160),
	"correlation_id" varchar(100),
	"owner_id" text,
	"error_name" varchar(160),
	"error_message" text,
	"stack" text,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "application_logs_created_at_idx" ON "application_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "application_logs_level_created_at_idx" ON "application_logs" USING btree ("level","created_at");--> statement-breakpoint
CREATE INDEX "application_logs_owner_created_at_idx" ON "application_logs" USING btree ("owner_id","created_at");--> statement-breakpoint
CREATE INDEX "application_logs_correlation_id_idx" ON "application_logs" USING btree ("correlation_id");