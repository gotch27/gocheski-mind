import {
  businessProcess,
  forwardFault,
  notFound,
  ok,
  validationFail,
  value
} from "@gotch/nextsignal";
import type {
  ExtensionCaptureAnnotationInput,
  ExtensionCaptureAnnotationResponse,
  ExtensionCaptureInput,
  ExtensionCaptureResponse
} from "@gocheski-mind/contracts";
import { normalizeInspirationTitle, type CreateInspirationInput } from "@/lib/inspirations";
import type { AppServices } from "@/nextsignal/services";
import { createInspirationForOwner } from "@/nextsignal/processes/business/inspirations";
import { loggedSystemFail } from "@/nextsignal/logging";

export type OwnedExtensionCaptureInput = {
  ownerId: string;
  extensionTokenId: string;
  capture: ExtensionCaptureInput;
};

export type OwnedExtensionCaptureAnnotationInput = {
  ownerId: string;
  extensionTokenId: string;
  annotation: ExtensionCaptureAnnotationInput;
};

export const captureFromExtensionBusiness = businessProcess<
  OwnedExtensionCaptureInput,
  ExtensionCaptureResponse,
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
  validate: () => ok(),
  async handle(ctx, input) {
    const createInput = await toCreateInput(ctx.services, input.ownerId, input.capture);
    const result = await createInspirationForOwner(ctx, input.ownerId, createInput);
    if (!result.ok) return forwardFault(result);
    if (!result.data) return loggedSystemFail(ctx, new Error("Create process returned no extension inspiration."));
    let annotationReceipt: string | undefined;
    try {
      annotationReceipt = await ctx.services.extensionCaptureReceipts.create(
        input.ownerId,
        input.extensionTokenId,
        result.data.inspiration.id
      );
    } catch (error) {
      await ctx.logger.warn({
        message: "The extension capture was saved, but its annotation receipt could not be created.",
        process: ctx.metadata.processName,
        correlationId: ctx.metadata.correlationId,
        data: {
          ownerId: input.ownerId,
          inspirationId: result.data.inspiration.id,
          reason: error instanceof Error ? error.message : "Unknown error"
        }
      });
    }
    return value({
      inspiration: {
        id: result.data.inspiration.id,
        kind: result.data.inspiration.kind,
        title: result.data.inspiration.title
      },
      duplicate: result.data.duplicate,
      ...(annotationReceipt ? { annotationReceipt } : {})
    });
  }
});

export const annotateExtensionCaptureBusiness = businessProcess<
  OwnedExtensionCaptureAnnotationInput,
  ExtensionCaptureAnnotationResponse,
  AppServices
>({
  name: "extension.annotateCaptureBusiness",
  metadata: {
    description: "Adds optional notes and labels to a recent browser capture.",
    tags: ["extension", "inspirations"],
    owner: "mind",
    version: "0.1.0"
  },
  auth: () => ok(),
  validate: () => ok(),
  async handle(ctx, input) {
    const receipt = await ctx.services.extensionCaptureReceipts.resolve(
      input.ownerId,
      input.extensionTokenId,
      input.annotation.receipt
    );
    if (!receipt) return notFound("This capture can no longer be annotated.");

    const result = await ctx.services.inspirations.annotateCapture(
      input.ownerId,
      receipt.inspirationId,
      input.annotation
    );
    if (result.status === "notFound") return notFound("The captured inspiration no longer exists.");
    if (result.status === "noteTooLong") {
      return validationFail("This note would make the existing personal note longer than 4,000 characters.");
    }
    return value({
      inspiration: {
        id: result.inspiration.id,
        title: result.inspiration.title
      }
    });
  }
});

async function toCreateInput(
  services: AppServices,
  ownerId: string,
  input: ExtensionCaptureInput
): Promise<CreateInspirationInput> {
  const title = normalizeInspirationTitle(input.pageTitle);
  const tags = input.tags ?? [];

  switch (input.type) {
    case "page":
      return { kind: "link", sourceUrl: input.pageUrl, title, tags };
    case "link":
      return { kind: "link", sourceUrl: input.targetUrl!, tags };
    case "selection":
      return { kind: "quote", sourceUrl: input.pageUrl, title, content: input.text!, tags };
    case "image": {
      const image = await services.blob.copyRemoteImage(ownerId, input.targetUrl!);
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
