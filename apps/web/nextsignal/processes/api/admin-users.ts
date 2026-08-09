import { apiProcess, forwardFault, forbidden, requireUser, validateWith, value } from "@gotch/nextsignal";
import type { MindUser } from "@/app/lib/mind-auth";
import type { AdminUser } from "@/lib/admin-users";
import { isMindAdminEmail } from "@/lib/admin-users";
import { setUserBlockedSchema, type SetUserBlockedInput } from "@/nextsignal/schemas";
import type { AppServices } from "@/nextsignal/services";

export const listAdminUsersApi = apiProcess<Record<string, never>, { items: AdminUser[] }, AppServices>({
  name: "adminUsers.list",
  metadata: { description: "Lists Mind users for the administrator.", tags: ["admin", "users", "api"] },
  auth: requireUser(),
  validate: () => value(undefined),
  async handle(ctx) {
    const user = await ctx.auth.currentUser?.(ctx) as MindUser | null | undefined;
    if (!user || !isMindAdminEmail(user.email)) return forbidden("Administrator access required.");

    const result = await ctx.mediator.dispatch<Record<string, never>, AdminUser[]>("adminUsers.listBusiness", {});
    if (!result.ok) return forwardFault(result);
    return value({ items: result.data ?? [] });
  }
});

export const setAdminUserBlockedApi = apiProcess<SetUserBlockedInput, { item: AdminUser }, AppServices>({
  name: "adminUsers.setBlocked",
  metadata: { description: "Blocks or unblocks a Mind user.", tags: ["admin", "users", "api"] },
  auth: requireUser(),
  validate: validateWith(setUserBlockedSchema),
  async handle(ctx, input) {
    const user = await ctx.auth.currentUser?.(ctx) as MindUser | null | undefined;
    if (!user || !isMindAdminEmail(user.email)) return forbidden("Administrator access required.");

    const result = await ctx.mediator.dispatch<SetUserBlockedInput, AdminUser>(
      "adminUsers.setBlockedBusiness",
      input
    );
    if (!result.ok) return forwardFault(result);
    return value({ item: result.data! });
  }
});
