import type { Hono } from "hono";

/**
 * Stremio requires all addon URLs to end in `.json`, but Hono's router matches
 * paths before any middleware runs, so route patterns like `/:id{tt[0-9]+}`
 * would never match `tt123456.json`. Stripping the suffix here, at the fetch
 * entry point, keeps it transparent to every route and schema in the app.
 * @param app - your Hono app
 */
export function applyStremioProtocol(app: Hono) {
  const _fetch = app.fetch.bind(app);
  app.fetch = (req, env, ctx) => {
    const url = new URL(req.url);
    if (url.pathname.endsWith(".json")) {
      url.pathname = url.pathname.slice(0, -5);
      req = new Request(url.toString(), req);
    }
    return _fetch(req, env, ctx);
  };
}
