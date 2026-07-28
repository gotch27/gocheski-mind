import { healthApi } from "@/nextsignal/processes/api/health";
import { healthBusiness } from "@/nextsignal/processes/business/health";
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

// Register every process here. Process names must be unique.
//
// Suggested folders:
// - api: route-facing processes
// - business: reusable application logic
// - distributed: queue-backed work
// - recurring: scheduled work
export const processes = [
  healthApi,
  healthBusiness,
  listInspirationsApi,
  createInspirationApi,
  updateInspirationApi,
  deleteInspirationApi,
  listInspirationsBusiness,
  createInspirationBusiness,
  updateInspirationBusiness,
  deleteInspirationBusiness
];
