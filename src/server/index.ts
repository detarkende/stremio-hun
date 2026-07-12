import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";

import {
  getManifest,
  getMediaByTmdbId,
  getMediaklikkTvCatalog,
  getMediaklikkTvMeta,
  getMediaklikkTvStream,
  searchMedia,
} from "./lib/addon.ts";
import { rateLimit } from "./lib/middlewares/rate-limit.ts";
import {
  ManifestPathSchema,
  MdblistCatalogPathSchema,
  MetaHandlerImdbPathSchema,
  MetaHandlerTmdbPathSchema,
  SearchCatalogPathSchema,
} from "./lib/schemas.ts";
import { getMdblistCatalog, getTmdbIdByImdbId } from "./lib/sources/index.ts";
import { env } from "./utils/env.ts";
import { srvxAdapter } from "./utils/srvx.ts";
import { applyStremioProtocol } from "./utils/stremio-protocol.ts";

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
      const tmdbId = await getTmdbIdByImdbId(imdbId, type, language);
      if (!tmdbId) {
        return c.notFound();
      }
      const meta = await getMediaByTmdbId(tmdbId, type, language);
      return c.json({ meta });
    },
  );
api
  .get("/:language/meta/tv/:id{mediaklikk-.*}", async (c) => {
    const { id } = c.req.param();
    const meta = getMediaklikkTvMeta(id);
    return meta ? c.json({ meta }) : c.notFound();
  })
  .get(
    "/:language/meta/:type/:id{tmdb-[0-9]+}",
    zValidator("param", MetaHandlerTmdbPathSchema),
    async (c) => {
      const { language, type, id: tmdbId } = c.req.valid("param");
      const meta = await getMediaByTmdbId(tmdbId, type, language);
      return c.json({ meta });
    },
  )
  .get("/:language/catalog/tv/mediaklikk", async (c) => {
    const metas = await getMediaklikkTvCatalog();
    return c.json({ metas });
  })
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
    "/:language/catalog/:type/:catalogId{mdblist-.*}",
    zValidator("param", MdblistCatalogPathSchema),
    async (c) => {
      const { language, type, catalogId } = c.req.valid("param");
      const metas = await getMdblistCatalog(type, catalogId, language);
      return c.json({ metas });
    },
  )
  .get("/:language/stream/tv/:id{mediaklikk-.*}", async (c) => {
    const { id } = c.req.param();
    const streams = await getMediaklikkTvStream(id);
    return c.json({ streams });
  });

const app = new Hono();
if (env.RATE_LIMIT_ENABLED) {
  app.use(rateLimit);
}
app.use(cors());
app.route("/api", api);

applyStremioProtocol(app);

export type ApiType = typeof api;

export default srvxAdapter(app, {
  port: env.PORT,
});
