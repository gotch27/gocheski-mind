import { app } from "@/nextsignal/app";
import { createLoggedNextRoute } from "@/lib/logged-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const DELETE = createLoggedNextRoute(app, "extensionTokens.revoke");
