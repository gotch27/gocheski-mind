"use client";

import { ArrowUpRight, Heart, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { Inspiration } from "@/lib/inspirations";

type InspirationCardProps = {
  item: Inspiration;
  onEdit: () => void;
  onFavorite: () => void;
  onDelete: () => void;
};

export function InspirationCard({ item, onEdit, onFavorite, onDelete }: InspirationCardProps) {
  const isVisual = Boolean(item.imageUrl);
  const displayTitle = item.title || item.domain || (item.kind === "note" ? "Untitled note" : "Saved inspiration");

  return (
    <article className={`inspiration-card kind-${item.kind}`}>
      {isVisual ? (
        <button className="card-image-button" type="button" onClick={onEdit} aria-label={`Edit ${displayTitle}`}>
          {/* Blob and source preview URLs are intentionally rendered directly. */}
          <img className="card-image" src={item.imageUrl!} alt={item.title || "Saved inspiration"} loading="lazy" />
        </button>
      ) : null}

      <div className={isVisual ? "card-body compact" : "card-body"}>
        <div className="card-kicker">
          <span>{item.kind}</span>
          <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
        </div>

        {item.kind === "quote" ? <span className="quote-mark">“</span> : null}
        <div
          className="card-copy"
          role="button"
          tabIndex={0}
          onClick={onEdit}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onEdit();
            }
          }}
        >
          <h2>{displayTitle}</h2>
          {item.content ? <p className={item.kind === "quote" ? "quote-copy" : undefined}>{item.content}</p> : null}
          {!item.content && item.metadata.description ? <p>{item.metadata.description}</p> : null}
          {item.note ? <p className="personal-note">{item.note}</p> : null}
        </div>

        {item.tags.length ? (
          <ul className="tag-list" aria-label="Tags">
            {item.tags.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
        ) : null}

        <footer className="card-footer">
          <span className="source-label">
            {item.metadata.faviconUrl ? (
              <img
                src={item.metadata.faviconUrl}
                alt=""
                aria-hidden="true"
                onError={(event) => { event.currentTarget.style.display = "none"; }}
              />
            ) : null}
            {item.domain || "From your mind"}
          </span>

          <div className="card-actions">
            <button
              className={item.favorite ? "card-action favorited" : "card-action"}
              type="button"
              onClick={onFavorite}
              aria-label={item.favorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart size={16} fill={item.favorite ? "currentColor" : "none"} />
            </button>
            <button className="card-action edit-action" type="button" onClick={onEdit} aria-label="Edit inspiration">
              <Pencil size={15} />
            </button>
            <button className="card-action delete-action" type="button" onClick={onDelete} aria-label="Delete inspiration">
              <Trash2 size={15} />
            </button>
            {item.sourceUrl ? (
              <a className="card-action" href={item.sourceUrl} target="_blank" rel="noreferrer" aria-label="Open original source">
                <ArrowUpRight size={17} />
              </a>
            ) : (
              <span className="card-action decorative"><MoreHorizontal size={17} /></span>
            )}
          </div>
        </footer>
      </div>
    </article>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Today";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}
