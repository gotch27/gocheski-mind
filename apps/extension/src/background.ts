import type { ExtensionCaptureInput, ExtensionCaptureResponse } from "@gocheski-mind/contracts";
import { API_BASE_URL, BOARD_URL, readSettings } from "./settings";

const MENU_ID = "save-to-gocheski-mind";

type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  errors?: Array<{ message?: string; publicMessage?: string }>;
};

chrome.runtime.onInstalled.addListener(() => {
  void configureExtension();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID) return;
  void captureFromContextMenu(info, tab);
});

chrome.notifications.onClicked.addListener(() => {
  void chrome.tabs.create({ url: BOARD_URL });
});

async function configureExtension() {
  await chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "Save to Mind",
    contexts: ["page", "link", "selection", "image"]
  });
}

async function captureFromContextMenu(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) {
  try {
    const settings = await readSettings();
    if (!settings.token) {
      await notify("Connect the extension first", "Open the extension settings and paste your Mind extension token.");
      await chrome.runtime.openOptionsPage();
      return;
    }

    const input = toCaptureInput(info, tab, settings.defaultTags);
    const response = await fetch(`${API_BASE_URL}/api/extension/captures`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${settings.token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(input)
    });
    const result = await readEnvelope<ExtensionCaptureResponse>(response);

    if (!response.ok || !result.ok || !result.data) {
      if (response.status === 401) {
        throw new Error("The extension token is invalid. Update it in the extension settings.");
      }
      throw new Error(readError(result));
    }

    const label = result.data.inspiration.title?.trim() || captureLabel(input.type);
    await notify(
      result.data.duplicate ? "Already in Mind" : "Saved to Mind",
      truncate(label, 120)
    );
  } catch (error) {
    await notify("Mind could not save this", error instanceof Error ? truncate(error.message, 180) : "Try again.");
  }
}

function toCaptureInput(
  info: chrome.contextMenus.OnClickData,
  tab: chrome.tabs.Tab | undefined,
  tags: string[]
): ExtensionCaptureInput {
  const pageUrl = info.pageUrl ?? tab?.url;
  if (!pageUrl || !/^https?:\/\//i.test(pageUrl)) {
    throw new Error("This browser page cannot be saved.");
  }

  const common = {
    pageUrl,
    pageTitle: tab?.title,
    tags
  };

  if (info.selectionText?.trim()) {
    return { ...common, type: "selection", text: info.selectionText.trim() };
  }
  if (info.mediaType === "image" && info.srcUrl) {
    return { ...common, type: "image", targetUrl: info.srcUrl };
  }
  if (info.linkUrl) {
    return { ...common, type: "link", targetUrl: info.linkUrl };
  }
  return { ...common, type: "page" };
}

async function readEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  try {
    return await response.json() as ApiEnvelope<T>;
  } catch {
    return { ok: false, errors: [{ message: `Mind returned HTTP ${response.status}.` }] };
  }
}

function readError(result: ApiEnvelope<unknown>) {
  return result.errors?.[0]?.publicMessage ?? result.errors?.[0]?.message ?? "The capture could not be saved.";
}

function captureLabel(type: ExtensionCaptureInput["type"]) {
  if (type === "selection") return "Selected text";
  if (type === "image") return "Image";
  if (type === "link") return "Link";
  return "Page";
}

function truncate(value: string, maximum: number) {
  return value.length > maximum ? `${value.slice(0, maximum - 1)}…` : value;
}

async function notify(title: string, message: string) {
  await chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon-128.png",
    title,
    message
  });
}
