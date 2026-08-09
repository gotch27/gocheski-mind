import { isNeonAuthConfigured, resolveMindUser } from "@/app/lib/mind-auth";
import { getLoggedMindSession } from "@/app/lib/logged-auth";
import { MindApp } from "@/components/mind-app";
import { AuthUnavailable, MindAccessBlocked } from "@/components/mind-login";
import { MindLanding } from "@/components/mind-landing";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!isNeonAuthConfigured()) return <AuthUnavailable />;

  const { data: session } = await getLoggedMindSession();
  const user = session?.user;
  if (!user) return <MindLanding />;
  const mindUser = await resolveMindUser(user);
  if (!mindUser) return <MindAccessBlocked email={user.email} />;

  return <MindApp user={mindUser} />;
}
