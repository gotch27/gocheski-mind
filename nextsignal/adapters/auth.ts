import { authFail, forbidden, type AuthAdapter, type ProcessContext, value } from "@gotch/nextsignal";

export type DevUserRole = "user" | "manager" | "admin";

export type DevUser = {
  id: string;
  name: string;
  role: DevUserRole;
};

// Development auth adapter.
//
// It reads headers populated by createNextRoute through `ctx.request`.
// This keeps auth data out of process input, so validation schemas can stay
// focused on business input instead of transport details.
//
// Replace this with your real provider:
// - session lookup
// - JWT verification
// - OAuth provider
// - database-backed user lookup
export const authAdapter: AuthAdapter<DevUser> = {
  currentUser(ctx) {
    const headers = ctx.request?.headers ?? {};
    const id = headers["x-nextsignal-user-id"];
    if (!id) return null;

    return {
      id,
      name: headers["x-nextsignal-user-name"] ?? "Dev User",
      role: parseRole(headers["x-nextsignal-role"])
    };
  },
  async requireUser(ctx) {
    const user = await this.currentUser?.(ctx);
    return user ? value(user) : authFail("Send x-nextsignal-user-id to act as a dev user.");
  },
  async hasRole(ctx, role) {
    const user = await this.currentUser?.(ctx);
    if (!user) return false;
    if (user.role === "admin") return true;
    return user.role === role;
  }
};

export function requireDevRole(role: DevUserRole) {
  return async function requireDevRoleHook(ctx: ProcessContext) {
    const user = await authAdapter.currentUser?.(ctx);
    if (!user) return authFail("Authentication required.");
    if (user.role === "admin" || user.role === role) return value(user);
    return forbidden(`Required role missing: ${role}.`);
  };
}

function parseRole(value: string | undefined): DevUserRole {
  return value === "manager" || value === "admin" ? value : "user";
}
