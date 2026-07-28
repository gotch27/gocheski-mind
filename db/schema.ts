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

export const inspirations = pgTable(
  "inspirations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
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
    uniqueIndex("inspirations_canonical_url_unique").on(table.canonicalUrl),
    index("inspirations_created_at_idx").on(table.createdAt),
    index("inspirations_kind_idx").on(table.kind),
    index("inspirations_favorite_idx").on(table.favorite)
  ]
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 40 }).notNull(),
    slug: varchar("slug", { length: 50 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [uniqueIndex("tags_slug_unique").on(table.slug)]
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
