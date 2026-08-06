"use client";

import { LoaderCircle, LogOut } from "lucide-react";
import { useState } from "react";
import { getAuthClient } from "@/app/lib/auth-client";
import { withBasePath } from "@/lib/base-path";

export function MindLogin() {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function login() {
    setSubmitting(true);
    setMessage("");

    try {
      const callbackURL = `${window.location.origin}${withBasePath("/")}`;
      const result = await getAuthClient().signIn.social({
        provider: "google",
        callbackURL,
        errorCallbackURL: callbackURL
      });
      if (result.error) throw new Error(result.error.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Google sign-in is unavailable right now.");
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page auth-page--centered">
      <section className="mind-login">
        <a className="auth-home-link" href="/">Back to site</a>
        <h1>Mind</h1>
        <p className="auth-intro">Your private place for everything worth remembering.</p>
        <button className="google-sign-in" type="button" onClick={() => void login()} disabled={submitting}>
          {submitting ? <LoaderCircle className="spin" size={18} /> : <GoogleMark />}
          {submitting ? "Opening Google…" : "Continue with Google"}
        </button>
        {message ? <p className="auth-message">{message}</p> : null}
      </section>
    </main>
  );
}

export function MindAccessDenied({ email }: { email: string }) {
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await getAuthClient().signOut();
    window.location.replace(withBasePath("/"));
  }

  return (
    <main className="auth-page auth-page--centered">
      <section className="mind-login">
        <h1>Mind</h1>
        <p className="auth-intro"><strong>{email}</strong> does not have access yet.</p>
        <p className="auth-message">Add this address to MIND_ALLOWED_EMAILS in Vercel, then redeploy.</p>
        <button className="google-sign-in" type="button" onClick={() => void logout()} disabled={loggingOut}>
          {loggingOut ? <LoaderCircle className="spin" size={18} /> : <LogOut size={18} />}
          Sign out
        </button>
      </section>
    </main>
  );
}

export function AuthUnavailable() {
  return (
    <main className="auth-page auth-page--centered">
      <section className="mind-login">
        <h1>Mind</h1>
        <p className="auth-intro">Google sign-in is ready in the code and needs to be connected to Neon.</p>
        <p className="auth-message">Configure NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET to continue.</p>
      </section>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.482h4.844a4.14 4.14 0 0 1-1.797 2.716v2.259h2.909c1.702-1.567 2.684-3.875 2.684-6.616Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.468-.806 5.956-2.179l-2.91-2.259c-.805.54-1.835.86-3.046.86-2.344 0-4.328-1.585-5.037-3.714H.956v2.332A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.963 10.708A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.281-1.708V4.96H.956A9 9 0 0 0 0 9c0 1.452.347 2.827.956 4.04l3.007-2.332Z" />
      <path fill="#EA4335" d="M9 3.578c1.322 0 2.508.454 3.441 1.346l2.582-2.582C13.464.89 11.426 0 9 0A9 9 0 0 0 .956 4.96l3.007 2.332C4.672 5.163 6.656 3.578 9 3.578Z" />
    </svg>
  );
}
