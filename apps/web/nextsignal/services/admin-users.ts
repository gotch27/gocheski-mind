import { and, eq, isNull, sql } from "drizzle-orm";
import { getDatabase } from "@/db";
import { extensionTokens } from "@/db/schema";
import type { AdminUser } from "@/lib/admin-users";
import { isMindAdminEmail } from "@/lib/admin-users";

type AuthUserRow = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string | null;
  blocked: boolean | null;
  createdAt: Date;
};

export const adminUserService = {
  async list(): Promise<AdminUser[]> {
    const db = await getDatabase();
    const result = await db.execute<AuthUserRow>(sql`
      SELECT
        id::text AS id,
        name,
        email,
        image,
        role,
        banned AS blocked,
        "createdAt" AS "createdAt"
      FROM neon_auth."user"
      ORDER BY "createdAt" DESC
    `);
    return result.rows.map(toAdminUser);
  },

  async find(id: string): Promise<AdminUser | null> {
    const db = await getDatabase();
    const result = await db.execute<AuthUserRow>(sql`
      SELECT
        id::text AS id,
        name,
        email,
        image,
        role,
        banned AS blocked,
        "createdAt" AS "createdAt"
      FROM neon_auth."user"
      WHERE id = ${id}::uuid
      LIMIT 1
    `);
    return result.rows[0] ? toAdminUser(result.rows[0]) : null;
  },

  async setBlocked(id: string, blocked: boolean): Promise<AdminUser | null> {
    const db = await getDatabase();
    const result = await db.execute<AuthUserRow>(sql`
      UPDATE neon_auth."user"
      SET
        banned = ${blocked},
        "banReason" = ${blocked ? "Blocked by the Gocheski Mind administrator." : null},
        "banExpires" = NULL,
        "updatedAt" = NOW()
      WHERE id = ${id}::uuid
      RETURNING
        id::text AS id,
        name,
        email,
        image,
        role,
        banned AS blocked,
        "createdAt" AS "createdAt"
    `);
    const user = result.rows[0] ? toAdminUser(result.rows[0]) : null;
    if (!user || !blocked) return user;

    await db.execute(sql`DELETE FROM neon_auth.session WHERE "userId" = ${id}::uuid`);
    await db
      .update(extensionTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(extensionTokens.ownerId, id), isNull(extensionTokens.revokedAt)));

    return user;
  }
};

function toAdminUser(row: AuthUserRow): AdminUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    image: row.image,
    role: row.role ?? "user",
    blocked: row.blocked ?? false,
    createdAt: new Date(row.createdAt).toISOString(),
    isAdmin: isMindAdminEmail(row.email)
  };
}
