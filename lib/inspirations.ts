export const inspirationKinds = ["link", "image", "note", "quote"] as const;

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
  limit?: number;
};

export type ApiResult<T> = {
  ok: boolean;
  data?: T;
  errors: Array<{ message: string; publicMessage?: string }>;
  meta: { kind: string; correlationId?: string; process?: string };
};
