import { auth } from "@/app/lib/mind-auth";
import { withRouteLogging } from "@/lib/logged-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handlers = auth.handler();

export const GET = withRouteLogging("auth.GET", handlers.GET);
export const POST = withRouteLogging("auth.POST", handlers.POST);
export const PUT = withRouteLogging("auth.PUT", handlers.PUT);
export const DELETE = withRouteLogging("auth.DELETE", handlers.DELETE);
export const PATCH = withRouteLogging("auth.PATCH", handlers.PATCH);
