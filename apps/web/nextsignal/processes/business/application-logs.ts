import { businessProcess, ok, validateWith, value } from "@gotch/nextsignal";
import type { ExtensionErrorReport } from "@gocheski-mind/contracts";
import { extensionErrorReportSchema } from "@/nextsignal/schemas";
import type { AppServices } from "@/nextsignal/services";

export type OwnedExtensionErrorReport = ExtensionErrorReport & { ownerId: string };

export const recordExtensionErrorBusiness = businessProcess<OwnedExtensionErrorReport, { id: string }, AppServices>({
  name: "logs.recordExtensionErrorBusiness",
  metadata: {
    description: "Persists a sanitized browser or extension error for an authenticated owner.",
    tags: ["logs"],
    owner: "mind",
    version: "0.1.0"
  },
  auth: () => ok(),
  validate: (ctx, input) => ctx.validate(extensionErrorReportSchema, input),
  async handle(ctx, input) {
    const error = new Error(input.message);
    error.name = "ExtensionError";
    if (input.stack) error.stack = input.stack;
    const created = await ctx.services.applicationLogs.record({
      level: "error",
      source: input.source,
      message: input.message,
      ownerId: input.ownerId,
      error,
      context: input.context
    });
    return value(created);
  }
});
