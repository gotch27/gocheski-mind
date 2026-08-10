import { authFail, ok, type AuthHook, type ProcessContext } from "@gotch/nextsignal";
import type { AppServices } from "@/nextsignal/services";

type ExtensionIdentity = {
  ownerId: string;
  tokenId: string;
};

const identities = new WeakMap<object, ExtensionIdentity>();

export function requireExtensionToken(): AuthHook<AppServices> {
  return async (ctx) => {
    const authorization = ctx.request?.headers.authorization;
    const match = authorization?.match(/^Bearer\s+(.+)$/i);
    if (!match) return authFail("A valid extension token is required.");

    const authenticated = await ctx.services.extensionTokens.authenticate(match[1]);
    if (!authenticated) return authFail("A valid extension token is required.");
    identities.set(ctx, authenticated);
    return ok();
  };
}

export function extensionOwnerId(ctx: ProcessContext<AppServices>) {
  const identity = identities.get(ctx);
  if (!identity) throw new Error("The authenticated extension identity was unavailable.");
  return identity.ownerId;
}

export function extensionTokenId(ctx: ProcessContext<AppServices>) {
  const identity = identities.get(ctx);
  if (!identity) throw new Error("The authenticated extension identity was unavailable.");
  return identity.tokenId;
}
