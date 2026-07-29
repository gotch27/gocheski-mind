import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import type { InspirationMetadata } from "@/lib/inspirations";

export type LinkMetadata = {
  title?: string;
  canonicalUrl: string;
  domain: string;
  imageUrl?: string;
  metadata: InspirationMetadata;
};

const TRACKING_PARAMETERS = new Set(["fbclid", "gclid", "dclid", "msclkid"]);
const MAX_HTML_BYTES = 750_000;

export function normalizeUrl(value: string) {
  const url = new URL(value.trim());
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS links are supported.");
  }
  if (url.username || url.password) throw new Error("Links with embedded credentials are not supported.");

  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith("utm_") || TRACKING_PARAMETERS.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();
  if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString();
}

export async function fetchLinkMetadata(value: string): Promise<LinkMetadata> {
  let currentUrl = normalizeUrl(value);
  let response: Response | undefined;

  for (let redirectCount = 0; redirectCount < 4; redirectCount += 1) {
    await assertPublicUrl(currentUrl);
    response = await fetch(currentUrl, {
      redirect: "manual",
      signal: AbortSignal.timeout(6_000),
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "GocheskiMind/0.1 (+personal inspiration archive)"
      }
    });

    if (response.status < 300 || response.status >= 400) break;
    const location = response.headers.get("location");
    if (!location) break;
    currentUrl = normalizeUrl(new URL(location, currentUrl).toString());
  }

  if (!response?.ok) throw new Error(`Could not read this link (${response?.status ?? "network error"}).`);

  const finalUrl = normalizeUrl(response.url || currentUrl);
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
    return {
      canonicalUrl: finalUrl,
      domain: new URL(finalUrl).hostname.replace(/^www\./, ""),
      metadata: {}
    };
  }

  const html = await readLimitedText(response, MAX_HTML_BYTES);
  const pageUrl = new URL(finalUrl);
  const meta = readMetaTags(html);
  const canonicalHref = readLinkHref(html, "canonical");
  const iconHref = readLinkHref(html, "icon") ?? readLinkHref(html, "shortcut icon");
  const canonicalUrl = safeResolvedUrl(canonicalHref, pageUrl) ?? finalUrl;
  const imageUrl = safeResolvedUrl(meta["og:image"] ?? meta["twitter:image"], pageUrl);
  const faviconUrl = safeResolvedUrl(iconHref, pageUrl) ?? new URL("/favicon.ico", pageUrl).toString();
  const title = cleanText(meta["og:title"] ?? meta["twitter:title"] ?? readTitle(html));
  const description = cleanText(meta["og:description"] ?? meta.description);

  return {
    title: title ? title.slice(0, 240) : undefined,
    canonicalUrl: normalizeUrl(canonicalUrl),
    domain: pageUrl.hostname.replace(/^www\./, ""),
    imageUrl,
    metadata: {
      description: description ? description.slice(0, 600) : undefined,
      faviconUrl,
      siteName: cleanText(meta["og:site_name"])?.slice(0, 160)
    }
  };
}

export async function assertPublicUrl(value: string) {
  const url = new URL(value);
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new Error("Local network links cannot be inspected.");
  }

  const directIp = isIP(hostname) ? [hostname] : (await lookup(hostname, { all: true })).map((entry) => entry.address);
  if (directIp.length === 0 || directIp.some(isPrivateAddress)) {
    throw new Error("Private network links cannot be inspected.");
  }
}

export function isPrivateAddress(address: string) {
  const normalized = address.toLowerCase();
  if (normalized === "::1" || normalized === "::" || normalized.startsWith("fc") || normalized.startsWith("fd")) {
    return true;
  }
  if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) {
    return true;
  }
  if (normalized.startsWith("::ffff:")) return isPrivateAddress(normalized.slice(7));
  if (!isIP(normalized) || normalized.includes(":")) return false;

  const [a, b] = normalized.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19))
  );
}

async function readLimitedText(response: Response, maximumBytes: number) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let result = "";

  while (received < maximumBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    result += decoder.decode(value, { stream: true });
    if (received >= maximumBytes) {
      await reader.cancel();
      break;
    }
  }

  return result + decoder.decode();
}

function readMetaTags(html: string) {
  const values: Record<string, string> = {};
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attributes = readAttributes(tag);
    const key = (attributes.property ?? attributes.name)?.toLowerCase();
    if (key && attributes.content && !values[key]) values[key] = attributes.content;
  }
  return values;
}

function readLinkHref(html: string, rel: string) {
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const attributes = readAttributes(tag);
    const relValue = attributes.rel?.toLowerCase().split(/\s+/) ?? [];
    if ((relValue.includes(rel) || attributes.rel?.toLowerCase() === rel) && attributes.href) return attributes.href;
  }
  return undefined;
}

function readAttributes(tag: string) {
  const attributes: Record<string, string> = {};
  const attributePattern = /([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  for (const match of tag.matchAll(attributePattern)) {
    attributes[match[1].toLowerCase()] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attributes;
}

function readTitle(html: string) {
  return html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1];
}

function cleanText(value?: string) {
  if (!value) return undefined;
  return decodeHtml(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim() || undefined;
}

function safeResolvedUrl(value: string | undefined, base: URL) {
  if (!value) return undefined;
  try {
    const url = new URL(value, base);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
}
