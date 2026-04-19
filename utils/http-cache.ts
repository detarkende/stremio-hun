import {
  fetch as undiciFetch,
  Agent,
  type RequestInfo,
  type RequestInit,
  interceptors,
  cacheStores,
} from "undici";
import { env } from "./env.ts";
import { getDBPath } from "./db.ts";

const agent = new Agent().compose(
  [
    interceptors.retry({
      maxRetries: 3,
    }),
    env.HTTP_CACHE_ENABLED &&
      interceptors.cache({
        store: new cacheStores.SqliteCacheStore({ location: getDBPath() }),
      }),
  ].filter((item) => !!item),
);

export const fetch = (url: RequestInfo, options?: RequestInit) =>
  undiciFetch(url, { ...options, dispatcher: agent });
