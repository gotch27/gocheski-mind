import {
  createInspirationApi,
  deleteInspirationApi,
  listInspirationsApi,
  updateInspirationApi
} from "@/nextsignal/processes/api/inspirations";
import {
  createInspirationBusiness,
  deleteInspirationBusiness,
  listInspirationsBusiness,
  updateInspirationBusiness
} from "@/nextsignal/processes/business/inspirations";

export const processes = [
  listInspirationsApi,
  createInspirationApi,
  updateInspirationApi,
  deleteInspirationApi,
  listInspirationsBusiness,
  createInspirationBusiness,
  updateInspirationBusiness,
  deleteInspirationBusiness
];
