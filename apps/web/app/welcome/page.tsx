import { isNeonAuthConfigured } from "@/app/lib/mind-auth";
import { getLoggedMindSession } from "@/app/lib/logged-auth";
import { MindLanding } from "@/components/mind-landing";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  if (!isNeonAuthConfigured()) return <MindLanding />;
  const { data: session } = await getLoggedMindSession();
  return <MindLanding signedIn={Boolean(session?.user)} />;
}
