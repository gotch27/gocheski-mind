export const inspirationKinds = ["link", "image", "note", "quote"] as const;
export const maximumInspirationTitleLength = 240;

export type InspirationKind = (typeof inspirationKinds)[number];

export type InspirationMetadata = {
  description?: string;
  faviconUrl?: string;
  siteName?: string;
  width?: number;
  height?: number;
};

export type Inspiration = {
  id: string;
  kind: InspirationKind;
  title: string | null;
  content: string | null;
  sourceUrl: string | null;
  canonicalUrl: string | null;
  domain: string | null;
  imageUrl: string | null;
  blobPathname: string | null;
  mimeType: string | null;
  note: string | null;
  metadata: InspirationMetadata;
  favorite: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreateInspirationInput = {
  kind: InspirationKind;
  title?: string;
  content?: string;
  sourceUrl?: string;
  imageUrl?: string;
  blobPathname?: string;
  mimeType?: string;
  note?: string;
  tags?: string[];
  metadata?: InspirationMetadata;
};

export type UpdateInspirationInput = Partial<
  Pick<CreateInspirationInput, "title" | "content" | "sourceUrl" | "note" | "tags">
> & {
  id: string;
  favorite?: boolean;
};

export type InspirationListInput = {
  query?: string;
  kind?: InspirationKind;
  favorite?: boolean;
  tag?: string;
  limit?: number;
};

export type ApiResult<T> = {
  ok: boolean;
  data?: T;
  errors: Array<{ message: string; publicMessage?: string }>;
  meta: { kind: string; correlationId?: string; process?: string };
};

export function normalizeInspirationTitle(value: string | undefined) {
  const cleaned = value?.trim();
  if (!cleaned) return undefined;
  if (cleaned.length <= maximumInspirationTitleLength) return cleaned;

  let end = maximumInspirationTitleLength - 1;
  const previousCodeUnit = cleaned.charCodeAt(end - 1);
  const nextCodeUnit = cleaned.charCodeAt(end);
  if (
    previousCodeUnit >= 0xd800 && previousCodeUnit <= 0xdbff &&
    nextCodeUnit >= 0xdc00 && nextCodeUnit <= 0xdfff
  ) {
    end -= 1;
  }
  return `${cleaned.slice(0, end)}…`;
}
