# Gocheski Mind

A private inspiration board and companion Chrome extension for saving pages, links, selected text, and images.

## Repository

```text
apps/
  web/          Next.js board and capture API
  extension/    Manifest V3 Chrome extension
packages/
  contracts/    Types shared by the web app and extension
```

The web app uses Next.js, `@gotch/nextsignal`, Neon Postgres, Drizzle, and Vercel Blob. The extension uses a background service worker and Chrome's context-menu API; it does not inject a content script or request access to every website.

## Local web setup

1. Install workspace dependencies:

   ```bash
   npm install
   ```

2. Copy `apps/web/.env.example` to `apps/web/.env.local` and configure:

   - `DATABASE_URL` — Neon connection string.
   - `BLOB_READ_WRITE_TOKEN` — token for a public Vercel Blob store.
   - `ADMIN_TOKEN` — password for the Mind login screen.
   - `SESSION_SECRET` — secret used to sign the login cookie.
   - `MIND_EXTENSION_TOKEN` — separate secret accepted only by the extension capture endpoint.

3. Apply the committed database migration and start the app:

   ```bash
   npm run db:migrate
   npm run dev
   ```

## Chrome extension

Build the unpacked extension:

```bash
npm run build:extension
```

Then:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select `apps/extension/dist`.
4. Open the extension's **Settings** page and paste the same value used for `MIND_EXTENSION_TOKEN`.
5. Optionally add comma-separated default tags.

On macOS, this copies the local token without printing it to the terminal:

```bash
rg '^MIND_EXTENSION_TOKEN=' apps/web/.env.local | cut -d= -f2- | pbcopy
```

Right-click a page, link, text selection, or image and choose **Save to Mind**. Pages and links become link cards, selected text becomes a quote, and images are downloaded by the server and copied into Vercel Blob so they do not depend on the original host remaining available.

## Vercel

The Vercel project's Root Directory is `apps/web`, with source files outside the root enabled so it can consume `packages/contracts`. Environment variables belong to the existing `gocheski-mind` project.

Production builds use `/mind` as the default Next.js base path. The main `gocheski.com` project proxies `/mind/:path*` to `gocheski-mind.vercel.app/mind/:path*`.

Run `npm run db:migrate` against the production Neon database before using a migration that changes the schema.

## Capture security

The board uses the shared `ADMIN_TOKEN` login and signed `goch_admin_session` cookie. The Chrome extension does not receive that cookie or admin token. It uses `MIND_EXTENSION_TOKEN`, which is accepted only by `POST /api/extension/captures`.

Remote image capture accepts public HTTP(S) JPEG, PNG, WebP, GIF, or AVIF files up to 25 MB. Private network addresses and unsafe redirects are rejected.

## Commands

- `npm run dev` — start the web app
- `npm run check` — type-check all workspaces
- `npm test` — run web app tests
- `npm run build` — build the web app and extension
- `npm run build:web` — build only the web app
- `npm run build:extension` — build the unpacked Chrome extension
- `npm run db:generate` — generate a Drizzle migration
- `npm run db:migrate` — apply committed migrations
- `npm run db:push` — push schema changes while prototyping
