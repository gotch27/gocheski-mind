"use client";

import { ArrowUpRight, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { getAuthClient } from "@/app/lib/auth-client";
import { withBasePath } from "@/lib/base-path";

export function MindLanding({ signedIn = false }: { signedIn?: boolean }) {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function login() {
    if (submitting) return;
    if (signedIn) {
      window.location.assign(withBasePath("/"));
      return;
    }
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
    <main className="landing-page">
      <header className="landing-nav">
        <a className="landing-brand" href={signedIn ? withBasePath("/welcome") : withBasePath("/")} aria-label="Gocheski Mind home">
          <img src={withBasePath("/gajret-logo.svg")} alt="" aria-hidden="true" />
          <span>Gocheski Mind</span>
        </a>

        <button className="landing-login" type="button" onClick={() => void login()} disabled={submitting}>
          {submitting ? <LoaderCircle className="spin" size={16} /> : null}
          {submitting ? "Opening…" : signedIn ? "Open Mind" : "Log in"}
        </button>
      </header>

      <section className="landing-hero">
        <h1>The internet moves fast.<br />Keep what moves you.</h1>
        <p className="landing-intro">
          One quiet place for the images, links, words, and ideas you want to find again.
        </p>
        <button className="landing-cta" type="button" onClick={() => void login()} disabled={submitting}>
          {submitting ? <LoaderCircle className="spin" size={20} /> : null}
          {submitting ? "Opening Google…" : "Open your Mind"}
          {!submitting ? <ArrowUpRight size={20} /> : null}
        </button>
        {message ? <p className="landing-error" role="alert">{message}</p> : null}
      </section>

      <section className="landing-demo" aria-label="Gocheski Mind product demo">
        <span className="landing-tape landing-tape-top" aria-hidden="true" />
        <span className="landing-tape landing-tape-bottom" aria-hidden="true" />
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src={withBasePath("/mind-demo-v1.mp4")} type="video/mp4" />
          Your browser does not support HTML video.
        </video>
      </section>

      <footer className="landing-footer">
        <a href={withBasePath("/privacy")}>Privacy</a>
      </footer>
    </main>
  );
}
