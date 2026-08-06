# Gocheski Mind Agent Guide

Gocheski Mind is a private inspiration board and Chrome extension built with Next.js, `@gotch/nextsignal`, Neon Postgres, Drizzle, and Vercel Blob.

## Commands

- `npm run dev` — start web development
- `npm run check` — type-check every workspace
- `npm test` — run Vitest for the web app
- `npm run build` — build the web app and Chrome extension
- `npm run build:web` — build only the web app
- `npm run build:extension` — build the unpacked extension into `apps/extension/dist`
- `npm run db:generate` — generate a Drizzle migration
- `npm run db:migrate` — apply committed migrations
- `npm run db:push` — push schema changes while prototyping

## Project map

- `apps/web/` contains the Next.js application.
- `apps/web/app/api/**/route.ts` contains thin Next.js route handlers.
- `apps/web/nextsignal/app.ts` composes the Next Signal application.
- `apps/web/nextsignal/processes/api/` contains HTTP-facing processes.
- `apps/web/nextsignal/processes/business/` contains reusable application processes.
- `apps/web/nextsignal/services/` contains database, Blob, and link-metadata integrations.
- `apps/web/nextsignal/config.ts` is the centralized environment configuration boundary.
- `apps/web/db/` contains the Drizzle client and schema.
- `apps/web/drizzle/` contains committed migrations.
- `apps/extension/` contains the Manifest V3 extension source and build script.
- `packages/contracts/` contains request and response types shared across browser and server.

## Conventions

- Keep route handlers thin and bind them with `createNextRoute`.
- API processes own authentication, input validation, and orchestration.
- Business processes own reusable application behavior.
- Provider SDKs and database access belong in services, not processes.
- Return Next Signal result envelopes for expected outcomes.
- Use `forwardFault` when forwarding a failed mediator result.
- Use `validateWith` with schemas from `apps/web/nextsignal/schemas.ts`.
- Use the `@/` import alias inside the web app.
- Keep TypeScript strict-friendly.
- Keep the extension free of always-running content scripts. Its scripting permission is limited to injecting a temporary toast after an explicit context-menu capture.
- Run `npm run check` after TypeScript changes and `npm run build` after larger changes.

The web app uses Neon Auth with Google OAuth. Every inspiration and label must be scoped by the authenticated Neon user ID. The extension uses a separate, hashed, revocable token per user that only authorizes new captures. Keep those trust boundaries intact.

The app intentionally has no background worker, queue, or scheduler. Add those only when the product requires them.
