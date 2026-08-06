import { auth } from "@/app/lib/mind-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { GET, POST, PUT, DELETE, PATCH } = auth.handler();
