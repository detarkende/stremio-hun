import type { AddressInfo } from "node:net";
import { app } from "./lib/api.tsx";
import { env } from "./utils/env.ts";
import { serve } from "@hono/node-server";

const server = serve({
  fetch: (req, env) => {
    // Stremio's API endpoints end with .json, but we want to handle them without the extension for cleaner URLs.
    if (req.url.endsWith(".json")) {
      return app.fetch(new Request(req.url.replace(/\.json$/, ""), req), env);
    }
    return app.fetch(req, env);
  },
  port: env.PORT,
});

const address = server.address() as AddressInfo;

console.log(`Server is running on http://localhost:${address.port}`);
