import { createNextRoute } from "@gotch/nextsignal/next";
import { app } from "@/nextsignal/app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = createNextRoute(app, "extensionTokens.list");
export const POST = createNextRoute(app, "extensionTokens.create");
