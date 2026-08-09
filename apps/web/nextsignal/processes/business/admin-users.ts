import {
  businessProcess,
  forbidden,
  notFound,
  requireUser,
  validateWith,
  value,
  type ProcessContext
} from "@gotch/nextsignal";
import type { MindUser } from "@/app/lib/mind-auth";
import type { AdminUser } from "@/lib/admin-users";
import { isMindAdminEmail } from "@/lib/admin-users";
import { setUserBlockedSchema, type SetUserBlockedInput } from "@/nextsignal/schemas";
import type { AppServices } from "@/nextsignal/services";

export const listAdminUsersBusiness = businessProcess<Record<string, never>, AdminUser[], AppServices>({
  name: "adminUsers.listBusiness",
  metadata: {
    description: "Lists Neon Auth users for the Mind administrator.",
    tags: ["admin", "users"],
    owner: "mind",
    version: "0.1.0"
  },
  auth: requireUser(),
  validate: () => value(undefined),
  async handle(ctx) {
    const user = await currentUser(ctx);
    if (!user || !isMindAdminEmail(user.email)) return forbidden("Administrator access required.");
    return value(await ctx.services.adminUsers.list());
  }
});

export const setAdminUserBlockedBusiness = businessProcess<SetUserBlockedInput, AdminUser, AppServices>({
  name: "adminUsers.setBlockedBusiness",
  metadata: {
    description: "Blocks or unblocks a Neon Auth user and revokes access when blocked.",
    tags: ["admin", "users"],
    owner: "mind",
    version: "0.1.0"
  },
  auth: requireUser(),
  validate: validateWith(setUserBlockedSchema),
  async handle(ctx, input) {
    const user = await currentUser(ctx);
    if (!user || !isMindAdminEmail(user.email)) return forbidden("Administrator access required.");

    const target = await ctx.services.adminUsers.find(input.id);
    if (!target) return notFound("User not found.");
    if (target.isAdmin) return forbidden("The Mind administrator cannot be blocked.");

    const updated = await ctx.services.adminUsers.setBlocked(input.id, input.blocked);
    return updated ? value(updated) : notFound("User not found.");
  }
});

async function currentUser(ctx: ProcessContext<AppServices>) {
  return await ctx.auth.currentUser?.(ctx) as MindUser | null | undefined;
}
