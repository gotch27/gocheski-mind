export const API_BASE_URL = "https://www.gocheski.com/mind";
export const BOARD_URL = "https://www.gocheski.com/mind";

export type ExtensionSettings = {
  token: string;
  defaultTags: string[];
};

const defaults: ExtensionSettings = {
  token: "",
  defaultTags: []
};

export async function readSettings(): Promise<ExtensionSettings> {
  const stored = await chrome.storage.local.get(["token", "defaultTags"]);
  return {
    token: typeof stored.token === "string" ? stored.token : defaults.token,
    defaultTags: Array.isArray(stored.defaultTags)
      ? stored.defaultTags.filter((tag): tag is string => typeof tag === "string")
      : defaults.defaultTags
  };
}

export async function saveSettings(settings: ExtensionSettings) {
  await chrome.storage.local.set(settings);
}

export function parseTags(value: string) {
  return [...new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))]
    .slice(0, 12)
    .map((tag) => tag.slice(0, 40));
}
