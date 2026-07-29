import { authFail, value, type AuthAdapter, type ProcessContext } from "@gotch/nextsignal";
import { isValidSessionCookie, readSessionCookie } from "@/app/lib/mind-auth";

type MindUser = {
  id: "owner";
};

function currentMindUser(ctx: ProcessContext): MindUser | null {
  const session = readSessionCookie(ctx.request?.headers.cookie);
  return isValidSessionCookie(session) ? { id: "owner" } : null;
}

export const mindAuthAdapter: AuthAdapter<MindUser> = {
  currentUser: currentMindUser,
  requireUser(ctx) {
    const user = currentMindUser(ctx);
    return user ? value(user) : authFail("Authentication required.");
  }
};
