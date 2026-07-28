import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { requireAuthEnvironment } from "@/nextsignal/config";

export const sessionCookieName = "goch_admin_session";
const maxAgeSeconds = 60 * 60 * 24 * 7;

export function createSessionCookie() {
  const issuedAt = Date.now().toString();
  const signature = sign(issuedAt);

  return [
    `${sessionCookieName}=${issuedAt}.${signature}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    secureCookiePart(),
    `Max-Age=${maxAgeSeconds}`
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearSessionCookie() {
  return [
    `${sessionCookieName}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    secureCookiePart(),
    "Max-Age=0"
  ]
    .filter(Boolean)
    .join("; ");
}

export function isAuthenticatedRequest(request: Request) {
  return isValidSessionCookie(readSessionCookie(request.headers.get("cookie")));
}

export function readSessionCookie(cookieHeader: string | null | undefined) {
  if (!cookieHeader) return undefined;

  for (const part of cookieHeader.split(";")) {
    const cookie = part.trim();
    const separator = cookie.indexOf("=");
    if (separator < 1) continue;
    if (cookie.slice(0, separator) === sessionCookieName) {
      return cookie.slice(separator + 1);
    }
  }

  return undefined;
}

export function isValidSessionCookie(value: string | undefined) {
  if (!value) return false;

  const [issuedAt, signature] = value.split(".");
  if (!issuedAt || !signature || !safeEqual(signature, sign(issuedAt))) return false;

  const age = Date.now() - Number(issuedAt);
  return Number.isFinite(age) && age >= 0 && age <= maxAgeSeconds * 1000;
}

export function isValidAdminToken(token: unknown) {
  return typeof token === "string" && safeEqual(token, requireAuthEnvironment("ADMIN_TOKEN"));
}

function safeEqual(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function sign(value: string) {
  return createHmac("sha256", requireAuthEnvironment("SESSION_SECRET")).update(value).digest("hex");
}

function secureCookiePart() {
  return process.env.VERCEL ? "Secure" : "";
}
