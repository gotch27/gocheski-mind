import {
  apiProcess,
  forwardFault,
  requireUser,
  validateWith,
  value
} from "@gotch/nextsignal";
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
import { loggedSystemFail } from "@/nextsignal/logging";

type ListInspirationsTransportInput = Omit<InspirationListInput, "favorite" | "limit"> & {
  favorite?: boolean | "true" | "false";
  limit?: number | string;
};

export const listInspirationsApi = apiProcess<
  ListInspirationsTransportInput,
  { items: Inspiration[]; labels: string[] },
  AppServices
>({
  name: "inspirations.list",
  metadata: {
    description: "Returns the private inspiration board.",
    tags: ["inspirations", "api"],
    owner: "mind",
    version: "0.1.0"
  },
  auth: requireUser(),
  validate: validateWith(listInspirationsSchema),
  async handle(ctx, input) {
    const normalized: InspirationListInput = {
      query: input.query,
      kind: input.kind,
      favorite: input.favorite === undefined ? undefined : input.favorite === true || input.favorite === "true",
      tag: input.tag,
      limit: input.limit === undefined ? 80 : Number(input.limit)
    };
    const [itemsResult, labelsResult] = await Promise.all([
      ctx.mediator.dispatch<InspirationListInput, Inspiration[]>("inspirations.listBusiness", normalized),
      ctx.mediator.dispatch<Record<string, never>, string[]>("inspirations.listLabelsBusiness", {})
    ]);
    if (!itemsResult.ok) return forwardFault(itemsResult);
    if (!labelsResult.ok) return forwardFault(labelsResult);
    return value({ items: itemsResult.data ?? [], labels: labelsResult.data ?? [] });
  }
});

export const createInspirationApi = apiProcess<
  CreateInspirationInput,
  CreateInspirationRecordResult,
  AppServices
>({
  name: "inspirations.create",
  metadata: {
    description: "Captures a new inspiration.",
    tags: ["inspirations", "api"],
    owner: "mind",
    version: "0.1.0"
  },
  auth: requireUser(),
  validate: validateWith(createInspirationSchema),
  async handle(ctx, input) {
    const result = await ctx.mediator.dispatch<CreateInspirationInput, CreateInspirationRecordResult>(
      "inspirations.createBusiness",
      input
    );
    if (!result.ok) return forwardFault(result);
    if (!result.data) return loggedSystemFail(ctx, new Error("Create process returned no inspiration."));
    return value(result.data);
  }
});

export const updateInspirationApi = apiProcess<UpdateInspirationInput, { inspiration: Inspiration }, AppServices>({
  name: "inspirations.update",
  metadata: {
    description: "Updates a saved inspiration.",
    tags: ["inspirations", "api"],
    owner: "mind",
    version: "0.1.0"
  },
  auth: requireUser(),
  validate: validateWith(updateInspirationSchema),
  async handle(ctx, input) {
    const result = await ctx.mediator.dispatch<UpdateInspirationInput, Inspiration>(
      "inspirations.updateBusiness",
      input
    );
    if (!result.ok) return forwardFault(result);
    if (!result.data) return loggedSystemFail(ctx, new Error("Update process returned no inspiration."));
    return value({ inspiration: result.data });
  }
});

export const deleteInspirationApi = apiProcess<InspirationIdInput, { id: string }, AppServices>({
  name: "inspirations.delete",
  metadata: {
    description: "Deletes a saved inspiration.",
    tags: ["inspirations", "api"],
    owner: "mind",
    version: "0.1.0"
  },
  auth: requireUser(),
  validate: validateWith(inspirationIdSchema),
  async handle(ctx, input) {
    const result = await ctx.mediator.dispatch<InspirationIdInput, { id: string }>(
      "inspirations.deleteBusiness",
      input
    );
    if (!result.ok) return forwardFault(result);
    if (!result.data) return loggedSystemFail(ctx, new Error("Delete process returned no identifier."));
    return value(result.data);
  }
});
