import { Hono } from "hono";
import t from "./translations.json" with { type: "json" };
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
import { Page } from "../frontend/page.tsx";

const app = new Hono();

if (env.RATE_LIMIT_ENABLED) {
  app.use(rateLimit);
}
app.use(cors());

app.get("/", (c) =>
  c.html(
    <Page
      addonUrl={env.ADDON_URL}
      language={env.TMDB_LANGUAGE}
      title={t.addonPage.title}
      description={t.addonPage.description}
      installWebText={t.addonPage.install.web}
      installAppText={t.addonPage.install.app}
      logoUrl={`${env.ADDON_URL}/logo.png`}
    />,
  ),
);

const api = new Hono().basePath(`/${env.TMDB_LANGUAGE}`);

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

app.route("/api", api);

app.use("*", serveStatic({ root: "./static" }));

export { app };
