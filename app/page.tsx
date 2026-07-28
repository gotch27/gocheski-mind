import { cookies } from "next/headers";
import { isValidSessionCookie, sessionCookieName } from "@/app/lib/mind-auth";
import { MindApp } from "@/components/mind-app";
import { MindLogin } from "@/components/mind-login";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(sessionCookieName)?.value;

  return isValidSessionCookie(session) ? <MindApp /> : <MindLogin />;
}
