import { notFound } from "next/navigation";
import { getMindUser, isNeonAuthConfigured } from "@/app/lib/mind-auth";
import { AdminUsers } from "@/components/admin-users";
import { AuthUnavailable, MindLogin } from "@/components/mind-login";
import { adminUserService } from "@/nextsignal/services/admin-users";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isNeonAuthConfigured()) return <AuthUnavailable />;

  const user = await getMindUser();
  if (!user) return <MindLogin callbackPath="/admin" />;
  if (!user.isAdmin) notFound();

  const users = await adminUserService.list();
  return <AdminUsers initialItems={users} currentUserId={user.id} />;
}
