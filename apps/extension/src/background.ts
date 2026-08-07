import type { ExtensionCaptureInput, ExtensionCaptureResponse } from "@gocheski-mind/contracts";
import { API_BASE_URL, readSettings, saveSettings } from "./settings";

const MENU_ID = "save-to-gocheski-mind";

type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  errors?: Array<{ message?: string; publicMessage?: string }>;
};

type ToastTone = "loading" | "success" | "neutral" | "error";

chrome.runtime.onInstalled.addListener(() => {
  void configureExtension();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID) return;
  void captureFromContextMenu(info, tab);
});

chrome.runtime.onMessageExternal.addListener((request: unknown, sender, sendResponse) => {
  void connectFromMind(request, sender)
    .then(() => sendResponse({ ok: true }))
    .catch((error: unknown) => sendResponse({
      ok: false,
      error: error instanceof Error ? error.message : "Mind could not connect this extension."
    }));
  return true;
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

async function connectFromMind(request: unknown, sender: chrome.runtime.MessageSender) {
  if (!isTrustedMindSender(sender.url)) throw new Error("Connection request came from an untrusted page.");
  if (!isConnectionRequest(request)) throw new Error("Mind sent an invalid connection request.");

  const current = await readSettings();
  await saveSettings({ ...current, token: request.token });
}

function isTrustedMindSender(senderUrl: string | undefined) {
  if (!senderUrl) return false;
  try {
    const url = new URL(senderUrl);
    return url.origin === "https://www.gocheski.com" && url.pathname === "/mind/extension/connect";
  } catch {
    return false;
  }
}

function isConnectionRequest(value: unknown): value is { type: "gocheski-mind:connect"; token: string } {
  if (!value || typeof value !== "object") return false;
  const request = value as { type?: unknown; token?: unknown };
  return request.type === "gocheski-mind:connect" &&
    typeof request.token === "string" &&
    request.token.startsWith("mind_ext_") &&
    request.token.length >= 40 &&
    request.token.length <= 100;
}

async function captureFromContextMenu(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) {
  let token = "";
  try {
    const settings = await readSettings();
    token = settings.token;
    if (!settings.token) {
      await showToast(tab?.id, "error", "Connect Mind first", "Open the extension settings and paste your token.");
      await chrome.runtime.openOptionsPage();
      return;
    }

    const input = toCaptureInput(info, tab, settings.defaultTags);
    await showToast(tab?.id, "loading", "Saving to Mind…", captureLabel(input.type));
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
    await showToast(
      tab?.id,
      result.data.duplicate ? "neutral" : "success",
      result.data.duplicate ? "Already in Mind" : "Saved to Mind",
      truncate(label, 120)
    );
  } catch (error) {
    await showToast(
      tab?.id,
      "error",
      "Mind could not save this",
      error instanceof Error ? truncate(error.message, 180) : "Try again."
    );
    if (token) {
      await reportExtensionError(token, error, {
        operation: "capture",
        contextType: String(info.mediaType ?? (info.selectionText ? "selection" : info.linkUrl ? "link" : "page"))
      });
    }
  }
}

async function reportExtensionError(
  token: string,
  error: unknown,
  context: Record<string, string | number | boolean | null>
) {
  const normalized = error instanceof Error
    ? { message: error.message || error.name, stack: error.stack }
    : { message: typeof error === "string" ? error : "Unknown extension error" };

  try {
    await fetch(`${API_BASE_URL}/api/extension/logs`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ source: "extension.background", ...normalized, context })
    });
  } catch {
    // A network failure cannot be reported through the same unavailable network.
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
    pageTitle: tab?.title ? truncate(tab.title.trim(), 240) : undefined,
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
  if (value.length <= maximum) return value;

  let end = maximum - 1;
  const previousCodeUnit = value.charCodeAt(end - 1);
  const nextCodeUnit = value.charCodeAt(end);
  if (
    previousCodeUnit >= 0xd800 && previousCodeUnit <= 0xdbff &&
    nextCodeUnit >= 0xdc00 && nextCodeUnit <= 0xdfff
  ) {
    end -= 1;
  }
  return `${value.slice(0, end)}…`;
}

async function showToast(tabId: number | undefined, tone: ToastTone, title: string, message: string) {
  if (tabId === undefined) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: renderMindToast,
      args: [tone, title, message]
    });
  } catch {
    // Chrome prevents injection on internal pages and the Web Store. Capturing
    // those URLs is unsupported too, so there is no useful fallback to render.
  }
}

function renderMindToast(tone: ToastTone, title: string, message: string) {
  const hostId = "__gocheski-mind-toast";
  let host = document.getElementById(hostId) as HTMLElement | null;

  if (!host) {
    host = document.createElement("div");
    host.id = hostId;
    document.documentElement.append(host);
  }

  const existingTimer = Number(host.dataset.dismissTimer);
  if (existingTimer) window.clearTimeout(existingTimer);

  const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });
  const palette = {
    loading: { surface: "#111111", accent: "#ff6b00", icon: "…" },
    success: { surface: "#111111", accent: "#58b368", icon: "✓" },
    neutral: { surface: "#4f535b", accent: "#ffffff", icon: "✓" },
    error: { surface: "#b42318", accent: "#ffffff", icon: "!" }
  }[tone];

  const style = document.createElement("style");
  style.textContent = `
    :host {
      all: initial !important;
      position: fixed !important;
      right: 22px !important;
      bottom: 22px !important;
      z-index: 2147483647 !important;
      pointer-events: none !important;
    }
    .toast {
      display: grid;
      grid-template-columns: 28px minmax(0, 1fr);
      gap: 11px;
      width: min(340px, calc(100vw - 44px));
      padding: 14px 16px;
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 9px;
      background: ${palette.surface};
      box-shadow: 0 12px 40px rgba(17, 17, 17, 0.28);
      font-family: Arial, Helvetica, sans-serif;
      -webkit-font-smoothing: antialiased;
      animation: mind-toast-in 180ms ease-out;
    }
    .mark {
      display: grid;
      width: 28px;
      height: 28px;
      color: ${palette.surface};
      border-radius: 50%;
      background: ${palette.accent};
      place-items: center;
      font-size: 15px;
      font-weight: 800;
      line-height: 1;
    }
    .copy { min-width: 0; }
    strong {
      display: block;
      margin: 0 0 3px;
      color: #fff;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: -0.01em;
      line-height: 1.3;
    }
    p {
      overflow: hidden;
      margin: 0;
      color: rgba(255, 255, 255, 0.76);
      font-size: 12px;
      font-weight: 400;
      line-height: 1.45;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    @keyframes mind-toast-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 520px) {
      :host { right: 12px !important; bottom: 12px !important; }
      .toast { width: calc(100vw - 24px); }
    }
  `;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", tone === "error" ? "alert" : "status");

  const mark = document.createElement("span");
  mark.className = "mark";
  mark.textContent = palette.icon;

  const copy = document.createElement("div");
  copy.className = "copy";
  const heading = document.createElement("strong");
  heading.textContent = title;
  const detail = document.createElement("p");
  detail.textContent = message;
  copy.append(heading, detail);
  toast.append(mark, copy);
  shadow.replaceChildren(style, toast);

  if (tone !== "loading") {
    const duration = tone === "error" ? 6_000 : 4_000;
    const timer = window.setTimeout(() => host?.remove(), duration);
    host.dataset.dismissTimer = String(timer);
  }
}
