import {
  createInspirationApi,
  deleteInspirationApi,
  listInspirationsApi,
  updateInspirationApi
} from "@/nextsignal/processes/api/inspirations";
import {
  annotateExtensionCaptureApi,
  captureFromExtensionApi
} from "@/nextsignal/processes/api/extension-captures";
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
import {
  annotateExtensionCaptureBusiness,
  captureFromExtensionBusiness
} from "@/nextsignal/processes/business/extension-captures";
import {
  createExtensionTokenBusiness,
  listExtensionTokensBusiness,
  revokeExtensionTokenBusiness
} from "@/nextsignal/processes/business/extension-tokens";
import { reportExtensionErrorApi } from "@/nextsignal/processes/api/application-logs";
import { recordExtensionErrorBusiness } from "@/nextsignal/processes/business/application-logs";
import { listAdminUsersApi, setAdminUserBlockedApi } from "@/nextsignal/processes/api/admin-users";
import {
  listAdminUsersBusiness,
  setAdminUserBlockedBusiness
} from "@/nextsignal/processes/business/admin-users";

export const processes = [
  listAdminUsersApi,
  setAdminUserBlockedApi,
  reportExtensionErrorApi,
  captureFromExtensionApi,
  annotateExtensionCaptureApi,
  listExtensionTokensApi,
  createExtensionTokenApi,
  revokeExtensionTokenApi,
  listInspirationsApi,
  createInspirationApi,
  updateInspirationApi,
  deleteInspirationApi,
  captureFromExtensionBusiness,
  annotateExtensionCaptureBusiness,
  listExtensionTokensBusiness,
  createExtensionTokenBusiness,
  revokeExtensionTokenBusiness,
  listInspirationLabelsBusiness,
  listInspirationsBusiness,
  createInspirationBusiness,
  updateInspirationBusiness,
  deleteInspirationBusiness,
  listAdminUsersBusiness,
  setAdminUserBlockedBusiness,
  recordExtensionErrorBusiness
];
