import { del, put } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { config } from "@/nextsignal/config";
import { assertPublicUrl } from "@/nextsignal/services/link-metadata";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAXIMUM_IMAGE_SIZE = 25 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif"
};

export const blobService = {
  async copyRemoteImage(value: string) {
    await config.load();
    const token = config.require<string>("blob.token");
    const response = await fetchRemoteImage(value);
    const contentType = (response.headers.get("content-type") ?? "").split(";", 1)[0].trim().toLowerCase();

    if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
      throw new Error("That URL did not return a supported image.");
    }

    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAXIMUM_IMAGE_SIZE) {
      throw new Error("Images must be 25 MB or smaller.");
    }

    const bytes = await readLimitedBytes(response, MAXIMUM_IMAGE_SIZE);
    const extension = IMAGE_EXTENSIONS[contentType] ?? "img";
    return put(`inspirations/browser-capture.${extension}`, bytes, {
      access: "public",
      addRandomSuffix: true,
      cacheControlMaxAge: 31_536_000,
      contentType,
      token
    });
  },

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

async function fetchRemoteImage(value: string) {
  let currentUrl = normalizeRemoteUrl(value);

  for (let redirectCount = 0; redirectCount < 5; redirectCount += 1) {
    await assertPublicUrl(currentUrl);
    const response = await fetch(currentUrl, {
      redirect: "manual",
      signal: AbortSignal.timeout(12_000),
      headers: {
        accept: ALLOWED_IMAGE_TYPES.join(","),
        "user-agent": "GocheskiMind/0.1 (+private inspiration capture)"
      }
    });

    if (response.status < 300 || response.status >= 400) {
      if (!response.ok) throw new Error(`The image could not be downloaded (${response.status}).`);
      return response;
    }

    const location = response.headers.get("location");
    if (!location) throw new Error("The image redirect was incomplete.");
    currentUrl = normalizeRemoteUrl(new URL(location, currentUrl).toString());
  }

  throw new Error("The image redirected too many times.");
}

function normalizeRemoteUrl(value: string) {
  const url = new URL(value.trim());
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS images can be captured.");
  }
  if (url.username || url.password) throw new Error("Image URLs with embedded credentials are not supported.");
  url.hash = "";
  return url.toString();
}

async function readLimitedBytes(response: Response, maximumBytes: number) {
  if (!response.body) throw new Error("The image response was empty.");

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maximumBytes) {
      await reader.cancel();
      throw new Error("Images must be 25 MB or smaller.");
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}
