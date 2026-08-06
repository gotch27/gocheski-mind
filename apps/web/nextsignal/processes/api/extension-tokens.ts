import { apiProcess, forwardFault, requireUser, systemFail, validateWith, value } from "@gotch/nextsignal";
import type { CreatedExtensionToken, ExtensionToken } from "@/lib/extension-tokens";
import {
  createExtensionTokenSchema,
  extensionTokenIdSchema,
  type CreateExtensionTokenInput,
  type ExtensionTokenIdInput
} from "@/nextsignal/schemas";
import type { AppServices } from "@/nextsignal/services";

export const listExtensionTokensApi = apiProcess<Record<string, never>, { items: ExtensionToken[] }, AppServices>({
  name: "extensionTokens.list",
  metadata: { description: "Lists the current user's extension tokens.", tags: ["extension", "tokens", "api"] },
  auth: requireUser(),
  validate: () => value(undefined),
  async handle(ctx) {
    const result = await ctx.mediator.dispatch<Record<string, never>, ExtensionToken[]>(
      "extensionTokens.listBusiness",
      {}
    );
    if (!result.ok) return forwardFault(result);
    return value({ items: result.data ?? [] });
  }
});

export const createExtensionTokenApi = apiProcess<
  CreateExtensionTokenInput,
  { item: CreatedExtensionToken },
  AppServices
>({
  name: "extensionTokens.create",
  metadata: { description: "Creates an extension token.", tags: ["extension", "tokens", "api"] },
  auth: requireUser(),
  validate: validateWith(createExtensionTokenSchema),
  async handle(ctx, input) {
    const result = await ctx.mediator.dispatch<CreateExtensionTokenInput, CreatedExtensionToken>(
      "extensionTokens.createBusiness",
      input
    );
    if (!result.ok) return forwardFault(result);
    if (!result.data) return systemFail(new Error("Token creation returned no token."));
    return value({ item: result.data });
  }
});

export const revokeExtensionTokenApi = apiProcess<ExtensionTokenIdInput, { id: string }, AppServices>({
  name: "extensionTokens.revoke",
  metadata: { description: "Revokes an extension token.", tags: ["extension", "tokens", "api"] },
  auth: requireUser(),
  validate: validateWith(extensionTokenIdSchema),
  async handle(ctx, input) {
    const result = await ctx.mediator.dispatch<ExtensionTokenIdInput, { id: string }>(
      "extensionTokens.revokeBusiness",
      input
    );
    if (!result.ok) return forwardFault(result);
    if (!result.data) return systemFail(new Error("Token revocation returned no identifier."));
    return value(result.data);
  }
});
