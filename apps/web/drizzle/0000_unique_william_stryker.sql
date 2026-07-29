CREATE TYPE "public"."inspiration_kind" AS ENUM('link', 'image', 'note', 'quote');--> statement-breakpoint
CREATE TABLE "inspiration_tags" (
	"inspiration_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "inspiration_tags_inspiration_id_tag_id_pk" PRIMARY KEY("inspiration_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "inspirations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "inspiration_kind" NOT NULL,
	"title" varchar(240),
	"content" text,
	"source_url" text,
	"canonical_url" text,
	"domain" varchar(255),
	"image_url" text,
	"blob_pathname" text,
	"mime_type" varchar(120),
	"note" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"favorite" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(40) NOT NULL,
	"slug" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inspiration_tags" ADD CONSTRAINT "inspiration_tags_inspiration_id_inspirations_id_fk" FOREIGN KEY ("inspiration_id") REFERENCES "public"."inspirations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspiration_tags" ADD CONSTRAINT "inspiration_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inspiration_tags_tag_id_idx" ON "inspiration_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "inspirations_canonical_url_unique" ON "inspirations" USING btree ("canonical_url");--> statement-breakpoint
CREATE INDEX "inspirations_created_at_idx" ON "inspirations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "inspirations_kind_idx" ON "inspirations" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "inspirations_favorite_idx" ON "inspirations" USING btree ("favorite");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_slug_unique" ON "tags" USING btree ("slug");