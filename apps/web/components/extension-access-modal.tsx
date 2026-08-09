"use client";

import { Check, Copy, ExternalLink, LoaderCircle, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { CreatedExtensionToken, ExtensionToken } from "@/lib/extension-tokens";
import type { ApiResult } from "@/lib/inspirations";
import { readApiError } from "@/lib/api";
import { withBasePath } from "@/lib/base-path";
import { CHROME_WEB_STORE_URL } from "@/lib/extension";
import { ConfirmDialog } from "@/components/confirm-dialog";

type ExtensionAccessModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ExtensionAccessModal({ open, onClose }: ExtensionAccessModalProps) {
  const [items, setItems] = useState<ExtensionToken[]>([]);
  const [created, setCreated] = useState<CreatedExtensionToken | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pendingRevoke, setPendingRevoke] = useState<ExtensionToken | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(withBasePath("/api/extension/tokens"), { cache: "no-store" });
      const result = (await response.json()) as ApiResult<{ items: ExtensionToken[] }>;
      if (!response.ok || !result.ok) throw new Error(readApiError(result));
      setItems(result.data?.items ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Extension access could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setCreated(null);
    setCopied(false);
    void load();
  }, [load, open]);

  if (!open) return null;

  async function createToken() {
    setCreating(true);
    setError(null);
    try {
      const response = await fetch(withBasePath("/api/extension/tokens"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Chrome extension" })
      });
      const result = (await response.json()) as ApiResult<{ item: CreatedExtensionToken }>;
      if (!response.ok || !result.ok || !result.data) throw new Error(readApiError(result));
      setCreated(result.data.item);
      setItems((current) => [result.data!.item, ...current]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "A token could not be created.");
    } finally {
      setCreating(false);
    }
  }

  async function copyToken() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.token);
      setCopied(true);
    } catch (cause) {
      setError("The extension key could not be copied. Select and copy it manually.");
    }
  }

  async function revokeToken(item: ExtensionToken) {
    setRevoking(true);
    setRevokeError(null);
    try {
      const response = await fetch(withBasePath(`/api/extension/tokens/${item.id}`), { method: "DELETE" });
      const result = (await response.json()) as ApiResult<{ id: string }>;
      if (!response.ok || !result.ok) throw new Error(readApiError(result));
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      if (created?.id === item.id) setCreated(null);
      setPendingRevoke(null);
    } catch (cause) {
      setRevokeError(cause instanceof Error ? cause.message : "The key could not be revoked.");
    } finally {
      setRevoking(false);
    }
  }

  return (
    <>
      <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
        if (event.target === event.currentTarget && !creating) onClose();
      }}>
        <section className="capture-modal extension-modal" role="dialog" aria-modal="true" aria-labelledby="extension-title">
        <header className="modal-header">
          <div>
            <h2 id="extension-title">Connect the extension</h2>
            <p>Connect this browser automatically or manage its revocable access keys.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <div className="extension-modal-body">
          <section className="automatic-connect-panel">
            <div>
              <strong>Chrome extension</strong>
              <p>Install it once, then securely connect this browser to your Mind.</p>
            </div>
            <div className="automatic-connect-actions">
              <a className="secondary-button" href={CHROME_WEB_STORE_URL} target="_blank" rel="noreferrer">
                Install extension <ExternalLink size={15} />
              </a>
              <a className="primary-button" href={withBasePath("/extension/connect")}>
                Connect installed extension
              </a>
            </div>
          </section>

          <p className="manual-token-heading">Manual keys</p>

          {created ? (
            <section className="new-token-panel">
              <strong>Copy this key now</strong>
              <p>For security, Mind cannot show the complete key again.</p>
              <div className="token-copy-row">
                <code>{created.token}</code>
                <button type="button" onClick={() => void copyToken()}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </section>
          ) : (
            <button className="primary-button create-token-button" type="button" onClick={() => void createToken()} disabled={creating}>
              {creating ? <LoaderCircle className="spin" size={17} /> : <Plus size={17} />}
              {creating ? "Generating…" : "Generate extension key"}
            </button>
          )}

          <section className="token-list-section">
            <h3>Connected keys</h3>
            {loading ? (
              <div className="token-loading"><LoaderCircle className="spin" size={18} /> Loading…</div>
            ) : items.length ? (
              <ul className="token-list">
                {items.map((item) => (
                  <li key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.tokenPrefix} · {item.lastUsedAt ? `used ${formatDate(item.lastUsedAt)}` : "never used"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRevokeError(null);
                        setPendingRevoke(item);
                      }}
                      aria-label={`Revoke ${item.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="token-empty">No extension keys yet.</p>
            )}
          </section>

          {error ? <p className="form-error" role="alert">{error}</p> : null}
        </div>
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(pendingRevoke)}
        title="Revoke this extension key?"
        description={`${pendingRevoke?.name ?? "This browser"} will immediately lose access to Mind.`}
        confirmLabel="Revoke key"
        busyLabel="Revoking…"
        busy={revoking}
        error={revokeError}
        onCancel={() => {
          if (revoking) return;
          setPendingRevoke(null);
          setRevokeError(null);
        }}
        onConfirm={() => {
          if (pendingRevoke) void revokeToken(pendingRevoke);
        }}
      />
    </>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
}
