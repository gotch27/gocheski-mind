import { createNextSignalApp, createSchemaValidationAdapter } from "@gotch/nextsignal";
import { config } from "@/nextsignal/config";
import { mindAuthAdapter } from "@/nextsignal/adapters/auth";
import { processes } from "@/nextsignal/processes";
import { services } from "@/nextsignal/services";

export const app = createNextSignalApp({
  processes,
  services,
  config,
  adapters: {
    auth: mindAuthAdapter,
    validation: createSchemaValidationAdapter()
  }
});
