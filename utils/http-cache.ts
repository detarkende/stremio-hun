import NodeFetchCache from "node-fetch-cache";
import { RedisCache } from "@node-fetch-cache/redis";
import { env } from "./env";

const redisUrl = new URL(env.REDIS_URL);

export const fetch = NodeFetchCache.create({
  cache: new RedisCache({
    host: redisUrl.hostname,
    port: parseInt(redisUrl.port),
  }),
});
