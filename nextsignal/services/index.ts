import { blobService } from "@/nextsignal/services/blob";
import { inspirationService } from "@/nextsignal/services/inspirations";
import { fetchLinkMetadata } from "@/nextsignal/services/link-metadata";

export const services = {
  inspirations: inspirationService,
  linkMetadata: {
    fetch: fetchLinkMetadata
  },
  blob: blobService
};

export type AppServices = typeof services;
