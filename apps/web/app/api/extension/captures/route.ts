import { createNextRoute } from "@gotch/nextsignal/next";
import { app } from "@/nextsignal/app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = createNextRoute(app, "extension.capture");
