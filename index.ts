import { api } from "./lib/api";
import setupPage from "./frontend/index.html";
import { env } from "./utils/env";

const server = Bun.serve({
  routes: {
    "/": setupPage,
    "/*": (req, env) => {
      if (req.url.endsWith(".json")) {
        return api.fetch(new Request(req.url.replace(/\.json$/, ""), req), env);
      }
      return api.fetch(req, env);
    },
  },
  development: env.ENVIRONMENT === "local",
});

console.log(`Server is running on ${server.protocol}://${server.hostname}:${server.port}`);
