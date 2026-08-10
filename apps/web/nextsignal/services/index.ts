import { blobService } from "@/nextsignal/services/blob";
import { extensionTokenService } from "@/nextsignal/services/extension-tokens";
import { inspirationService } from "@/nextsignal/services/inspirations";
import { fetchLinkMetadata } from "@/nextsignal/services/link-metadata";
import { applicationLogService } from "@/nextsignal/services/application-logs";
import { adminUserService } from "@/nextsignal/services/admin-users";
import { extensionCaptureReceiptService } from "@/nextsignal/services/extension-capture-receipts";

export const services = {
  adminUsers: adminUserService,
  applicationLogs: applicationLogService,
  inspirations: inspirationService,
  extensionTokens: extensionTokenService,
  extensionCaptureReceipts: extensionCaptureReceiptService,
  linkMetadata: {
    fetch: fetchLinkMetadata
  },
  blob: blobService
};

export type AppServices = typeof services;
