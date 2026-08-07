import {
  createInspirationApi,
  deleteInspirationApi,
  listInspirationsApi,
  updateInspirationApi
} from "@/nextsignal/processes/api/inspirations";
import { captureFromExtensionApi } from "@/nextsignal/processes/api/extension-captures";
import {
  createExtensionTokenApi,
  listExtensionTokensApi,
  revokeExtensionTokenApi
} from "@/nextsignal/processes/api/extension-tokens";
import {
  createInspirationBusiness,
  deleteInspirationBusiness,
  listInspirationLabelsBusiness,
  listInspirationsBusiness,
  updateInspirationBusiness
} from "@/nextsignal/processes/business/inspirations";
import { captureFromExtensionBusiness } from "@/nextsignal/processes/business/extension-captures";
import {
  createExtensionTokenBusiness,
  listExtensionTokensBusiness,
  revokeExtensionTokenBusiness
} from "@/nextsignal/processes/business/extension-tokens";
import { reportExtensionErrorApi } from "@/nextsignal/processes/api/application-logs";
import { recordExtensionErrorBusiness } from "@/nextsignal/processes/business/application-logs";

export const processes = [
  reportExtensionErrorApi,
  captureFromExtensionApi,
  listExtensionTokensApi,
  createExtensionTokenApi,
  revokeExtensionTokenApi,
  listInspirationsApi,
  createInspirationApi,
  updateInspirationApi,
  deleteInspirationApi,
  captureFromExtensionBusiness,
  listExtensionTokensBusiness,
  createExtensionTokenBusiness,
  revokeExtensionTokenBusiness,
  listInspirationLabelsBusiness,
  listInspirationsBusiness,
  createInspirationBusiness,
  updateInspirationBusiness,
  deleteInspirationBusiness,
  recordExtensionErrorBusiness
];
