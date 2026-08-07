import "server-only";

import { auth } from "@/app/lib/mind-auth";
import { loggerAdapter } from "@/nextsignal/adapters/logger";

export async function getLoggedMindSession() {
  try {
    return await auth.getSession();
  } catch (error) {
    await loggerAdapter.error({
      message: "Neon Auth session retrieval failed.",
      process: "auth.session",
      error,
      data: { source: "auth" }
    });
    throw error;
  }
}
