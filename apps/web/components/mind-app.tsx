"use client";

import {
  ArrowUp,
  LoaderCircle,
  LogOut,
  Plug,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  X
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiResult, Inspiration, InspirationKind } from "@/lib/inspirations";
import { readApiError } from "@/lib/api";
import { withBasePath } from "@/lib/base-path";
import { CaptureModal } from "@/components/capture-modal";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { InspirationCard } from "@/components/inspiration-card";
import { ExtensionAccessModal } from "@/components/extension-access-modal";

type Filter = "all" | InspirationKind | "favorite";

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "Everything" },
  { value: "link", label: "Links" },
  { value: "image", label: "Images" },
  { value: "note", label: "Notes" },
  { value: "quote", label: "Quotes" },
  { value: "favorite", label: "Favorites" }
];

const EMPTY_FILTER_COPY: Record<Exclude<Filter, "all">, { title: string; description: string }> = {
  link: {
    title: "No links here yet",
    description: "Save a page you want to find again."
  },
  image: {
    title: "No images here yet",
    description: "Add the first visual that belongs in this space."
  },
  note: {
    title: "No notes here yet",
    description: "Write down a thought you want to keep."
  },
  quote: {
    title: "No quotes here yet",
    description: "Save the first line worth remembering."
  },
  favorite: {
    title: "No favorites yet",
    description: "Use the heart on an inspiration to keep it close."
  }
};

type MindAppProps = {
  user: { id: string; name: string; email: string; isAdmin: boolean };
};

export function MindApp({ user }: MindAppProps) {
  const [items, setItems] = useState<Inspiration[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Inspiration | null>(null);
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Inspiration | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 260);
    return () => window.clearTimeout(timer);
  }, [query]);

  const loadItems = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    const parameters = new URLSearchParams({ limit: "80" });
    if (debouncedQuery) parameters.set("query", debouncedQuery);
    if (filter === "favorite") parameters.set("favorite", "true");
    else if (filter !== "all") parameters.set("kind", filter);
    if (selectedLabel) parameters.set("tag", selectedLabel);

    try {
      const response = await fetch(withBasePath(`/api/inspirations?${parameters}`), { signal, cache: "no-store" });
      const result = (await response.json()) as ApiResult<{ items: Inspiration[]; labels: string[] }>;
      if (!response.ok || !result.ok) throw new Error(readApiError(result));
      setItems(result.data?.items ?? []);
      setLabels(result.data?.labels ?? []);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError("Your archive could not be loaded. Check the Neon connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, filter, selectedLabel]);

  useEffect(() => {
    const controller = new AbortController();
    void loadItems(controller.signal);
    return () => controller.abort();
  }, [loadItems]);

  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if (event.key === "/" && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key.toLowerCase() === "n" && !typing && !modalOpen) {
        event.preventDefault();
        setEditing(null);
        setModalOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [modalOpen]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    function updateScrollButton() {
      setShowScrollTop(window.scrollY > 420);
    }

    updateScrollButton();
    window.addEventListener("scroll", updateScrollButton, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollButton);
  }, []);

  function handleSaved(saved: Inspiration, message: string) {
    setItems((current) => {
      const exists = current.some((item) => item.id === saved.id);
      return exists ? current.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...current];
    });
    setLabels((current) => [...new Set([...current, ...saved.tags])].sort((left, right) => left.localeCompare(right)));
    setToast(message);
    setEditing(null);
    setModalOpen(false);
  }

  async function toggleFavorite(item: Inspiration) {
    const previous = item.favorite;
    setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, favorite: !previous } : entry)));
    try {
      const response = await fetch(withBasePath(`/api/inspirations/${item.id}`), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ favorite: !previous })
      });
      const result = (await response.json()) as ApiResult<{ inspiration: Inspiration }>;
      if (!response.ok || !result.ok || !result.data) throw new Error(readApiError(result));
      setItems((current) =>
        current.map((entry) => (entry.id === item.id ? result.data!.inspiration : entry))
      );
    } catch {
      setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, favorite: previous } : entry)));
      setToast("That change could not be saved.");
    }
  }

  async function deleteItem(item: Inspiration) {
    setDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch(withBasePath(`/api/inspirations/${item.id}`), { method: "DELETE" });
      const result = (await response.json()) as ApiResult<{ id: string }>;
      if (!response.ok || !result.ok) throw new Error(readApiError(result));
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setPendingDelete(null);
      setToast("Inspiration removed.");
    } catch {
      setDeleteError("That inspiration could not be removed. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  async function logout() {
    setLoggingOut(true);
    try {
      const { getAuthClient } = await import("@/app/lib/auth-client");
      await getAuthClient().signOut();
    } finally {
      window.location.replace(withBasePath("/"));
    }
  }

  const isEmpty = !loading && !error && items.length === 0;
  const hasSearchOrLabel = Boolean(query.trim() || selectedLabel);
  const emptyCopy = hasSearchOrLabel
    ? {
        title: "Nothing matches that thought",
        description: "Try another word or clear the active label."
      }
    : filter === "all"
      ? {
          title: "Your mind has room",
          description: "Start with a link, an image, or a note you want to meet again."
        }
      : EMPTY_FILTER_COPY[filter];

  return (
    <main className={isEmpty ? "mind-shell has-empty-state" : "mind-shell"} id="top">
      <header className="topbar">
        <label className="search-field">
          <Search size={18} aria-hidden="true" />
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search what you remember…"
            aria-label="Search inspirations"
          />
          {query ? (
            <button className="icon-button quiet" type="button" onClick={() => setQuery("")} aria-label="Clear search">
              <X size={16} />
            </button>
          ) : (
            <kbd>/</kbd>
          )}
        </label>

        <a className="brand" href={withBasePath("/welcome")} aria-label="Open the Gocheski Mind landing page">
          <span className="brand-logo-frame" aria-hidden="true">
            <img className="brand-logo" src={withBasePath("/gajret-logo.svg")} alt="" draggable="false" />
          </span>
        </a>

        <div className="topbar-actions">
          {user.isAdmin ? (
            <a className="logout-button admin-nav-button" href={withBasePath("/admin")}>
              <ShieldCheck size={17} />
              <span>Admin</span>
            </a>
          ) : null}
          <button className="logout-button" type="button" onClick={() => setExtensionModalOpen(true)}>
            <Plug size={17} />
            <span>Extension</span>
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus size={18} />
            <span>Add inspiration</span>
          </button>
          <button
            className="logout-button"
            type="button"
            onClick={() => void logout()}
            disabled={loggingOut}
            aria-label="Log out"
          >
            {loggingOut ? <LoaderCircle className="spin" size={17} /> : <LogOut size={17} />}
            <span>Log out</span>
          </button>
        </div>
      </header>

      <div className="filter-bar">
        <nav className="filters" aria-label="Filter inspirations by category">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              className={filter === value ? "filter-chip active" : "filter-chip"}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
            >
              {label}
            </button>
          ))}
        </nav>

        {labels.length ? (
          <nav className="label-filters" aria-label="Filter inspirations by label">
            <div className="label-filter-track">
              {labels.map((label) => (
                <button
                  key={label}
                  className={selectedLabel === label ? "label-chip active" : "label-chip"}
                  type="button"
                  onClick={() => setSelectedLabel((current) => current === label ? null : label)}
                  aria-pressed={selectedLabel === label}
                >
                  #{label}
                </button>
              ))}
            </div>
          </nav>
        ) : null}
      </div>

      {loading ? (
        <div className="loading-state" role="status">
          <LoaderCircle className="spin" size={26} />
          <span>Gathering your inspirations</span>
        </div>
      ) : error ? (
        <section className="empty-state error-state">
          <span className="empty-symbol">!</span>
          <h2>The archive is out of reach</h2>
          <p>{error}</p>
          <button className="secondary-button" type="button" onClick={() => void loadItems()}>
            Try again
          </button>
        </section>
      ) : items.length === 0 ? (
        <section className="empty-state">
          <span className="empty-symbol"><Sparkles size={28} /></span>
          <h2>{emptyCopy.title}</h2>
          <p>{emptyCopy.description}</p>
          {hasSearchOrLabel || filter === "favorite" ? (
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setQuery("");
                setFilter("all");
                setSelectedLabel(null);
              }}
            >
              Show everything
            </button>
          ) : (
            <button className="secondary-button" type="button" onClick={() => setModalOpen(true)}>
              <Plus size={17} /> Add your first piece
            </button>
          )}
        </section>
      ) : (
        <section className="masonry" aria-live="polite">
          {items.map((item) => (
            <InspirationCard
              key={item.id}
              item={item}
              onEdit={() => {
                setEditing(item);
                setModalOpen(true);
              }}
              onFavorite={() => void toggleFavorite(item)}
              onDelete={() => {
                setDeleteError(null);
                setPendingDelete(item);
              }}
            />
          ))}
        </section>
      )}

      <CaptureModal
        open={modalOpen}
        ownerId={user.id}
        initial={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
      />

      <ExtensionAccessModal open={extensionModalOpen} onClose={() => setExtensionModalOpen(false)} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this inspiration?"
        description="This will permanently remove it from your Mind. This action cannot be undone."
        confirmLabel="Delete inspiration"
        busyLabel="Deleting…"
        busy={deleting}
        error={deleteError}
        onCancel={() => {
          if (deleting) return;
          setPendingDelete(null);
          setDeleteError(null);
        }}
        onConfirm={() => {
          if (pendingDelete) void deleteItem(pendingDelete);
        }}
      />

      {showScrollTop ? (
        <button
          className="scroll-top-button"
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
        >
          <ArrowUp size={19} />
        </button>
      ) : null}

      {toast ? <div className="toast" role="status">{toast}</div> : null}
    </main>
  );
}
