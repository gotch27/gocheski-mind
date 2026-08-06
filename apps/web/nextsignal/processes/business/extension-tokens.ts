import { businessProcess, notFound, requireUser, validateWith, value, type ProcessContext } from "@gotch/nextsignal";
import type { MindUser } from "@/app/lib/mind-auth";
import type { CreatedExtensionToken, ExtensionToken } from "@/lib/extension-tokens";
import {
  createExtensionTokenSchema,
  extensionTokenIdSchema,
  type CreateExtensionTokenInput,
  type ExtensionTokenIdInput
} from "@/nextsignal/schemas";
import type { AppServices } from "@/nextsignal/services";

export const listExtensionTokensBusiness = businessProcess<Record<string, never>, ExtensionToken[], AppServices>({
  name: "extensionTokens.listBusiness",
  metadata: {
    description: "Lists active capture tokens for the authenticated user.",
    tags: ["extension", "tokens"],
    owner: "mind",
    version: "0.1.0"
  },
  auth: requireUser(),
  validate: () => value(undefined),
  async handle(ctx) {
    return value(await ctx.services.extensionTokens.list(await currentOwnerId(ctx)));
  }
});

export const createExtensionTokenBusiness = businessProcess<
  CreateExtensionTokenInput,
  CreatedExtensionToken,
  AppServices
>({
  name: "extensionTokens.createBusiness",
  metadata: {
    description: "Creates a one-time visible capture token for the authenticated user.",
    tags: ["extension", "tokens"],
    owner: "mind",
    version: "0.1.0"
  },
  auth: requireUser(),
  validate: validateWith(createExtensionTokenSchema),
  async handle(ctx, input) {
    return value(await ctx.services.extensionTokens.create(await currentOwnerId(ctx), input.name));
  }
});

export const revokeExtensionTokenBusiness = businessProcess<ExtensionTokenIdInput, { id: string }, AppServices>({
  name: "extensionTokens.revokeBusiness",
  metadata: {
    description: "Revokes one of the authenticated user's capture tokens.",
    tags: ["extension", "tokens"],
    owner: "mind",
    version: "0.1.0"
  },
  auth: requireUser(),
  validate: validateWith(extensionTokenIdSchema),
  async handle(ctx, input) {
    const revoked = await ctx.services.extensionTokens.revoke(await currentOwnerId(ctx), input.id);
    return revoked ? value(revoked) : notFound("Extension token not found.");
  }
});

async function currentOwnerId(ctx: ProcessContext<AppServices>) {
  const user = await ctx.auth.currentUser?.(ctx) as MindUser | null | undefined;
  if (!user) throw new Error("Authenticated user was unavailable.");
  return user.id;
}
