import { app } from "@/nextsignal/app";
import { createLoggedNextRoute } from "@/lib/logged-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = createLoggedNextRoute(app, "extensionTokens.list");
export const POST = createLoggedNextRoute(app, "extensionTokens.create");
