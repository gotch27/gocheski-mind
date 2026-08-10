import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getDatabase } from "@/db";
import { extensionTokens } from "@/db/schema";
import type { CreatedExtensionToken, ExtensionToken } from "@/lib/extension-tokens";

export const extensionTokenService = {
  async list(ownerId: string): Promise<ExtensionToken[]> {
    const db = await getDatabase();
    const rows = await db
      .select()
      .from(extensionTokens)
      .where(and(eq(extensionTokens.ownerId, ownerId), isNull(extensionTokens.revokedAt)))
      .orderBy(desc(extensionTokens.createdAt));
    return rows.map(toExtensionToken);
  },

  async create(ownerId: string, name: string): Promise<CreatedExtensionToken> {
    const db = await getDatabase();
    const token = `mind_ext_${randomBytes(32).toString("base64url")}`;
    const [created] = await db
      .insert(extensionTokens)
      .values({
        ownerId,
        name,
        tokenHash: hashToken(token),
        tokenPrefix: `${token.slice(0, 17)}…`
      })
      .returning();
    return { ...toExtensionToken(created), token };
  },

  async revoke(ownerId: string, id: string) {
    const db = await getDatabase();
    const [revoked] = await db
      .update(extensionTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(extensionTokens.id, id), eq(extensionTokens.ownerId, ownerId), isNull(extensionTokens.revokedAt)))
      .returning({ id: extensionTokens.id });
    return revoked ?? null;
  },

  async authenticate(token: string) {
    if (!token.startsWith("mind_ext_") || token.length < 40 || token.length > 100) return null;

    const db = await getDatabase();
    const [record] = await db
      .select({ id: extensionTokens.id, ownerId: extensionTokens.ownerId })
      .from(extensionTokens)
      .where(and(eq(extensionTokens.tokenHash, hashToken(token)), isNull(extensionTokens.revokedAt)))
      .limit(1);
    if (!record) return null;

    await db.update(extensionTokens).set({ lastUsedAt: new Date() }).where(eq(extensionTokens.id, record.id));
    return { ownerId: record.ownerId, tokenId: record.id };
  }
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function toExtensionToken(row: typeof extensionTokens.$inferSelect): ExtensionToken {
  return {
    id: row.id,
    name: row.name,
    tokenPrefix: row.tokenPrefix,
    createdAt: row.createdAt.toISOString(),
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null
  };
}
