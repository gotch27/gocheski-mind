import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";
import type { InspirationMetadata } from "@/lib/inspirations";

export const inspirationKind = pgEnum("inspiration_kind", ["link", "image", "note", "quote"]);

export const applicationLogs = pgTable(
  "application_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    level: varchar("level", { length: 10 }).notNull(),
    source: varchar("source", { length: 120 }).notNull(),
    message: text("message").notNull(),
    process: varchar("process", { length: 160 }),
    correlationId: varchar("correlation_id", { length: 100 }),
    ownerId: text("owner_id"),
    errorName: varchar("error_name", { length: 160 }),
    errorMessage: text("error_message"),
    stack: text("stack"),
    context: jsonb("context").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("application_logs_created_at_idx").on(table.createdAt),
    index("application_logs_level_created_at_idx").on(table.level, table.createdAt),
    index("application_logs_owner_created_at_idx").on(table.ownerId, table.createdAt),
    index("application_logs_correlation_id_idx").on(table.correlationId)
  ]
);

export const inspirations = pgTable(
  "inspirations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id"),
    kind: inspirationKind("kind").notNull(),
    title: varchar("title", { length: 240 }),
    content: text("content"),
    sourceUrl: text("source_url"),
    canonicalUrl: text("canonical_url"),
    domain: varchar("domain", { length: 255 }),
    imageUrl: text("image_url"),
    blobPathname: text("blob_pathname"),
    mimeType: varchar("mime_type", { length: 120 }),
    note: text("note"),
    metadata: jsonb("metadata").$type<InspirationMetadata>().notNull().default({}),
    favorite: boolean("favorite").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("inspirations_owner_canonical_url_unique").on(table.ownerId, table.canonicalUrl),
    index("inspirations_owner_created_at_idx").on(table.ownerId, table.createdAt),
    index("inspirations_owner_kind_idx").on(table.ownerId, table.kind),
    index("inspirations_owner_favorite_idx").on(table.ownerId, table.favorite)
  ]
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id"),
    name: varchar("name", { length: 40 }).notNull(),
    slug: varchar("slug", { length: 50 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [uniqueIndex("tags_owner_slug_unique").on(table.ownerId, table.slug)]
);

export const extensionTokens = pgTable(
  "extension_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id").notNull(),
    name: varchar("name", { length: 80 }).notNull().default("Chrome extension"),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    tokenPrefix: varchar("token_prefix", { length: 24 }).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("extension_tokens_hash_unique").on(table.tokenHash),
    index("extension_tokens_owner_created_at_idx").on(table.ownerId, table.createdAt)
  ]
);

export const inspirationTags = pgTable(
  "inspiration_tags",
  {
    inspirationId: uuid("inspiration_id")
      .notNull()
      .references(() => inspirations.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" })
  },
  (table) => [
    primaryKey({ columns: [table.inspirationId, table.tagId] }),
    index("inspiration_tags_tag_id_idx").on(table.tagId)
  ]
);
