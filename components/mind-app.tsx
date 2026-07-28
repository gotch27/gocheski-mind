"use client";

import {
  LoaderCircle,
  Plus,
  Search,
  Sparkles,
  X
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiResult, Inspiration, InspirationKind } from "@/lib/inspirations";
import { readApiError } from "@/lib/api";
import { withBasePath } from "@/lib/base-path";
import { CaptureModal } from "@/components/capture-modal";
import { InspirationCard } from "@/components/inspiration-card";

type Filter = "all" | InspirationKind | "favorite";

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "Everything" },
  { value: "link", label: "Links" },
  { value: "image", label: "Images" },
  { value: "note", label: "Notes" },
  { value: "favorite", label: "Favorites" }
];

export function MindApp() {
  const [items, setItems] = useState<Inspiration[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Inspiration | null>(null);
  const [toast, setToast] = useState<string | null>(null);
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

    try {
      const response = await fetch(withBasePath(`/api/inspirations?${parameters}`), { signal, cache: "no-store" });
      const result = (await response.json()) as ApiResult<{ items: Inspiration[] }>;
      if (!response.ok || !result.ok) throw new Error(readApiError(result));
      setItems(result.data?.items ?? []);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError("Your archive could not be loaded. Check the Neon connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, filter]);

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

  function handleSaved(saved: Inspiration, message: string) {
    setItems((current) => {
      const exists = current.some((item) => item.id === saved.id);
      return exists ? current.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...current];
    });
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
    if (!window.confirm("Remove this inspiration from your archive?")) return;
    try {
      const response = await fetch(withBasePath(`/api/inspirations/${item.id}`), { method: "DELETE" });
      const result = (await response.json()) as ApiResult<{ id: string }>;
      if (!response.ok || !result.ok) throw new Error(readApiError(result));
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setToast("Inspiration removed.");
    } catch {
      setToast("That inspiration could not be removed.");
    }
  }

  return (
    <main className="mind-shell" id="top">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Gocheski Mind home">
          <span className="brand-logo-frame" aria-hidden="true">
            <img className="brand-logo" src={withBasePath("/goch-logo.svg")} alt="" draggable="false" />
          </span>
        </a>

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
      </header>

      <nav className="filters" aria-label="Filter inspirations">
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
          <h2>{query || filter !== "all" ? "Nothing matches that thought" : "Your mind has room"}</h2>
          <p>
            {query || filter !== "all"
              ? "Try another word or return to everything."
              : "Start with a link, an image, or a note you want to meet again."}
          </p>
          {query || filter !== "all" ? (
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setQuery("");
                setFilter("all");
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
              onDelete={() => void deleteItem(item)}
            />
          ))}
        </section>
      )}

      <CaptureModal
        open={modalOpen}
        initial={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
      />

      {toast ? <div className="toast" role="status">{toast}</div> : null}
    </main>
  );
}
