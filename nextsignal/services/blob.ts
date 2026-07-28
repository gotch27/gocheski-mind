import { del } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { config } from "@/nextsignal/config";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAXIMUM_IMAGE_SIZE = 25 * 1024 * 1024;

export const blobService = {
  async handleImageUpload(request: Request, body: HandleUploadBody) {
    await config.load();
    const token = config.get<string>("blob.token");

    return handleUpload({
      request,
      body,
      token,
      async onBeforeGenerateToken(pathname) {
        if (!pathname.startsWith("inspirations/") || pathname.includes("..")) {
          throw new Error("Invalid inspiration image path.");
        }

        return {
          allowedContentTypes: ALLOWED_IMAGE_TYPES,
          maximumSizeInBytes: MAXIMUM_IMAGE_SIZE,
          addRandomSuffix: true,
          cacheControlMaxAge: 31_536_000
        };
      }
    });
  },

  async remove(url: string) {
    await config.load();
    const token = config.get<string>("blob.token");
    if (!token) return;
    await del(url, { token });
  }
};
