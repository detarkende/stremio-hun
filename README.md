# Stremio HUN 🇭🇺

A Stremio addon that provides Hungarian-language metadata and curated catalogs for movies and TV shows.

> [!NOTE]
> While this addon is configured for Hungarian content out of the box, it's built with customizability in mind.
> You can adapt it to any language or region by:
>
> - changing the `TMDB_LANGUAGE` environment variable,
> - updating [`lib/translations.json`](lib/translations.json) with your translations, and
> - replacing the curated lists in [`lib/sources/mdblist-lists.json`](lib/sources/mdblist-lists.json).

## Features

- **Hungarian metadata** — Localized titles, descriptions, cast info, and images via TMDB
- **Curated catalogs** — Daily top 10 lists from major streaming platforms in Hungary (data from [FlixPatrol](https://flixpatrol.com)):
  - Netflix Magyarország
  - HBO Max Magyarország
  - Disney+ Magyarország
  - Amazon Prime Video Magyarország
  - Apple TV+ Magyarország
- **Search** — Find movies and TV shows with Hungarian metadata
- **Popular content** — Browse trending movies and series

## Tech Stack

- [Hono](https://hono.dev/) web framework on Node.js
- TypeScript with Zod validation
- TMDB and MDBList APIs
- SQLite database (Drizzle ORM)
- Docker deployment

## Setup

### Environment Variables

| Variable             | Required | Default | Description                                                              |
| -------------------- | -------- | ------- | ------------------------------------------------------------------------ |
| `ADDON_URL`          | Yes      | —       | Public URL where the addon is hosted                                     |
| `TMDB_ACCESS_TOKEN`  | Yes      | —       | TMDB API access token                                                    |
| `MDBLIST_API_KEY`    | Yes      | —       | MDBList API key                                                          |
| `DB_PATH`            | Dev only | —       | Path to SQLite database file (defaults to `/data/database.db` in Docker) |
| `PORT`               | No       | `3000`  | Server port                                                              |
| `TMDB_LANGUAGE`      | No       | `hu-HU` | TMDB language code                                                       |
| `RATE_LIMIT_ENABLED` | No       | `true`  | Enable rate limiting                                                     |
| `HTTP_CACHE_ENABLED` | No       | `true`  | Enable HTTP response caching                                             |

### Run with Docker

```sh
docker build -t stremio-hun .
docker run -p 3000:3000 \
  -e ADDON_URL=https://your-domain.com \
  -e TMDB_ACCESS_TOKEN=your_token \
  -e MDBLIST_API_KEY=your_key \
  -e DB_PATH=/data/database.db \
  -v ./data:/data \
  stremio-hun
```

### Run locally

```sh
pnpm install
pnpm dev
```
