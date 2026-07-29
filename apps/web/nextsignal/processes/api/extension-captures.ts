import {
  apiProcess,
  forwardFault,
  systemFail,
  validateWith,
  value
} from "@gotch/nextsignal";
import type { ExtensionCaptureInput } from "@gocheski-mind/contracts";
import { requireExtensionToken } from "@/nextsignal/auth/extension";
import { extensionCaptureSchema } from "@/nextsignal/schemas";
import type { AppServices } from "@/nextsignal/services";
import type { CreateInspirationRecordResult } from "@/nextsignal/services/inspirations";

export const captureFromExtensionApi = apiProcess<
  ExtensionCaptureInput,
  CreateInspirationRecordResult,
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
    const result = await ctx.mediator.dispatch<ExtensionCaptureInput, CreateInspirationRecordResult>(
      "extension.captureBusiness",
      input
    );
    if (!result.ok) return forwardFault(result);
    if (!result.data) return systemFail(new Error("Extension capture returned no inspiration."));
    return value(result.data);
  }
});
