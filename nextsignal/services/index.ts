export type HealthSnapshot = {
  status: "ok";
  appName: string;
  checkedAt: string;
};

// Services are the app-owned data and integration layer.
//
// Put database repositories, ORM clients, API clients, mailers, and other
// infrastructure here. NextSignal should not know or care whether you use
// Drizzle, Prisma, raw SQL, Redis, S3, or anything else.
export const services = {
  health: {
    async check(appName: string): Promise<HealthSnapshot> {
      return {
        status: "ok",
        appName,
        checkedAt: new Date().toISOString()
      };
    }
  },
  inspirations: inspirationService,
  linkMetadata: {
    fetch: fetchLinkMetadata
  },
  blob: blobService
};

export type AppServices = typeof services;
import { blobService } from "@/nextsignal/services/blob";
import { inspirationService } from "@/nextsignal/services/inspirations";
import { fetchLinkMetadata } from "@/nextsignal/services/link-metadata";
