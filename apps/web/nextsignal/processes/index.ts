import {
  createInspirationApi,
  deleteInspirationApi,
  listInspirationsApi,
  updateInspirationApi
} from "@/nextsignal/processes/api/inspirations";
import { captureFromExtensionApi } from "@/nextsignal/processes/api/extension-captures";
import {
  createInspirationBusiness,
  deleteInspirationBusiness,
  listInspirationLabelsBusiness,
  listInspirationsBusiness,
  updateInspirationBusiness
} from "@/nextsignal/processes/business/inspirations";
import { captureFromExtensionBusiness } from "@/nextsignal/processes/business/extension-captures";

export const processes = [
  captureFromExtensionApi,
  listInspirationsApi,
  createInspirationApi,
  updateInspirationApi,
  deleteInspirationApi,
  captureFromExtensionBusiness,
  listInspirationLabelsBusiness,
  listInspirationsBusiness,
  createInspirationBusiness,
  updateInspirationBusiness,
  deleteInspirationBusiness
];
