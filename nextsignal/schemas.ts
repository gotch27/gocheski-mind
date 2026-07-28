import { z } from "zod";
import { inspirationKinds } from "@/lib/inspirations";

const optionalShortText = z.string().trim().max(240).optional();
const optionalLongText = z.string().trim().max(20_000).optional();
const optionalUrl = z.string().trim().url().max(2_000).optional();
const tagsSchema = z.array(z.string().trim().min(1).max(40)).max(12).optional();

export const createInspirationSchema = z
  .object({
    kind: z.enum(inspirationKinds),
    title: optionalShortText,
    content: optionalLongText,
    sourceUrl: optionalUrl,
    imageUrl: optionalUrl,
    blobPathname: z.string().trim().max(1_000).optional(),
    mimeType: z.string().trim().max(120).optional(),
    note: z.string().trim().max(4_000).optional(),
    tags: tagsSchema,
    metadata: z
      .object({
        description: z.string().trim().max(600).optional(),
        faviconUrl: optionalUrl,
        siteName: z.string().trim().max(160).optional(),
        width: z.number().int().positive().max(20_000).optional(),
        height: z.number().int().positive().max(20_000).optional()
      })
      .optional()
  })
  .superRefine((input, context) => {
    if (input.kind === "link" && !input.sourceUrl) {
      context.addIssue({ code: "custom", message: "A link needs a source URL.", path: ["sourceUrl"] });
    }
    if (input.kind === "image" && !input.imageUrl) {
      context.addIssue({ code: "custom", message: "An image needs an uploaded image URL.", path: ["imageUrl"] });
    }
    if ((input.kind === "note" || input.kind === "quote") && !input.content && !input.title) {
      context.addIssue({ code: "custom", message: "Write something before saving.", path: ["content"] });
    }
  });

export const listInspirationsSchema = z.object({
  query: z.string().trim().max(160).optional(),
  kind: z.enum(inspirationKinds).optional(),
  favorite: z.union([z.boolean(), z.enum(["true", "false"])]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(80)
});

export const updateInspirationSchema = z
  .object({
    id: z.uuid(),
    title: optionalShortText,
    content: optionalLongText,
    sourceUrl: optionalUrl,
    note: z.string().trim().max(4_000).optional(),
    tags: tagsSchema,
    favorite: z.boolean().optional()
  })
  .refine((input) => Object.keys(input).some((key) => key !== "id"), {
    message: "Provide at least one field to update."
  });

export const inspirationIdSchema = z.object({ id: z.uuid() });

export type InspirationIdInput = z.infer<typeof inspirationIdSchema>;
