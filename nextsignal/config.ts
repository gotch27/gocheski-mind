import { loadEnvConfig } from "@next/env";
import {
  createConfig,
  type ConfigProvider
} from "@gotch/nextsignal";

loadEnvConfig(process.cwd());

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
  providers: [platformEnvProvider]
});
