import { createNextRoute } from "@gotch/nextsignal/next";
import { app } from "@/nextsignal/app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = createNextRoute(app, "inspirations.list");
export const POST = createNextRoute(app, "inspirations.create");
