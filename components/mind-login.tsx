"use client";

import { useState, type FormEvent } from "react";
import { withBasePath } from "@/lib/base-path";

export function MindLogin() {
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(withBasePath("/api/auth/login"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        setMessage("That token did not work.");
        return;
      }

      window.location.replace(withBasePath("/"));
    } catch {
      setMessage("Login is unavailable right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page auth-page--centered">
      <form className="mind-login" onSubmit={login}>
        <a className="auth-home-link" href="/">Back to site</a>
        <h1>Mind</h1>
        <label>
          Access token
          <input
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            autoComplete="current-password"
            required
            autoFocus
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </button>
        {message ? <p className="auth-message">{message}</p> : null}
      </form>
    </main>
  );
}
