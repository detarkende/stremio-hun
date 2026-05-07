import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";

import {
  getManifest,
  getMediaByImdbId,
  getMediaByTmdbId,
  getPopularMediaResults,
  searchMedia,
} from "./lib/addon.ts";
import { rateLimit } from "./lib/middlewares/rate-limit.ts";
import {
  ManifestPathSchema,
  MdblistCatalogPathSchema,
  MetaHandlerImdbPathSchema,
  MetaHandlerTmdbPathSchema,
  PopularCatalogPathSchema,
  SearchCatalogPathSchema,
} from "./lib/schemas.ts";
import { getMdblistCatalog } from "./lib/sources/index.ts";
import { env } from "./utils/env.ts";
import { srvxAdapter } from "./utils/srvx.ts";

const api = new Hono()
  .get("/:language/manifest", zValidator("param", ManifestPathSchema), async (c) => {
    const { language } = c.req.valid("param");
    const manifest = await getManifest(language);
    return c.json(manifest);
  })
  .get(
    "/:language/meta/:type/:id{tt[0-9]+}",
    zValidator("param", MetaHandlerImdbPathSchema),
    async (c) => {
      const { language, type, id: imdbId } = c.req.valid("param");
      const meta = await getMediaByImdbId(imdbId, type, language);
      return c.json({ meta });
    },
  );
api
  .get(
    "/:language/meta/:type/:id{tmdb-[0-9]+}",
    zValidator("param", MetaHandlerTmdbPathSchema),
    async (c) => {
      const { language, type, id: tmdbId } = c.req.valid("param");
      const meta = await getMediaByTmdbId(tmdbId, type, language);
      return c.json({ meta });
    },
  )
  .get(
    "/:language/catalog/:type/search/:extra",
    zValidator("param", SearchCatalogPathSchema),
    async (c) => {
      const { language, type, extra } = c.req.valid("param");
      const metas = await searchMedia(type, extra, language);
      return c.json({ metas });
    },
  )
  .get(
    "/:language/catalog/:type/popular/:extra?",
    zValidator("param", PopularCatalogPathSchema),
    async (c) => {
      const { language, type, extra } = c.req.valid("param");
      const metas = await getPopularMediaResults(type, extra, language);
      return c.json({ metas });
    },
  )
  .get(
    "/:language/catalog/:type/:catalogId{mdblist-.*}",
    zValidator("param", MdblistCatalogPathSchema),
    async (c) => {
      const { language, type, catalogId } = c.req.valid("param");
      const metas = await getMdblistCatalog(type, catalogId, language);
      return c.json({ metas });
    },
  );

const app = new Hono()
  .use(env.RATE_LIMIT_ENABLED ? rateLimit : (_c, next) => next())
  .use(cors())
  .route("/api", api);

app.use("/api/*", async (c, next) => {
  if (!c.req.path.endsWith(".json")) {
    return next();
  }
  const newUrl = new URL(c.req.url);
  newUrl.pathname = newUrl.pathname.replace(/\.json$/, "");
  return app.fetch(new Request(newUrl.toString(), c.req), c.env);
});

export type AppType = typeof app;

export default srvxAdapter(app, {
  port: env.PORT,
});
