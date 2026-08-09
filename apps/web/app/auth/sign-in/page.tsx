import { redirect } from "next/navigation";
import { getMindUser } from "@/app/lib/mind-auth";
import { MindLogin } from "@/components/mind-login";
import { withBasePath } from "@/lib/base-path";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const user = await getMindUser();
  if (user) {
    redirect(withBasePath("/"));
  }

  return <MindLogin />;
}
