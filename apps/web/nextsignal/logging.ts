import { systemFail, type ProcessContext } from "@gotch/nextsignal";

export async function loggedSystemFail(ctx: ProcessContext, error: unknown) {
  await ctx.logger.error({
    message: error instanceof Error ? error.message : "Unexpected system failure.",
    process: ctx.metadata.processName,
    correlationId: ctx.metadata.correlationId,
    error
  });
  return systemFail(error);
}
