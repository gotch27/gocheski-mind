import { loadEnvConfig } from "@next/env";
import {
  createConfig,
  envConfigProvider,
  jsonConfigProvider,
  type ConfigProvider
} from "@gotch/nextsignal";

// Load root .env files for runtimes that do not run inside Next.js, such as
// `npm run worker`, ORM config files, and one-off scripts.
loadEnvConfig(process.cwd());

// Configuration is intentionally app-owned. This starter loads committed JSON
// defaults first, then overlays process.env values prefixed with NEXTSIGNAL_.
//
// Example:
// NEXTSIGNAL_LOGGING__LEVEL=debug maps to config path `logging.level`.
const platformEnvProvider: ConfigProvider = {
  name: "vercel-platform-env",
  load() {
    return {
      database: {
        url: process.env.DATABASE_URL
      },
      blob: {
        token: process.env.BLOB_READ_WRITE_TOKEN
      }
    };
  }
};

export const config = createConfig({
  providers: [
    jsonConfigProvider("config/default.json"),
    platformEnvProvider,
    envConfigProvider({ prefix: "NEXTSIGNAL_" })
  ]
});
