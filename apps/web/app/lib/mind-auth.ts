import "server-only";

import { createNeonAuth } from "@neondatabase/auth/next/server";

const missingAuthUrl = "https://configure-neon-auth.invalid";
const missingCookieSecret = "configure-neon-auth-cookie-secret-before-deploying";

export type MindUser = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
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
  if (!user || !isAllowedEmail(user.email)) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image
  };
}

export function isAllowedEmail(email: string) {
  const allowed = allowedEmails();
  return allowed.size === 0 || allowed.has(email.trim().toLowerCase());
}

function allowedEmails() {
  return new Set(
    (process.env.MIND_ALLOWED_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}
