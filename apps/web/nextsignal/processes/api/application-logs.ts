import { apiProcess, forwardFault, validateWith, value, type ProcessContext } from "@gotch/nextsignal";
import type { ExtensionErrorReport } from "@gocheski-mind/contracts";
import { extensionOwnerId, requireExtensionToken } from "@/nextsignal/auth/extension";
import type { OwnedExtensionErrorReport } from "@/nextsignal/processes/business/application-logs";
import { extensionErrorReportSchema } from "@/nextsignal/schemas";
import type { AppServices } from "@/nextsignal/services";
import { loggedSystemFail } from "@/nextsignal/logging";

export const reportExtensionErrorApi = apiProcess<ExtensionErrorReport, { id: string }, AppServices>({
  name: "extension.reportError",
  metadata: { description: "Records an authenticated Chrome extension error.", tags: ["logs", "extension", "api"] },
  auth: requireExtensionToken(),
  validate: validateWith(extensionErrorReportSchema),
  async handle(ctx, input) {
    return dispatchReport(ctx, { ...input, ownerId: extensionOwnerId(ctx) });
  }
});

async function dispatchReport(ctx: ProcessContext<AppServices>, input: OwnedExtensionErrorReport) {
  const result = await ctx.mediator.dispatch<OwnedExtensionErrorReport, { id: string }>(
    "logs.recordExtensionErrorBusiness",
    input
  );
  if (!result.ok) return forwardFault(result);
  if (!result.data) {
    return loggedSystemFail(ctx, new Error("Extension error logging returned no identifier."));
  }
  return value(result.data);
}
