import { authFail, value, type AuthAdapter } from "@gotch/nextsignal";
import { getMindUser, type MindUser } from "@/app/lib/mind-auth";

export const mindAuthAdapter: AuthAdapter<MindUser> = {
  currentUser: getMindUser,
  async requireUser() {
    const user = await getMindUser();
    return user ? value(user) : authFail("Authentication required.");
  }
};
