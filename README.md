# Gocheski Mind

A multi-user inspiration board and companion Chrome extension for saving pages, links, selected text, and images.

## Repository

```text
apps/
  web/          Next.js board and capture API
  extension/    Manifest V3 Chrome extension
packages/
  contracts/    Types shared by the web app and extension
```

The web app uses Next.js, `@gotch/nextsignal`, Neon Postgres, Drizzle, and Vercel Blob. The extension uses a background service worker and Chrome's context-menu API. It has no always-running content script or access to every website; it injects only a temporary status toast after an explicit capture action.

## Local web setup

1. Install workspace dependencies:

   ```bash
   npm install
   ```

2. Copy the single environment template, `apps/web/.env.example`, to `apps/web/.env.local` and configure:

   - `DATABASE_URL` — Neon connection string.
   - `BLOB_READ_WRITE_TOKEN` — token for a public Vercel Blob store.
   - `NEON_AUTH_BASE_URL` — Auth URL shown after enabling Neon Auth.
   - `NEON_AUTH_COOKIE_SECRET` — random secret of at least 32 characters used for cached session cookies.
   - `MIND_ALLOWED_EMAILS` — comma-separated Google addresses allowed into the app; leave empty for open registration.

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
4. Sign into Mind, choose **Extension**, and generate a personal extension key.
5. Open the extension's **Settings** page and paste that key.
6. Optionally add comma-separated default tags.

The published Chrome Web Store extension (`ecnghadaoncoimohifncimlgpacnicom`) supports automatic setup: click **Connect to Mind** in its popup, sign in on the website, review the capture disclosure, and approve the connection. Unpacked builds have a different extension ID, so manual key entry remains available for local development.

Right-click a page, link, text selection, or image and choose **Save to Mind**. A temporary toast on the current page reports saving, success, duplicate, or error status. Pages and links become link cards, selected text becomes a quote, and images are downloaded by the server and copied into Vercel Blob so they do not depend on the original host remaining available.

## Vercel

The Vercel project's Root Directory is `apps/web`, with source files outside the root enabled so it can consume `packages/contracts`. Environment variables belong to the existing `gocheski-mind` project.

Production builds use `/mind` as the default Next.js base path. The main `gocheski.com` project proxies `/mind/:path*` to `gocheski-mind.vercel.app/mind/:path*`.

Run `npm run db:migrate` against the production Neon database before using a migration that changes the schema.

## Authentication and capture security

The board uses Neon Auth with Google OAuth. Every inspiration, label, duplicate check, upload, edit, and delete is scoped to the authenticated Neon user ID.

After the original owner signs in once, transfer pre-authentication records from the Neon SQL Editor. First find the user ID:

```sql
SELECT id, email
FROM neon_auth.user
WHERE lower(email) = lower('you@example.com');
```

Then replace `YOUR_NEON_AUTH_USER_ID` below with that result and run the transfer in one transaction:

```sql
BEGIN;

UPDATE inspirations
SET owner_id = 'YOUR_NEON_AUTH_USER_ID'
WHERE owner_id IS NULL;

UPDATE tags
SET owner_id = 'YOUR_NEON_AUTH_USER_ID'
WHERE owner_id IS NULL;

COMMIT;
```

The Chrome extension does not receive the Google session. Each browser receives a random, revocable capture key from the web app, either through the Web Store connection page or through manual setup. Only its SHA-256 hash is stored in Postgres, and the key is accepted only by `POST /api/extension/captures`. The production connection page can message only the published Web Store extension, and the extension accepts setup messages only from the exact `https://www.gocheski.com/mind/extension/connect` page.

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
