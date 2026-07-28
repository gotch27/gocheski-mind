# Gocheski Mind Agent Guide

Gocheski Mind is a private inspiration board built with Next.js, `@gotch/nextsignal`, Neon Postgres, Drizzle, and Vercel Blob.

## Commands

- `npm run dev` — start local development
- `npm run check` — type-check the app
- `npm test` — run Vitest
- `npm run build` — create a production build
- `npm run db:generate` — generate a Drizzle migration
- `npm run db:migrate` — apply committed migrations
- `npm run db:push` — push schema changes while prototyping

## Project map

- `app/api/**/route.ts` contains thin Next.js route handlers.
- `nextsignal/app.ts` composes the Next Signal application.
- `nextsignal/processes/api/` contains HTTP-facing processes.
- `nextsignal/processes/business/` contains reusable application processes.
- `nextsignal/services/` contains database, Blob, and link-metadata integrations.
- `nextsignal/config.ts` is the centralized environment configuration boundary.
- `db/` contains the Drizzle client and schema.
- `drizzle/` contains committed migrations.

## Conventions

- Keep route handlers thin and bind them with `createNextRoute`.
- API processes own anonymous access, input validation, and orchestration.
- Business processes own reusable application behavior.
- Provider SDKs and database access belong in services, not processes.
- Return Next Signal result envelopes for expected outcomes.
- Use `forwardFault` when forwarding a failed mediator result.
- Use `validateWith` with schemas from `nextsignal/schemas.ts`.
- Use the `@/` import alias.
- Keep TypeScript strict-friendly.
- Run `npm run check` after TypeScript changes and `npm run build` after larger changes.

The app intentionally has no authentication, background worker, queue, or scheduler. Add those only when the product requires them.
