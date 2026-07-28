import type { HandleUploadBody } from "@vercel/blob/client";
import { services } from "@/nextsignal/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const response = await services.blob.handleImageUpload(request, body);
    return Response.json(response);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Image upload could not be prepared." },
      { status: 400 }
    );
  }
}
