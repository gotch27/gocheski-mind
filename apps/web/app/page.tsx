import { isAllowedEmail, isNeonAuthConfigured } from "@/app/lib/mind-auth";
import { getLoggedMindSession } from "@/app/lib/logged-auth";
import { MindApp } from "@/components/mind-app";
import { AuthUnavailable, MindAccessDenied } from "@/components/mind-login";
import { MindLanding } from "@/components/mind-landing";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!isNeonAuthConfigured()) return <AuthUnavailable />;

  const { data: session } = await getLoggedMindSession();
  const user = session?.user;
  if (!user) return <MindLanding />;
  if (!isAllowedEmail(user.email)) return <MindAccessDenied email={user.email} />;

  return <MindApp user={{ id: user.id, name: user.name, email: user.email }} />;
}
