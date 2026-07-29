import { businessProcess, forwardFault, ok, systemFail, validateWith, value } from "@gotch/nextsignal";
import type { ExtensionCaptureInput } from "@gocheski-mind/contracts";
import type { CreateInspirationInput } from "@/lib/inspirations";
import { extensionCaptureSchema } from "@/nextsignal/schemas";
import type { AppServices } from "@/nextsignal/services";
import type { CreateInspirationRecordResult } from "@/nextsignal/services/inspirations";

export const captureFromExtensionBusiness = businessProcess<
  ExtensionCaptureInput,
  CreateInspirationRecordResult,
  AppServices
>({
  name: "extension.captureBusiness",
  metadata: {
    description: "Maps a browser capture to an inspiration and owns remote image persistence.",
    tags: ["extension", "inspirations"],
    owner: "mind",
    version: "0.1.0"
  },
  auth: () => ok(),
  validate: validateWith(extensionCaptureSchema),
  async handle(ctx, input) {
    const createInput = await toCreateInput(ctx.services, input);
    const result = await ctx.mediator.dispatch<CreateInspirationInput, CreateInspirationRecordResult>(
      "inspirations.createBusiness",
      createInput
    );
    if (!result.ok) return forwardFault(result);
    if (!result.data) return systemFail(new Error("Create process returned no extension inspiration."));
    return value(result.data);
  }
});

async function toCreateInput(services: AppServices, input: ExtensionCaptureInput): Promise<CreateInspirationInput> {
  const title = cleanOptional(input.pageTitle);
  const tags = input.tags ?? [];

  switch (input.type) {
    case "page":
      return { kind: "link", sourceUrl: input.pageUrl, title, tags };
    case "link":
      return { kind: "link", sourceUrl: input.targetUrl!, tags };
    case "selection":
      return { kind: "quote", sourceUrl: input.pageUrl, title, content: input.text!, tags };
    case "image": {
      const image = await services.blob.copyRemoteImage(input.targetUrl!);
      return {
        kind: "image",
        sourceUrl: input.pageUrl,
        title,
        imageUrl: image.url,
        blobPathname: image.pathname,
        mimeType: image.contentType,
        tags
      };
    }
  }
}

function cleanOptional(value: string | undefined) {
  return value?.trim() || undefined;
}
