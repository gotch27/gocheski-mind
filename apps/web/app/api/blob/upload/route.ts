import type { HandleUploadBody } from "@vercel/blob/client";
import { getMindUser } from "@/app/lib/mind-auth";
import { services } from "@/nextsignal/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getMindUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as HandleUploadBody;
    const response = await services.blob.handleImageUpload(user.id, request, body);
    return Response.json(response);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Image upload could not be prepared." },
      { status: 400 }
    );
  }
}
