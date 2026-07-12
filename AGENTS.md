# AGENTS.md

## Project Overview

Stremio Hun is a small full-stack Stremio addon for Hungarian viewers. Its goals are:

- Curated catalogs relevant to Hungary, including streaming-platform top lists.
- Optional Hungarian metadata from TMDB, including localized posters and logo images.
- Search for movies and series using Hungarian metadata.
- Hungarian live TV streams from public national channels. Commercial channels are intentionally out of scope for now.

Keep the project small and easy to understand. Prefer direct functions and existing local patterns. Do not introduce Nest.js-style layering, unnecessary abstractions, or framework machinery without a clear need.

## Stack and Runtime

- Node.js, TypeScript, and ESM.
- Vite 8 for the build and development server.
- Nitro's Vite integration for the production server bundle.
- Hono for HTTP routing, adapted through `srvx`.
- React 19 with TanStack Router for the landing page.
- Tailwind CSS 4 through the Vite plugin.
- SQLite through Node's `node:sqlite` API and Drizzle ORM.
- pnpm 10.10.0. Use pnpm; keep `pnpm-lock.yaml` in sync when dependencies change.

## External Services

- **TMDB** provides movie and series metadata, including localized titles, descriptions, credits, posters, logos, and search results. The integration is in `src/server/lib/sources/tmdb-api.ts` and requires `TMDB_ACCESS_TOKEN`.
- **MDBList** provides the curated streaming-service lists used to build catalogs relevant to Hungary. Catalog definitions and list IDs are in `src/server/lib/sources/constants.ts` and `src/server/lib/sources/mdblist-lists.json`; requests require `MDBLIST_API_KEY`.
- **Mediaklikk** provides the currently supported public Hungarian live-TV channels. `src/server/lib/sources/mediaklikk-tv.ts` discovers HLS URLs from Mediaklikk's player, caches them in SQLite, and falls back to recently cached URLs when the upstream service is temporarily unavailable.

## Repository Layout

```text
src/
  client/
    main.tsx                 React entry point
    routeTree.gen.ts         Generated TanStack Router route tree; do not edit manually
    routes/                  File-based client routes
    utils/api.ts             Typed Hono client
    assets/main.css          Global Tailwind entry point
  server/
    index.ts                 Hono routes and srvx server entry point
    lib/
      addon.ts               Stremio manifest, metadata, catalog, search, and stream handlers
      constants.ts            Addon media-type constants
      schemas.ts              Route and query validation with Zod
      stremio.types.ts        Stremio response types
      sources/                TMDB, MDBList, and Mediaklikk integrations
      middlewares/            Server middleware such as rate limiting
    utils/                    Environment, database, cache, and protocol helpers
translations/
  i18n.ts                    Supported languages and translation lookup
  hu-HU.json                Hungarian UI/catalog translations
  en-US.json                English UI/catalog translations
public/                      Static images and other public assets
patches/                     Required patches for third-party packages
```

The README contains some historical `lib/...` paths. The current source paths are under `src/server/...` and `translations/...` as shown above.

## Request and Data Flow

- `src/server/index.ts` owns the HTTP surface under `/api`.
- Language is part of the API path: `/api/hu-HU/...` or `/api/en-US/...`. Route schemas reject unsupported languages.
- `src/server/lib/addon.ts` translates HTTP-level requests into Stremio manifests, metadata, catalog, search, and stream responses.
- TMDB and MDBList behavior lives in `src/server/lib/sources/`.
- `translations/i18n.ts` is the source of truth for supported languages and translation lookup. Add a translation file and update this module when adding a locale.
- The client uses the typed Hono client in `src/client/utils/api.ts`; keep client/server route types aligned.
- Live TV currently follows the `mediaklikk-*` ID convention and is implemented by `src/server/lib/sources/mediaklikk-tv.ts`. It discovers HLS URLs from Mediaklikk, caches them in SQLite, and exposes the catalog/meta/stream handlers through `addon.ts`.

## Common Commands

```sh
pnpm install
pnpm dev                 # Vite development server
pnpm build               # Production Vite/Nitro build into dist/
pnpm preview             # Run the built server
pnpm typecheck           # TypeScript native preview, no emit
pnpm lint:check          # Oxlint
pnpm fmt:check           # Oxfmt check
pnpm check               # typecheck + lint + format
pnpm fmt:fix             # Format files
pnpm lint:fix            # Apply Oxlint fixes
```

There is no test script currently. For behavior changes, use the narrowest available check and, where useful, run the built server with valid environment variables and exercise the affected HTTP endpoint.

## Code Style

- Write TypeScript with strict types and preserve the existing ESM import style, including `.ts` extensions.
- Use the configured path aliases: `#client/*`, `#server/*`, and `#translations/*`.
- Let Oxfmt handle formatting. It uses a 100-character print width and sorts imports.
- `src/client/routeTree.gen.ts` is excluded from formatting and generated by TanStack Router; do not hand-edit it.
- Use Zod schemas at HTTP boundaries and keep external data validation close to the integration that consumes it.
- Prefer small exported functions and straightforward control flow. Avoid one-off generic abstractions.
- Preserve existing public IDs and URL shapes, especially `tt...`, `tmdb-...`, and `mediaklikk-...` IDs.
- Do not add comments that merely narrate obvious code. Add only short comments for non-obvious constraints or fallback behavior.

## Environment and Local Data

The server validates environment variables at startup in `src/server/utils/env.ts`. Required values include `ADDON_URL`, `TMDB_ACCESS_TOKEN`, `MDBLIST_API_KEY`, and `DB_PATH`. Important optional settings include `PORT`, `TMDB_LANGUAGE`, rate-limit settings, HTTP-cache settings, and Mediaklikk cache TTLs. See the README for the complete table.

SQLite parent directories are created by `src/server/utils/db.ts`. Local SQLite runtime files may appear under `tmp/`; do not treat generated database files as source changes. Never commit API tokens or local `.env` files.

## CI/CD

Pull requests targeting `master` run:

- Conventional commit validation for the pull-request commit range.
- In parallel: format check, Oxlint, typecheck, and production build.
- Dependencies are installed with `pnpm install --frozen-lockfile` on Node.js 25.

Pushes to `master` run semantic-release using the configured GitHub token and may create a release. A published release triggers the Docker workflow, which builds and publishes `linux/amd64` and `linux/arm64` images to GHCR with semver tags and `latest`.

The Docker build uses a multi-stage Node 25 Alpine image, runs `pnpm build`, and starts `dist/server/index.mjs`. Runtime configuration is supplied through environment variables; persistent SQLite data is expected at `/data/database.db`.

## Change Guidance

1. Start at the owning route or handler, then follow the call into `addon.ts` and the relevant source module.
2. Keep language-specific behavior request-scoped; do not reintroduce module-level language state.
3. When changing an API route, update its Zod schema, handler, and typed client implications together.
4. When changing a source integration, consider rate limits, HTTP caching, stale cached values, upstream failures, and missing metadata.
5. When adding channels, update the typed channel registry and provide the matching public poster under `public/`.
6. Run `pnpm check` and `pnpm build` before considering a change complete. For changes to runtime behavior, also smoke-test the relevant `/api/:language/...` endpoint.
7. Avoid unrelated refactors and do not commit changes unless explicitly asked.
