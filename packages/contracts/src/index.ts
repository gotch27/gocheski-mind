export const extensionCaptureTypes = ["page", "link", "selection", "image"] as const;

export type ExtensionCaptureType = (typeof extensionCaptureTypes)[number];

export type ExtensionCaptureInput = {
  type: ExtensionCaptureType;
  pageUrl: string;
  targetUrl?: string;
  text?: string;
  pageTitle?: string;
  tags?: string[];
};

export type ExtensionCaptureResponse = {
  inspiration: {
    id: string;
    kind: "link" | "image" | "note" | "quote";
    title: string | null;
  };
  duplicate: boolean;
};
