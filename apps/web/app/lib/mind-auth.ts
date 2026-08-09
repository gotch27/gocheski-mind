import "server-only";

import { createNeonAuth } from "@neondatabase/auth/next/server";
import { isMindAdminEmail } from "@/lib/admin-users";
import { adminUserService } from "@/nextsignal/services/admin-users";

const missingAuthUrl = "https://configure-neon-auth.invalid";
const missingCookieSecret = "configure-neon-auth-cookie-secret-before-deploying";

export type MindUser = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  isAdmin: boolean;
};

type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  banned?: boolean | null;
};

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL ?? missingAuthUrl,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET ?? missingCookieSecret,
    sameSite: "lax"
  }
});

export function isNeonAuthConfigured() {
  return Boolean(process.env.NEON_AUTH_BASE_URL && process.env.NEON_AUTH_COOKIE_SECRET);
}

export async function getMindUser(): Promise<MindUser | null> {
  if (!isNeonAuthConfigured()) return null;

  const { data: session } = await auth.getSession();
  const user = session?.user;
  if (!user) return null;
  return resolveMindUser(user);
}

export async function resolveMindUser(user: AuthenticatedUser): Promise<MindUser | null> {
  const access = await adminUserService.find(user.id);
  if (user.banned || access?.blocked) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    isAdmin: isMindAdminEmail(user.email)
  };
}
