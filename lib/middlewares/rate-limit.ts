import { RedisClient } from "bun";
import { getConnInfo } from "hono/bun";
import { createMiddleware } from "hono/factory";
import { env } from "../../utils/env";

const redis = new RedisClient(env.REDIS_URL);

export const rateLimit = createMiddleware(async function (c, next) {
  const windowSeconds = env.RATE_LIMIT_WINDOW;
  const maxRequests = env.RATE_LIMIT_MAX_REQUESTS;

  const ip = getConnInfo(c).remote.address;

  if (!ip) {
    console.warn("Could not determine client IP address for rate limiting.", getConnInfo(c));
    // return next();
  }

  const key = `rate-limit:${ip}`;

  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }

  const isLimited = current > maxRequests;

  if (isLimited) {
    const retryAfter = await redis.ttl(key);
    return c.body(null, 429, {
      "Retry-After": retryAfter.toString(),
    });
  }
  await next();
});
