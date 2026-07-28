# Gocheski Mind

A private visual archive for links, images, and notes. The app is built with Next.js, Next Signal, Neon Postgres, Drizzle, and Vercel Blob.

## What it does

- Captures links and enriches them with titles, descriptions, favicons, and preview images.
- Uploads images directly from the browser to Vercel Blob.
- Stores notes, optional personal context, and tags.
- Presents everything in a responsive visual board.
- Searches titles, note content, domains, personal notes, and tags.
- Supports editing, favorites, deletion, URL deduplication, and type filters.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and add:

   - `DATABASE_URL` from Neon.
   - `BLOB_READ_WRITE_TOKEN` from a public Vercel Blob store.

3. Apply the committed Drizzle migration:

   ```bash
   npm run db:migrate
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

## Vercel setup

Connect the repository to Vercel, add the Neon integration or set `DATABASE_URL`, and connect a public Blob store. Vercel adds `BLOB_READ_WRITE_TOKEN` for the selected environments.

Production builds use `/mind` as the default Next.js base path so the app can sit behind a `gocheski.com/mind/:path*` rewrite. Set `NEXT_PUBLIC_BASE_PATH` explicitly if a deployment needs a different path.

Run `npm run db:migrate` against the production Neon database before using the deployment.

## Architecture

Route-facing work is modeled with Next Signal API processes. Reusable operations live in business processes, while database, metadata, and Blob capabilities live in `nextsignal/services`.

The Blob token exchange route is a small infrastructure exception to the standard Next Signal JSON route wrapper. File bytes go directly from the browser to Blob; the resulting URL and pathname are then saved through the normal `inspirations.create` process.

## Privacy note

The first release intentionally has no user accounts or in-app authentication. Anyone who can reach the deployment can read or change its contents, so keep the Vercel deployment private or protect it at the platform level.

## Commands

- `npm run dev` — local development
- `npm run check` — TypeScript check
- `npm test` — unit tests
- `npm run build` — production build
- `npm run db:generate` — generate a migration after schema changes
- `npm run db:migrate` — apply committed migrations
- `npm run db:push` — push schema changes during local prototyping
