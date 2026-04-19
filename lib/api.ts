import { Hono } from "hono";
import { rateLimit } from "./middlewares/rate-limit.ts";
import { serveStatic } from "@hono/node-server/serve-static";
import {
  getManifest,
  getMediaByImdbId,
  getMediaByTmdbId,
  getPopularMediaResults,
  searchMedia,
} from "./addon.ts";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import {
  MdblistCatalogPathSchema,
  MetaHandlerImdbPathSchema,
  MetaHandlerTmdbPathSchema,
  PopularCatalogPathSchema,
  SearchCatalogPathSchema,
} from "./schemas.ts";
import { getMdblistCatalog } from "./sources/index.ts";
import { env } from "../utils/env.ts";

export const api = new Hono();

if (env.RATE_LIMIT_ENABLED) {
  api.use(rateLimit);
}
api.use(cors());

api.get("/manifest", async (c) => {
  const manifest = await getManifest();
  return c.json(manifest);
});

api.get("/meta/:type/:id{tt[0-9]+}", zValidator("param", MetaHandlerImdbPathSchema), async (c) => {
  const { type, id: imdbId } = c.req.valid("param");
  const meta = await getMediaByImdbId(imdbId, type);
  return c.json({ meta });
});
api.get(
  "/meta/:type/:id{tmdb-[0-9]+}",
  zValidator("param", MetaHandlerTmdbPathSchema),
  async (c) => {
    const { type, id: tmdbId } = c.req.valid("param");
    const meta = await getMediaByTmdbId(tmdbId, type);
    return c.json({ meta });
  },
);

api.get("/catalog/:type/search/:extra", zValidator("param", SearchCatalogPathSchema), async (c) => {
  const { type, extra } = c.req.valid("param");
  const metas = await searchMedia(type, extra);
  return c.json({ metas });
});

api.get(
  "/catalog/:type/popular/:extra?",
  zValidator("param", PopularCatalogPathSchema),
  async (c) => {
    const { type, extra } = c.req.valid("param");
    const metas = await getPopularMediaResults(type, extra);
    return c.json({ metas });
  },
);

api.get(
  "/catalog/:type/:catalogId{mdblist-.*}",
  zValidator("param", MdblistCatalogPathSchema),
  async (c) => {
    const { type, catalogId } = c.req.valid("param");
    const metas = await getMdblistCatalog(type, catalogId);
    return c.json({ metas });
  },
);

// Serve logo and other static assets
api.use("*", serveStatic({ root: "./static" }));
// Redirect all other routes to the root, which serves the SPA frontend
// api.get("*", (c) => c.redirect("/"));
