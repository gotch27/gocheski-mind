import { isNeonAuthConfigured, resolveMindUser } from "@/app/lib/mind-auth";
import { getLoggedMindSession } from "@/app/lib/logged-auth";
import { ExtensionConnect } from "@/components/extension-connect";
import { AuthUnavailable, MindAccessBlocked, MindLogin } from "@/components/mind-login";

export const dynamic = "force-dynamic";

export default async function ExtensionConnectPage() {
  if (!isNeonAuthConfigured()) return <AuthUnavailable />;

  const { data: session } = await getLoggedMindSession();
  const user = session?.user;
  if (!user) return <MindLogin callbackPath="/extension/connect" />;
  const mindUser = await resolveMindUser(user);
  if (!mindUser) return <MindAccessBlocked email={user.email} />;

  return <ExtensionConnect email={user.email} />;
}
