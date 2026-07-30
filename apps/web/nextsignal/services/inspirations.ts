import { and, asc, desc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import { getDatabase } from "@/db";
import { inspirationTags, inspirations, tags as tagsTable } from "@/db/schema";
import type {
  CreateInspirationInput,
  Inspiration,
  InspirationListInput,
  UpdateInspirationInput
} from "@/lib/inspirations";
import { normalizeUrl } from "@/nextsignal/services/link-metadata";

export type CreateInspirationRecordResult = {
  inspiration: Inspiration;
  duplicate: boolean;
};

export const inspirationService = {
  async list(input: InspirationListInput): Promise<Inspiration[]> {
    const db = await getDatabase();
    const conditions: SQL[] = [];

    if (input.kind) conditions.push(eq(inspirations.kind, input.kind));
    if (input.favorite !== undefined) conditions.push(eq(inspirations.favorite, input.favorite));

    if (input.tag) {
      const matchingTags = await db
        .select({ id: inspirationTags.inspirationId })
        .from(inspirationTags)
        .innerJoin(tagsTable, eq(tagsTable.id, inspirationTags.tagId))
        .where(eq(tagsTable.name, input.tag));
      if (matchingTags.length === 0) return [];
      conditions.push(inArray(inspirations.id, matchingTags.map((row) => row.id)));
    }

    if (input.query) {
      const pattern = `%${input.query}%`;
      const matchingTags = await db
        .selectDistinct({ id: inspirationTags.inspirationId })
        .from(inspirationTags)
        .innerJoin(tagsTable, eq(tagsTable.id, inspirationTags.tagId))
        .where(ilike(tagsTable.name, pattern));
      const matchingTagIds = matchingTags.map((row) => row.id);

      conditions.push(
        or(
          ilike(inspirations.title, pattern),
          ilike(inspirations.content, pattern),
          ilike(inspirations.note, pattern),
          ilike(inspirations.domain, pattern),
          matchingTagIds.length ? inArray(inspirations.id, matchingTagIds) : undefined
        )!
      );
    }

    const rows = await db
      .select()
      .from(inspirations)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(inspirations.createdAt))
      .limit(input.limit ?? 80);

    const tagMap = await readTagMap(rows.map((row) => row.id));
    return rows.map((row) => toInspiration(row, tagMap.get(row.id) ?? []));
  },

  async listLabels(): Promise<string[]> {
    const db = await getDatabase();
    const rows = await db
      .selectDistinct({ name: tagsTable.name })
      .from(tagsTable)
      .innerJoin(inspirationTags, eq(inspirationTags.tagId, tagsTable.id))
      .orderBy(asc(tagsTable.name));
    return rows.map((row) => row.name);
  },

  async create(input: CreateInspirationInput): Promise<CreateInspirationRecordResult> {
    const db = await getDatabase();
    const sourceUrl = input.sourceUrl ? normalizeUrl(input.sourceUrl) : undefined;
    const canonicalUrl = input.kind === "link" && sourceUrl ? normalizeUrl(sourceUrl) : undefined;

    if (canonicalUrl) {
      const [existing] = await db
        .select({ id: inspirations.id })
        .from(inspirations)
        .where(eq(inspirations.canonicalUrl, canonicalUrl))
        .limit(1);

      if (existing) {
        const current = await readById(existing.id);
        if (!current) throw new Error("The duplicate inspiration could not be loaded.");
        if (input.tags?.length) await syncTags(existing.id, [...current.tags, ...input.tags]);
        const inspiration = input.tags?.length ? await readById(existing.id) : current;
        if (!inspiration) throw new Error("The duplicate inspiration could not be loaded.");
        return { inspiration, duplicate: true };
      }
    }

    const [created] = await db
      .insert(inspirations)
      .values({
        kind: input.kind,
        title: cleanOptional(input.title),
        content: cleanOptional(input.content),
        sourceUrl,
        canonicalUrl,
        domain: sourceUrl ? new URL(sourceUrl).hostname.replace(/^www\./, "") : undefined,
        imageUrl: input.imageUrl,
        blobPathname: input.blobPathname,
        mimeType: input.mimeType,
        note: cleanOptional(input.note),
        metadata: input.metadata ?? {}
      })
      .returning({ id: inspirations.id });

    await syncTags(created.id, input.tags ?? []);
    const inspiration = await readById(created.id);
    if (!inspiration) throw new Error("The new inspiration could not be loaded.");
    return { inspiration, duplicate: false };
  },

  async update(input: UpdateInspirationInput): Promise<Inspiration | null> {
    const db = await getDatabase();
    const [existing] = await db.select().from(inspirations).where(eq(inspirations.id, input.id)).limit(1);
    if (!existing) return null;

    const values: Partial<typeof inspirations.$inferInsert> = { updatedAt: new Date() };
    if (input.title !== undefined) values.title = cleanOptional(input.title);
    if (input.content !== undefined) values.content = cleanOptional(input.content);
    if (input.note !== undefined) values.note = cleanOptional(input.note);
    if (input.favorite !== undefined) values.favorite = input.favorite;
    if (input.sourceUrl !== undefined) {
      const sourceUrl = input.sourceUrl ? normalizeUrl(input.sourceUrl) : null;
      values.sourceUrl = sourceUrl;
      values.domain = sourceUrl ? new URL(sourceUrl).hostname.replace(/^www\./, "") : null;
      values.canonicalUrl = existing.kind === "link" && sourceUrl ? sourceUrl : null;
    }

    await db.update(inspirations).set(values).where(eq(inspirations.id, input.id));
    if (input.tags !== undefined) await syncTags(input.id, input.tags);
    return readById(input.id);
  },

  async delete(id: string) {
    const db = await getDatabase();
    const [existing] = await db
      .select({ id: inspirations.id, imageUrl: inspirations.imageUrl, blobPathname: inspirations.blobPathname })
      .from(inspirations)
      .where(eq(inspirations.id, id))
      .limit(1);
    if (!existing) return null;

    await db.delete(inspirations).where(eq(inspirations.id, id));
    return existing;
  }
};

async function readById(id: string) {
  const db = await getDatabase();
  const [row] = await db.select().from(inspirations).where(eq(inspirations.id, id)).limit(1);
  if (!row) return null;
  const tagMap = await readTagMap([id]);
  return toInspiration(row, tagMap.get(id) ?? []);
}

async function readTagMap(ids: string[]) {
  const map = new Map<string, string[]>();
  if (ids.length === 0) return map;

  const db = await getDatabase();
  const rows = await db
    .select({ inspirationId: inspirationTags.inspirationId, name: tagsTable.name })
    .from(inspirationTags)
    .innerJoin(tagsTable, eq(tagsTable.id, inspirationTags.tagId))
    .where(inArray(inspirationTags.inspirationId, ids));

  for (const row of rows) {
    const names = map.get(row.inspirationId) ?? [];
    names.push(row.name);
    map.set(row.inspirationId, names);
  }
  return map;
}

async function syncTags(inspirationId: string, names: string[]) {
  const db = await getDatabase();
  const normalized = [...new Set(names.map((name) => name.trim()).filter(Boolean))].slice(0, 12);
  await db.delete(inspirationTags).where(eq(inspirationTags.inspirationId, inspirationId));

  for (const name of normalized) {
    const slug = slugify(name);
    const [tag] = await db
      .insert(tagsTable)
      .values({ name, slug })
      .onConflictDoUpdate({ target: tagsTable.slug, set: { name } })
      .returning({ id: tagsTable.id });
    await db.insert(inspirationTags).values({ inspirationId, tagId: tag.id }).onConflictDoNothing();
  }
}

function toInspiration(row: typeof inspirations.$inferSelect, tagNames: string[]): Inspiration {
  return {
    ...row,
    metadata: row.metadata ?? {},
    tags: tagNames.sort((left, right) => left.localeCompare(right)),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function cleanOptional(value?: string) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "tag";
}
