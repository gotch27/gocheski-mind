"use client";

import { Check, ExternalLink, LoaderCircle, Plug } from "lucide-react";
import { useState } from "react";
import type { CreatedExtensionToken } from "@/lib/extension-tokens";
import type { ApiResult } from "@/lib/inspirations";
import { readApiError } from "@/lib/api";
import { withBasePath } from "@/lib/base-path";
import { CHROME_WEB_STORE_URL, PUBLISHED_EXTENSION_ID } from "@/lib/extension";

type ConnectionResponse = {
  ok?: boolean;
  error?: string;
};

type ExternalRuntime = {
  lastError?: { message?: string };
  sendMessage(
    targetExtensionId: string,
    message: unknown,
    callback: (response?: ConnectionResponse) => void
  ): void;
};

export function ExtensionConnect({ email }: { email: string }) {
  const [consented, setConsented] = useState(false);
  const [status, setStatus] = useState<"idle" | "connecting" | "connected">("idle");
  const [error, setError] = useState<string | null>(null);
  const [extensionUnavailable, setExtensionUnavailable] = useState(false);

  async function connect() {
    if (!consented || status === "connecting") return;
    setStatus("connecting");
    setError(null);
    setExtensionUnavailable(false);

    let created: CreatedExtensionToken | null = null;
    try {
      const response = await fetch(withBasePath("/api/extension/tokens"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Chrome Web Store" })
      });
      const result = (await response.json()) as ApiResult<{ item: CreatedExtensionToken }>;
      if (!response.ok || !result.ok || !result.data) throw new Error(readApiError(result));
      created = result.data.item;

      await sendConnectionToken(created.token);
      setStatus("connected");
    } catch (cause) {
      if (created) {
        await fetch(withBasePath(`/api/extension/tokens/${created.id}`), { method: "DELETE" }).catch(() => undefined);
      }
      setStatus("idle");
      if (cause instanceof ExtensionUnavailableError) {
        setExtensionUnavailable(true);
      } else {
        setError(cause instanceof Error ? cause.message : "The extension could not be connected.");
      }
    }
  }

  if (status === "connected") {
    return (
      <main className="auth-page auth-page--centered">
        <section className="extension-connect-card extension-connect-success">
          <span className="connect-mark"><Check size={28} /></span>
          <p className="eyebrow">Chrome extension</p>
          <h1>Connected to Mind</h1>
          <p>You can close this tab and right-click any page, link, image, or selected text.</p>
          <a className="primary-button" href={withBasePath("/")}>Open Mind</a>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page auth-page--centered">
      <section className="extension-connect-card">
        <span className="connect-mark"><Plug size={26} /></span>
        <p className="eyebrow">Chrome extension</p>
        <h1>Connect this browser</h1>
        <p className="connect-account">Signed in as <strong>{email}</strong></p>
        <p>
          When you choose <strong>Save to Mind</strong>, the extension sends only the page, link, image,
          selected text, and labels you explicitly save to your Mind account.
        </p>

        <label className="connect-consent">
          <input
            type="checkbox"
            checked={consented}
            onChange={(event) => setConsented(event.target.checked)}
          />
          <span>I understand what is sent and want to connect this extension.</span>
        </label>

        {!extensionUnavailable ? (
          <button className="primary-button connect-submit" type="button" disabled={!consented || status === "connecting"} onClick={() => void connect()}>
            {status === "connecting" ? <LoaderCircle className="spin" size={18} /> : <Plug size={18} />}
            {status === "connecting" ? "Connecting…" : "Connect extension"}
          </button>
        ) : null}

        {extensionUnavailable ? (
          <section className="extension-install-help" role="alert">
            <strong>Extension not detected</strong>
            <p>Install it from the Chrome Web Store, then return here and reload this page.</p>
            <div>
              <a className="primary-button" href={CHROME_WEB_STORE_URL} target="_blank" rel="noreferrer">
                Install extension <ExternalLink size={14} />
              </a>
              <button className="secondary-button" type="button" onClick={() => window.location.reload()}>
                I installed it — reload
              </button>
            </div>
          </section>
        ) : null}

        {error ? <p className="form-error" role="alert">{error}</p> : null}

        <div className="connect-footer">
          <a href={withBasePath("/privacy")} target="_blank">
            Privacy policy <ExternalLink size={13} />
          </a>
          <a href={withBasePath("/")}>Back to Mind</a>
        </div>
      </section>
    </main>
  );
}

function sendConnectionToken(token: string) {
  const runtime = (window as Window & { chrome?: { runtime?: ExternalRuntime } }).chrome?.runtime;
  if (!runtime) {
    throw new ExtensionUnavailableError();
  }

  return new Promise<void>((resolve, reject) => {
    runtime.sendMessage(PUBLISHED_EXTENSION_ID, { type: "gocheski-mind:connect", token }, (response) => {
      const runtimeError = runtime.lastError?.message;
      if (runtimeError) {
        reject(new ExtensionUnavailableError());
        return;
      }
      if (!response?.ok) {
        reject(new Error(response?.error || "The extension rejected the connection."));
        return;
      }
      resolve();
    });
  });
}

class ExtensionUnavailableError extends Error {
  constructor() {
    super("The Gocheski Mind extension is not installed or this page needs to be reloaded.");
    this.name = "ExtensionUnavailableError";
  }
}
