import {
  apiProcess,
  forwardFault,
  validateWith,
  value
} from "@gotch/nextsignal";
import type {
  ExtensionCaptureAnnotationInput,
  ExtensionCaptureAnnotationResponse,
  ExtensionCaptureInput,
  ExtensionCaptureResponse
} from "@gocheski-mind/contracts";
import { extensionOwnerId, extensionTokenId, requireExtensionToken } from "@/nextsignal/auth/extension";
import type {
  OwnedExtensionCaptureAnnotationInput,
  OwnedExtensionCaptureInput
} from "@/nextsignal/processes/business/extension-captures";
import { extensionCaptureAnnotationSchema, extensionCaptureSchema } from "@/nextsignal/schemas";
import type { AppServices } from "@/nextsignal/services";
import { loggedSystemFail } from "@/nextsignal/logging";

export const captureFromExtensionApi = apiProcess<
  ExtensionCaptureInput,
  ExtensionCaptureResponse,
  AppServices
>({
  name: "extension.capture",
  metadata: {
    description: "Captures a page, link, selection, or image from the private Chrome extension.",
    tags: ["extension", "inspirations", "api"],
    owner: "mind",
    version: "0.1.0"
  },
  auth: requireExtensionToken(),
  validate: validateWith(extensionCaptureSchema),
  async handle(ctx, input) {
    const result = await ctx.mediator.dispatch<OwnedExtensionCaptureInput, ExtensionCaptureResponse>(
      "extension.captureBusiness",
      { ownerId: extensionOwnerId(ctx), extensionTokenId: extensionTokenId(ctx), capture: input }
    );
    if (!result.ok) return forwardFault(result);
    if (!result.data) return loggedSystemFail(ctx, new Error("Extension capture returned no inspiration."));
    return value(result.data);
  }
});

export const annotateExtensionCaptureApi = apiProcess<
  ExtensionCaptureAnnotationInput,
  ExtensionCaptureAnnotationResponse,
  AppServices
>({
  name: "extension.annotateCapture",
  metadata: {
    description: "Adds a personal note or labels to a recent extension capture.",
    tags: ["extension", "inspirations", "api"],
    owner: "mind",
    version: "0.1.0"
  },
  auth: requireExtensionToken(),
  validate: validateWith(extensionCaptureAnnotationSchema),
  async handle(ctx, input) {
    const result = await ctx.mediator.dispatch<
      OwnedExtensionCaptureAnnotationInput,
      ExtensionCaptureAnnotationResponse
    >(
      "extension.annotateCaptureBusiness",
      { ownerId: extensionOwnerId(ctx), extensionTokenId: extensionTokenId(ctx), annotation: input }
    );
    if (!result.ok) return forwardFault(result);
    if (!result.data) return loggedSystemFail(ctx, new Error("Extension annotation returned no inspiration."));
    return value(result.data);
  }
});
