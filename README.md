# Stremio HUN 🇭🇺

A Stremio addon that provides localized metadata, curated catalogs, and Hungarian public live-TV channels.

> [!NOTE]
> This addon supports two locales out of the box with language-specific API routes:
>
> - `hu-HU`
> - `en-US`
>
> You can adapt it further by:
>
> - updating [`translations/hu-HU.json`](translations/hu-HU.json) and [`translations/en-US.json`](translations/en-US.json), and
> - replacing the curated lists in [`src/server/lib/sources/mdblist-lists.json`](src/server/lib/sources/mdblist-lists.json).

## Features

- **Hungarian metadata** — Localized titles, descriptions, cast info, and images via TMDB
- **Curated catalogs** — Daily top 10 lists from major streaming platforms in Hungary (data from [FlixPatrol](https://flixpatrol.com)):
  - Netflix Magyarország
  - HBO Max Magyarország
  - Disney+ Magyarország
  - Amazon Prime Video Magyarország
  - Apple TV+ Magyarország
- **Search** — Find movies and TV shows with localized metadata
- **Popular content** — Browse trending movies and series
- **Live TV** — Watch public Hungarian channels from Mediaklikk:
  - M1
  - M2
  - M4 Sport
  - M5
  - Duna TV

Live-TV stream URLs are discovered from Mediaklikk and cached in SQLite. Recently cached URLs can be used as a fallback when the upstream service is temporarily unavailable.

## Install and API routes

The landing page at `/` provides install links for both supported locales. The manifest URLs are:

- Hungarian: `/api/hu-HU/manifest.json`
- English: `/api/en-US/manifest.json`

The `.json` suffix is required by Stremio and is handled transparently by the server. Unsupported language routes are rejected with an error response.

Live-TV endpoints use the following shapes:

- Catalog: `/api/{language}/catalog/tv/mediaklikk.json`
- Metadata: `/api/{language}/meta/tv/mediaklikk-{channel}.json`
- Stream: `/api/{language}/stream/tv/mediaklikk-{channel}.json`

Supported channel IDs are `m1`, `m2`, `m4`, `m5`, and `duna`.

## Tech Stack

- [Hono](https://hono.dev/) web framework on Node.js
- TypeScript with Zod validation
- TMDB and MDBList APIs
- SQLite through Node's `node:sqlite` API and Drizzle ORM
- LogTape structured logging
- Docker deployment

## Setup

### Environment Variables

| Variable                          | Required | Default      | Description                                                                       |
| --------------------------------- | -------- | ------------ | --------------------------------------------------------------------------------- |
| `ADDON_URL`                       | Yes      | —            | Public URL where the addon is hosted                                              |
| `TMDB_ACCESS_TOKEN`               | Yes      | —            | TMDB API access token                                                             |
| `MDBLIST_API_KEY`                 | Yes      | —            | MDBList API key                                                                   |
| `DB_PATH`                         | Yes      | —            | Path to the SQLite database file                                                  |
| `NODE_ENV`                        | No       | `production` | Runtime environment; development enables pretty logging and repository migrations |
| `PORT`                            | No       | `3000`       | Server port                                                                       |
| `TMDB_LANGUAGE`                   | No       | `hu-HU`      | Default language used on the landing page                                         |
| `RATE_LIMIT_ENABLED`              | No       | `true`       | Enable rate limiting                                                              |
| `RATE_LIMIT_WINDOW`               | No       | `60`         | Rate-limit window in seconds                                                      |
| `RATE_LIMIT_MAX_REQUESTS`         | No       | `250`        | Maximum requests per IP in the rate-limit window                                  |
| `HTTP_CACHE_ENABLED`              | No       | `true`       | Enable HTTP response caching                                                      |
| `APP_VERSION`                     | No       | `0.0.0-dev`  | Version shown in the Stremio manifest                                             |
| `MEDIAKLIKK_CACHE_TTL`            | No       | `300`        | Accept cached live-TV URLs for this many seconds                                  |
| `MEDIAKLIKK_CACHE_MAX_STALE_TIME` | No       | `86400`      | Maximum age of a stale live-TV URL used as fallback                               |

### Run with Docker

```sh
docker build -t stremio-hun .
docker run -p 3000:3000 \
  -e ADDON_URL=https://your-domain.com \
  -e TMDB_ACCESS_TOKEN=your_token \
  -e MDBLIST_API_KEY=your_key \
  -v ./data:/data \
  stremio-hun
```

The image sets `DB_PATH=/data/database.db` and `NODE_ENV=production`. Keep the `/data` volume so the SQLite database survives container updates. Drizzle migrations are included in the production build and applied automatically at startup.

### Run locally

```sh
pnpm install
pnpm dev
```

The development server runs on the configured `PORT` (default `3000`) and loads variables from `.env` when present. Set `ADDON_URL`, `TMDB_ACCESS_TOKEN`, `MDBLIST_API_KEY`, and `DB_PATH` before starting the server. Database parent directories are created automatically and Drizzle migrations are applied at startup.

To create a migration after changing [`src/server/db/schema.ts`](src/server/db/schema.ts):

```sh
pnpm exec drizzle-kit generate
```
