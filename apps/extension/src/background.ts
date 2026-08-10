import type {
  ExtensionCaptureAnnotationInput,
  ExtensionCaptureAnnotationResponse,
  ExtensionCaptureInput,
  ExtensionCaptureResponse
} from "@gocheski-mind/contracts";
import { API_BASE_URL, readSettings, saveSettings } from "./settings";

const MENU_ID = "save-to-gocheski-mind";

type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  errors?: Array<{ message?: string; publicMessage?: string }>;
};

type ToastTone = "loading" | "success" | "neutral" | "error";

type AnnotationMessage = ExtensionCaptureAnnotationInput & {
  type: "gocheski-mind:annotate-capture";
};

type AnnotationMessageResponse = {
  ok: boolean;
  error?: string;
};

chrome.runtime.onInstalled.addListener(() => {
  void configureExtension();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID) return;
  void captureFromContextMenu(info, tab);
});

chrome.runtime.onMessage.addListener((request: unknown, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || !isAnnotationMessage(request)) return;

  void annotateCapture(request)
    .then(() => sendResponse({ ok: true } satisfies AnnotationMessageResponse))
    .catch((error: unknown) => sendResponse({
      ok: false,
      error: error instanceof Error ? error.message : "The details could not be added."
    } satisfies AnnotationMessageResponse));
  return true;
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
      throw new Error(readError(result, "The capture could not be saved."));
    }

    const label = result.data.inspiration.title?.trim() || captureLabel(input.type);
    if (result.data.annotationReceipt) {
      await showCaptureComposer(
        tab?.id,
        result.data.duplicate ? "Already in Mind" : "Saved to Mind",
        truncate(label, 120),
        result.data.annotationReceipt
      );
    } else {
      await showToast(
        tab?.id,
        result.data.duplicate ? "neutral" : "success",
        result.data.duplicate ? "Already in Mind" : "Saved to Mind",
        truncate(label, 120)
      );
    }
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

async function annotateCapture(message: AnnotationMessage) {
  const settings = await readSettings();
  if (!settings.token) throw new Error("Connect Mind again before adding details.");

  const input: ExtensionCaptureAnnotationInput = {
    receipt: message.receipt,
    note: message.note?.trim() || undefined,
    tags: normalizeTags(message.tags ?? [])
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/extension/captures`, {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${settings.token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(input)
    });
    const result = await readEnvelope<ExtensionCaptureAnnotationResponse>(response);

    if (!response.ok || !result.ok || !result.data) {
      if (response.status === 401) {
        throw new Error("The extension token is invalid. Update it in the extension settings.");
      }
      throw new Error(readError(result, "The details could not be added."));
    }
  } catch (error) {
    await reportExtensionError(settings.token, error, { operation: "annotate-capture" });
    throw error;
  }
}

function isAnnotationMessage(value: unknown): value is AnnotationMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<AnnotationMessage>;
  return message.type === "gocheski-mind:annotate-capture" &&
    typeof message.receipt === "string" &&
    /^mind_capture_[A-Za-z0-9_-]{43}$/.test(message.receipt) &&
    (message.note === undefined || typeof message.note === "string") &&
    (message.tags === undefined || (
      Array.isArray(message.tags) && message.tags.every((tag) => typeof tag === "string")
    ));
}

function normalizeTags(tags: string[]) {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))]
    .slice(0, 12)
    .map((tag) => tag.slice(0, 40));
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

function readError(result: ApiEnvelope<unknown>, fallback: string) {
  return result.errors?.[0]?.publicMessage ?? result.errors?.[0]?.message ?? fallback;
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

async function showCaptureComposer(
  tabId: number | undefined,
  title: string,
  message: string,
  annotationReceipt: string
) {
  if (tabId === undefined) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: renderMindCaptureComposer,
      args: [title, message, annotationReceipt]
    });
  } catch {
    // The inspiration is already stored. Restricted Chrome pages can prevent
    // injection, in which case only the optional annotation UI is unavailable.
  }
}

function renderMindToast(tone: ToastTone, title: string, message: string) {
  type MindHost = HTMLElement & { __gocheskiMindDispose?: () => void };
  const hostId = "__gocheski-mind-toast";
  let host = document.getElementById(hostId) as MindHost | null;

  if (!host) {
    host = document.createElement("div");
    host.id = hostId;
    document.documentElement.append(host);
  }

  host.__gocheskiMindDispose?.();

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
    const activeHost = host;
    const timer = window.setTimeout(() => {
      dispose();
      activeHost.remove();
    }, duration);
    const dispose = () => {
      window.clearTimeout(timer);
      if (activeHost.__gocheskiMindDispose === dispose) delete activeHost.__gocheskiMindDispose;
    };
    activeHost.__gocheskiMindDispose = dispose;
  }
}

function renderMindCaptureComposer(title: string, message: string, annotationReceipt: string) {
  type MindHost = HTMLElement & { __gocheskiMindDispose?: () => void };
  const hostId = "__gocheski-mind-toast";
  let host = document.getElementById(hostId) as MindHost | null;

  if (!host) {
    host = document.createElement("div");
    host.id = hostId;
    document.documentElement.append(host);
  }

  host.__gocheskiMindDispose?.();

  const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `
    :host {
      all: initial !important;
      position: fixed !important;
      right: 22px !important;
      bottom: 22px !important;
      z-index: 2147483647 !important;
      pointer-events: auto !important;
    }
    * { box-sizing: border-box; }
    .panel {
      width: min(340px, calc(100vw - 44px));
      padding: 15px;
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 10px;
      background: #111;
      box-shadow: 0 12px 40px rgba(17, 17, 17, 0.28);
      font-family: Arial, Helvetica, sans-serif;
      -webkit-font-smoothing: antialiased;
      animation: mind-panel-in 180ms ease-out;
    }
    .header {
      display: grid;
      grid-template-columns: 26px minmax(0, 1fr);
      gap: 10px;
      align-items: center;
      margin-bottom: 13px;
    }
    .mark {
      display: grid;
      width: 26px;
      height: 26px;
      color: #111;
      border-radius: 50%;
      background: #58b368;
      place-items: center;
      font-size: 14px;
      font-weight: 800;
      line-height: 1;
    }
    .copy { min-width: 0; }
    strong {
      display: block;
      margin: 0 0 2px;
      color: #fff;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: -0.01em;
      line-height: 1.25;
    }
    .capture-name {
      overflow: hidden;
      margin: 0;
      color: rgba(255, 255, 255, 0.62);
      font-size: 11px;
      line-height: 1.35;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    form { margin: 0; }
    label {
      display: block;
      margin-top: 8px;
      color: rgba(255, 255, 255, 0.68);
      font-size: 11px;
      font-weight: 600;
      line-height: 1.3;
    }
    input, textarea {
      display: block;
      width: 100%;
      margin-top: 5px;
      padding: 9px 10px;
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.19);
      border-radius: 7px;
      outline: none;
      background: rgba(255, 255, 255, 0.07);
      font: 12px/1.4 Arial, Helvetica, sans-serif;
      transition: border-color 120ms ease, background 120ms ease;
    }
    textarea {
      min-height: 62px;
      max-height: 150px;
      resize: vertical;
    }
    input::placeholder, textarea::placeholder { color: rgba(255, 255, 255, 0.34); }
    input:focus, textarea:focus {
      border-color: #ff6b00;
      background: rgba(255, 255, 255, 0.1);
    }
    input:disabled, textarea:disabled { opacity: 0.58; }
    .footer {
      display: flex;
      min-height: 30px;
      margin-top: 11px;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .status {
      margin: 0;
      color: rgba(255, 255, 255, 0.48);
      font-size: 10px;
      line-height: 1.3;
    }
    .status.error { color: #ffaaa4; }
    button {
      display: none;
      min-width: 64px;
      padding: 8px 13px;
      color: #111;
      border: 0;
      border-radius: 7px;
      background: #ff6b00;
      cursor: pointer;
      font: 700 12px/1 Arial, Helvetica, sans-serif;
    }
    .editing button { display: block; }
    button:hover { background: #ff7c24; }
    button:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
    button:disabled { cursor: wait; opacity: 0.62; }
    @keyframes mind-panel-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 520px) {
      :host { right: 12px !important; bottom: 12px !important; }
      .panel { width: calc(100vw - 24px); }
    }
  `;

  const panel = document.createElement("section");
  panel.className = "panel";
  panel.setAttribute("role", "region");
  panel.setAttribute("aria-label", "Mind capture saved");

  const header = document.createElement("div");
  header.className = "header";
  const mark = document.createElement("span");
  mark.className = "mark";
  mark.textContent = "✓";
  const copy = document.createElement("div");
  copy.className = "copy";
  const heading = document.createElement("strong");
  heading.textContent = title;
  const captureName = document.createElement("p");
  captureName.className = "capture-name";
  captureName.textContent = message;
  copy.append(heading, captureName);
  header.append(mark, copy);

  const form = document.createElement("form");
  const labelsLabel = document.createElement("label");
  labelsLabel.textContent = "Labels";
  const labelsInput = document.createElement("input");
  labelsInput.type = "text";
  labelsInput.placeholder = "design, reading";
  labelsInput.autocomplete = "off";
  labelsInput.maxLength = 500;
  labelsInput.setAttribute("aria-label", "Optional labels, separated by commas");
  labelsLabel.append(labelsInput);

  const noteLabel = document.createElement("label");
  noteLabel.textContent = "Note";
  const noteInput = document.createElement("textarea");
  noteInput.placeholder = "Add a thought…";
  noteInput.maxLength = 4_000;
  noteInput.setAttribute("aria-label", "Optional personal note");
  noteLabel.append(noteInput);

  const footer = document.createElement("div");
  footer.className = "footer";
  const status = document.createElement("p");
  status.className = "status";
  const save = document.createElement("button");
  save.type = "submit";
  save.textContent = "Save";
  footer.append(status, save);
  form.append(labelsLabel, noteLabel, footer);
  panel.append(header, form);
  shadow.replaceChildren(style, panel);

  let editing = false;
  let secondsLeft = 5;
  let dismissTimer = 0;
  let countdownTimer = 0;
  const activeHost = host;

  const renderCountdown = () => {
    status.textContent = `Saved · closes in ${secondsLeft}s`;
  };

  const beginEditing = () => {
    if (editing) return;
    editing = true;
    window.clearTimeout(dismissTimer);
    window.clearInterval(countdownTimer);
    panel.classList.add("editing");
    status.textContent = "Saved";
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      remove();
      return;
    }
    if (editing && event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      form.requestSubmit();
    }
  };

  const dispose = () => {
    window.clearTimeout(dismissTimer);
    window.clearInterval(countdownTimer);
    document.removeEventListener("keydown", onKeyDown, true);
    if (activeHost.__gocheskiMindDispose === dispose) delete activeHost.__gocheskiMindDispose;
  };

  const remove = () => {
    dispose();
    activeHost.remove();
  };

  labelsInput.addEventListener("focus", beginEditing);
  noteInput.addEventListener("focus", beginEditing);
  labelsInput.addEventListener("input", beginEditing);
  noteInput.addEventListener("input", beginEditing);
  document.addEventListener("keydown", onKeyDown, true);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void submitDetails();
  });

  const submitDetails = async () => {
    const note = noteInput.value.trim();
    const tags = [...new Set(labelsInput.value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean))]
      .slice(0, 12)
      .map((tag) => tag.slice(0, 40));

    if (!note && tags.length === 0) {
      remove();
      return;
    }

    labelsInput.disabled = true;
    noteInput.disabled = true;
    save.disabled = true;
    status.className = "status";
    status.textContent = "Adding details…";

    try {
      const response = await chrome.runtime.sendMessage({
        type: "gocheski-mind:annotate-capture",
        receipt: annotationReceipt,
        note: note || undefined,
        tags: tags.length ? tags : undefined
      }) as AnnotationMessageResponse | undefined;

      if (!response?.ok) throw new Error(response?.error || "The details could not be added.");
      heading.textContent = "Details added";
      status.textContent = "Saved to Mind";
      form.remove();
      window.setTimeout(remove, 1_800);
    } catch (error) {
      labelsInput.disabled = false;
      noteInput.disabled = false;
      save.disabled = false;
      status.className = "status error";
      status.textContent = error instanceof Error ? error.message : "The details could not be added.";
    }
  };

  renderCountdown();
  countdownTimer = window.setInterval(() => {
    secondsLeft -= 1;
    if (secondsLeft > 0) renderCountdown();
  }, 1_000);
  dismissTimer = window.setTimeout(remove, 5_000);
  activeHost.__gocheskiMindDispose = dispose;
}
