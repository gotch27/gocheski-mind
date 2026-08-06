import { redirect } from "next/navigation";
import { auth, isAllowedEmail } from "@/app/lib/mind-auth";
import { MindLogin } from "@/components/mind-login";
import { withBasePath } from "@/lib/base-path";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const { data: session } = await auth.getSession();
  if (session?.user && isAllowedEmail(session.user.email)) {
    redirect(withBasePath("/"));
  }

  return <MindLogin />;
}
