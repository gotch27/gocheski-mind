import { createNextSignalApp, createSchemaValidationAdapter } from "@gotch/nextsignal";
import { config } from "@/nextsignal/config";
import { mindAuthAdapter } from "@/nextsignal/adapters/auth";
import { loggerAdapter } from "@/nextsignal/adapters/logger";
import { processes } from "@/nextsignal/processes";
import { services } from "@/nextsignal/services";

export const app = createNextSignalApp({
  processes,
  services,
  config,
  adapters: {
    auth: mindAuthAdapter,
    logger: loggerAdapter,
    validation: createSchemaValidationAdapter()
  }
});
