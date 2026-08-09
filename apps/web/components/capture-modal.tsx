"use client";

import { upload } from "@vercel/blob/client";
import { LoaderCircle, Pencil, Upload, X } from "lucide-react";
import { useEffect, useMemo, useState, type DragEvent, type FormEvent } from "react";
import type { ApiResult, Inspiration, InspirationKind } from "@/lib/inspirations";
import { readApiError } from "@/lib/api";
import { withBasePath } from "@/lib/base-path";

type CaptureTab = "link" | "image" | "note";

type CaptureModalProps = {
  open: boolean;
  ownerId: string;
  initial: Inspiration | null;
  onClose: () => void;
  onSaved: (inspiration: Inspiration, message: string) => void;
};

const TABS: Array<{ value: CaptureTab; label: string }> = [
  { value: "link", label: "Link" },
  { value: "image", label: "Image" },
  { value: "note", label: "Note" }
];

export function CaptureModal({ open, ownerId, initial, onClose, onSaved }: CaptureModalProps) {
  const [tab, setTab] = useState<CaptureTab>("link");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [editingSourceUrl, setEditingSourceUrl] = useState(false);
  const [note, setNote] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    if (!open) return;
    setTab(initial ? toTab(initial.kind) : "link");
    setTitle(initial?.title ?? "");
    setContent(initial?.content ?? "");
    setSourceUrl(initial?.sourceUrl ?? "");
    setEditingSourceUrl(false);
    setNote(initial?.note ?? "");
    setTags(initial?.tags.join(", ") ?? "");
    setFile(null);
    setProgress(0);
    setError(null);
  }, [initial, open]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open, submitting]);

  if (!open) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (initial) {
        const response = await fetch(withBasePath(`/api/inspirations/${initial.id}`), {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title,
            content,
            sourceUrl: sourceUrl || undefined,
            note,
            tags: parseTags(tags)
          })
        });
        const result = (await response.json()) as ApiResult<{ inspiration: Inspiration }>;
        if (!response.ok || !result.ok || !result.data) throw new Error(readApiError(result));
        onSaved(result.data.inspiration, "Inspiration updated.");
        return;
      }

      let imageUrl: string | undefined;
      let blobPathname: string | undefined;
      let mimeType: string | undefined;
      if (tab === "image") {
        if (!file) throw new Error("Choose an image to save.");
        const blob = await upload(`inspirations/${safeOwnerPath(ownerId)}/${Date.now()}-${safeFilename(file.name)}`, file, {
          access: "public",
          handleUploadUrl: withBasePath("/api/blob/upload"),
          multipart: file.size > 5 * 1024 * 1024,
          contentType: file.type,
          onUploadProgress(event) {
            setProgress(Math.round(event.percentage));
          }
        });
        imageUrl = blob.url;
        blobPathname = blob.pathname;
        mimeType = blob.contentType;
      }

      const response = await fetch(withBasePath("/api/inspirations"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: tab,
          title,
          content: tab === "note" ? content : undefined,
          sourceUrl: sourceUrl || undefined,
          imageUrl,
          blobPathname,
          mimeType,
          note,
          tags: parseTags(tags)
        })
      });
      const result = (await response.json()) as ApiResult<{ inspiration: Inspiration; duplicate: boolean }>;
      if (!response.ok || !result.ok || !result.data) throw new Error(readApiError(result));
      onSaved(result.data.inspiration, result.data.duplicate ? "You already saved that link." : "Saved to your mind.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This inspiration could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  function acceptFile(nextFile: File | undefined) {
    if (!nextFile) return;
    if (!nextFile.type.startsWith("image/")) {
      setError("Choose a JPEG, PNG, WebP, GIF, or AVIF image.");
      return;
    }
    if (nextFile.size > 25 * 1024 * 1024) {
      setError("Images must be 25 MB or smaller.");
      return;
    }
    setError(null);
    setFile(nextFile);
    if (!title) setTitle(nextFile.name.replace(/\.[^.]+$/, ""));
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    acceptFile(event.dataTransfer.files[0]);
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !submitting) onClose();
    }}>
      <section className="capture-modal" role="dialog" aria-modal="true" aria-labelledby="capture-title">
        <header className="modal-header">
          <h2 id="capture-title">{initial ? "Edit inspiration" : "Add inspiration"}</h2>
          <button className="icon-button" type="button" onClick={onClose} disabled={submitting} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        {!initial ? (
          <div className="capture-tabs" role="tablist" aria-label="Inspiration type">
            {TABS.map(({ value, label }) => (
              <button
                key={value}
                className={tab === value ? "capture-tab active" : "capture-tab"}
                type="button"
                role="tab"
                aria-selected={tab === value}
                onClick={() => {
                  setTab(value);
                  setError(null);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        <form className="capture-form" onSubmit={submit}>
          {tab === "link" ? (
            <div className="field wide-field">
              <span>URL</span>
              {initial && sourceUrl && !editingSourceUrl ? (
                <div className="saved-url-row">
                  <a className="saved-url-link" href={sourceUrl} target="_blank" rel="noreferrer" title={sourceUrl}>
                    <span>{sourceUrl}</span>
                  </a>
                  <button className="url-edit-button" type="button" onClick={() => setEditingSourceUrl(true)}>
                    <Pencil size={14} aria-hidden="true" />
                    Edit
                  </button>
                </div>
              ) : (
                <div className="url-editor-row">
                  <input
                    type="url"
                    value={sourceUrl}
                    onChange={(event) => setSourceUrl(event.target.value)}
                    placeholder="Paste a link"
                    required
                    autoFocus
                  />
                  {initial ? (
                    <button
                      className="url-edit-button"
                      type="button"
                      onClick={() => {
                        setSourceUrl(initial.sourceUrl ?? "");
                        setEditingSourceUrl(false);
                      }}
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}

          {tab === "image" && !initial ? (
            <label className={previewUrl ? "dropzone has-preview" : "dropzone"} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                onChange={(event) => acceptFile(event.target.files?.[0])}
              />
              {previewUrl ? (
                <img src={previewUrl} alt="Selected upload preview" />
              ) : (
                <>
                  <span className="upload-symbol"><Upload size={22} /></span>
                  <strong>Drop or choose an image</strong>
                  <small>Up to 25 MB</small>
                </>
              )}
              {previewUrl ? <span className="replace-image">Choose another image</span> : null}
            </label>
          ) : null}

          {tab === "image" && initial?.imageUrl ? (
            <div className="existing-image">
              <img src={initial.imageUrl} alt={initial.title || "Saved inspiration"} />
            </div>
          ) : null}

          {tab === "note" ? (
            <label className="field wide-field">
              <span>Your note</span>
              <textarea
                className="note-input"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Write something worth keeping…"
                rows={6}
                required={!title}
                autoFocus={!initial}
              />
            </label>
          ) : null}

          <label className="field wide-field">
            <span>Tags <em>optional</em></span>
            <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="design, typography, someday" />
          </label>

          <details className="optional-details">
            <summary>{initial ? "More details" : "Add details"}</summary>
            <div className="optional-fields">
              <label className="field">
                <span>Title <em>optional</em></span>
                <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give it a name" />
              </label>

              {tab === "image" ? (
                <label className="field">
                  <span>Original source <em>optional</em></span>
                  <input
                    type="url"
                    value={sourceUrl}
                    onChange={(event) => setSourceUrl(event.target.value)}
                    placeholder="https://where-you-found-it.com"
                  />
                </label>
              ) : null}

              {tab !== "note" ? (
                <label className="field">
                  <span>Personal note <em>optional</em></span>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Why do you want to keep this?"
                    rows={2}
                  />
                </label>
              ) : null}
            </div>
          </details>

          {error ? <p className="form-error" role="alert">{error}</p> : null}
          {submitting && progress > 0 ? (
            <div className="upload-progress" aria-label={`Upload ${progress}% complete`}>
              <span style={{ width: `${progress}%` }} />
            </div>
          ) : null}

          <footer className="modal-footer">
            <button className="primary-button modal-save" type="submit" disabled={submitting}>
              {submitting ? <LoaderCircle className="spin" size={18} /> : null}
              {submitting ? (progress ? `Uploading ${progress}%` : "Saving…") : initial ? "Save" : "Add inspiration"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function parseTags(value: string) {
  return [...new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))].slice(0, 12);
}

function safeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "image";
}

function safeOwnerPath(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 120);
}

function toTab(kind: InspirationKind): CaptureTab {
  return kind === "quote" ? "note" : kind;
}
