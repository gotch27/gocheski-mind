"use client";

import { ArrowLeft, LoaderCircle, RefreshCw, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
import type { AdminUser } from "@/lib/admin-users";
import type { ApiResult } from "@/lib/inspirations";
import { readApiError } from "@/lib/api";
import { withBasePath } from "@/lib/base-path";
import { ConfirmDialog } from "@/components/confirm-dialog";

type AdminUsersProps = {
  initialItems: AdminUser[];
  currentUserId: string;
};

export function AdminUsers({ initialItems, currentUserId }: AdminUsersProps) {
  const [items, setItems] = useState(initialItems);
  const [pendingBlock, setPendingBlock] = useState<AdminUser | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockError, setBlockError] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(withBasePath("/api/admin/users"), { cache: "no-store" });
      const result = (await response.json()) as ApiResult<{ items: AdminUser[] }>;
      if (!response.ok || !result.ok) throw new Error(readApiError(result));
      setItems(result.data?.items ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Users could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  async function setBlocked(user: AdminUser, blocked: boolean) {
    setUpdatingId(user.id);
    setError(null);
    setBlockError(null);
    try {
      const response = await fetch(withBasePath(`/api/admin/users/${user.id}`), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ blocked })
      });
      const result = (await response.json()) as ApiResult<{ item: AdminUser }>;
      if (!response.ok || !result.ok || !result.data) throw new Error(readApiError(result));
      setItems((current) => current.map((item) => item.id === user.id ? result.data!.item : item));
      setPendingBlock(null);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "User access could not be changed.";
      if (blocked) setBlockError(message);
      else setError(message);
    } finally {
      setUpdatingId(null);
    }
  }

  const activeCount = items.filter((item) => !item.blocked).length;
  const blockedCount = items.length - activeCount;

  return (
    <main className="admin-page">
      <header className="admin-topbar">
        <a className="admin-brand" href={withBasePath("/welcome")} aria-label="Open the Gocheski Mind landing page">
          <img src={withBasePath("/gajret-logo.svg")} alt="" aria-hidden="true" />
          <span>Mind Admin</span>
        </a>
        <a className="secondary-button" href={withBasePath("/")}>
          <ArrowLeft size={16} /> Back to Mind
        </a>
      </header>

      <section className="admin-heading">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>People in Mind</h1>
          <p>Anyone can sign in. You decide who keeps access.</p>
        </div>
        <button className="secondary-button" type="button" onClick={() => void loadUsers()} disabled={loading}>
          <RefreshCw className={loading ? "spin" : undefined} size={16} />
          Refresh
        </button>
      </section>

      <section className="admin-stats" aria-label="User totals">
        <div><strong>{items.length}</strong><span>Total users</span></div>
        <div><strong>{activeCount}</strong><span>Active</span></div>
        <div><strong>{blockedCount}</strong><span>Blocked</span></div>
      </section>

      {error ? <p className="form-error admin-error" role="alert">{error}</p> : null}

      <section className="admin-user-list" aria-label="Mind users">
        {items.map((user) => {
          const isUpdating = updatingId === user.id;
          return (
            <article className="admin-user-row" key={user.id}>
              <span className="admin-user-avatar" aria-hidden="true">
                {user.image ? <img src={user.image} alt="" /> : initials(user.name)}
              </span>
              <div className="admin-user-identity">
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
              <time dateTime={user.createdAt}>Joined {formatDate(user.createdAt)}</time>
              <span className={user.blocked ? "admin-status blocked" : user.isAdmin ? "admin-status administrator" : "admin-status"}>
                {user.blocked ? "Blocked" : user.isAdmin ? "Admin" : "Active"}
              </span>
              <div className="admin-user-action">
                {user.isAdmin || user.id === currentUserId ? (
                  <span className="admin-protected"><ShieldCheck size={15} /> Protected</span>
                ) : user.blocked ? (
                  <button className="secondary-button" type="button" onClick={() => void setBlocked(user, false)} disabled={isUpdating}>
                    {isUpdating ? <LoaderCircle className="spin" size={15} /> : <UserCheck size={15} />}
                    Unblock
                  </button>
                ) : (
                  <button
                    className="admin-block-button"
                    type="button"
                    onClick={() => {
                      setBlockError(null);
                      setPendingBlock(user);
                    }}
                  >
                    <UserX size={15} /> Block
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>

      <ConfirmDialog
        open={Boolean(pendingBlock)}
        title="Block this user?"
        description={`${pendingBlock?.name ?? "This user"} will be signed out immediately and their Chrome extension access will be revoked.`}
        confirmLabel="Block user"
        busyLabel="Blocking…"
        busy={Boolean(pendingBlock && updatingId === pendingBlock.id)}
        error={blockError}
        icon={<UserX size={20} />}
        onCancel={() => {
          if (updatingId) return;
          setPendingBlock(null);
          setBlockError(null);
        }}
        onConfirm={() => {
          if (pendingBlock) void setBlocked(pendingBlock, true);
        }}
      />
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}
