import { businessProcess, notFound, ok, validateWith, value, type ProcessContext } from "@gotch/nextsignal";
import type {
  CreateInspirationInput,
  Inspiration,
  InspirationListInput,
  UpdateInspirationInput
} from "@/lib/inspirations";
import {
  createInspirationSchema,
  inspirationIdSchema,
  listInspirationsSchema,
  updateInspirationSchema,
  type InspirationIdInput
} from "@/nextsignal/schemas";
import type { AppServices } from "@/nextsignal/services";
import type { CreateInspirationRecordResult } from "@/nextsignal/services/inspirations";

export const listInspirationsBusiness = businessProcess<InspirationListInput, Inspiration[], AppServices>({
  name: "inspirations.listBusiness",
  metadata: {
    description: "Lists and searches saved inspirations.",
    tags: ["inspirations"],
    owner: "mind",
    version: "0.1.0"
  },
  auth: () => ok(),
  validate: validateWith(listInspirationsSchema),
  async handle(ctx, input) {
    return value(await ctx.services.inspirations.list(input));
  }
});

export const createInspirationBusiness = businessProcess<
  CreateInspirationInput,
  CreateInspirationRecordResult,
  AppServices
>({
  name: "inspirations.createBusiness",
  metadata: {
    description: "Creates an inspiration and enriches link metadata when possible.",
    tags: ["inspirations"],
    owner: "mind",
    version: "0.1.0"
  },
  auth: () => ok(),
  validate: validateWith(createInspirationSchema),
  handle: createInspirationHandle
});

async function createInspirationHandle(
  ctx: ProcessContext<AppServices>,
  input: CreateInspirationInput
) {
  let enriched = input;

  if (input.kind === "link" && input.sourceUrl) {
    try {
      const metadata = await ctx.services.linkMetadata.fetch(input.sourceUrl);
      enriched = {
        ...input,
        title: input.title || metadata.title,
        sourceUrl: metadata.canonicalUrl,
        imageUrl: metadata.imageUrl,
        metadata: { ...metadata.metadata, ...input.metadata }
      };
    } catch (error) {
      await ctx.logger.warn({
        message: "Link metadata enrichment failed; saving the original URL.",
        process: ctx.metadata.processName,
        correlationId: ctx.metadata.correlationId,
        data: { reason: error instanceof Error ? error.message : "Unknown error" }
      });
    }
  }

  return value(await ctx.services.inspirations.create(enriched));
}

export const updateInspirationBusiness = businessProcess<UpdateInspirationInput, Inspiration, AppServices>({
  name: "inspirations.updateBusiness",
  metadata: {
    description: "Updates an inspiration's details, tags, or favorite state.",
    tags: ["inspirations"],
    owner: "mind",
    version: "0.1.0"
  },
  auth: () => ok(),
  validate: validateWith(updateInspirationSchema),
  async handle(ctx, input) {
    const updated = await ctx.services.inspirations.update(input);
    return updated ? value(updated) : notFound("Inspiration not found.");
  }
});

export const deleteInspirationBusiness = businessProcess<InspirationIdInput, { id: string }, AppServices>({
  name: "inspirations.deleteBusiness",
  metadata: {
    description: "Deletes an inspiration and its owned Blob asset.",
    tags: ["inspirations"],
    owner: "mind",
    version: "0.1.0"
  },
  auth: () => ok(),
  validate: validateWith(inspirationIdSchema),
  async handle(ctx, input) {
    const deleted = await ctx.services.inspirations.delete(input.id);
    if (!deleted) return notFound("Inspiration not found.");

    if (deleted.blobPathname && deleted.imageUrl) {
      try {
        await ctx.services.blob.remove(deleted.imageUrl);
      } catch (error) {
        await ctx.logger.warn({
          message: "The inspiration was deleted, but its Blob asset could not be removed.",
          process: ctx.metadata.processName,
          correlationId: ctx.metadata.correlationId,
          data: { reason: error instanceof Error ? error.message : "Unknown error" }
        });
      }
    }

    return value({ id: input.id });
  }
});
