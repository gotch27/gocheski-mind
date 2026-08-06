import { authFail, ok, type AuthHook, type ProcessContext } from "@gotch/nextsignal";
import type { AppServices } from "@/nextsignal/services";

const owners = new WeakMap<object, string>();

export function requireExtensionToken(): AuthHook<AppServices> {
  return async (ctx) => {
    const authorization = ctx.request?.headers.authorization;
    const match = authorization?.match(/^Bearer\s+(.+)$/i);
    if (!match) return authFail("A valid extension token is required.");

    const authenticated = await ctx.services.extensionTokens.authenticate(match[1]);
    if (!authenticated) return authFail("A valid extension token is required.");
    owners.set(ctx, authenticated.ownerId);
    return ok();
  };
}

export function extensionOwnerId(ctx: ProcessContext<AppServices>) {
  const ownerId = owners.get(ctx);
  if (!ownerId) throw new Error("The authenticated extension owner was unavailable.");
  return ownerId;
}
