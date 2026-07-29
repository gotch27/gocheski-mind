import { authFail, ok, type AuthHook } from "@gotch/nextsignal";
import { isValidExtensionToken } from "@/app/lib/mind-auth";

export function requireExtensionToken(): AuthHook {
  return (ctx) => {
    const authorization = ctx.request?.headers.authorization;
    const match = authorization?.match(/^Bearer\s+(.+)$/i);
    return match && isValidExtensionToken(match[1])
      ? ok()
      : authFail("A valid extension token is required.");
  };
}
