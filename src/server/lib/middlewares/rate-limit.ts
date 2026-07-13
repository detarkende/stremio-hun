import { and, eq, gt, lte, sql } from "drizzle-orm";
import { createMiddleware } from "hono/factory";

import { db, visitsTable } from "#server/db/index.ts";
import { env } from "#server/utils/env.ts";
import { getConnInfo } from "#server/utils/srvx.ts";

let lastCleanup = 0;
const cleanupInterval = env.RATE_LIMIT_WINDOW;

export const rateLimit = createMiddleware(async function (c, next) {
  const windowSeconds = env.RATE_LIMIT_WINDOW;
  const maxRequests = env.RATE_LIMIT_MAX_REQUESTS;

  const ip = getConnInfo(c).remote.address;

  if (!ip) {
    return c.text("Unable to determine IP address", 400);
  }

  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;

  db.insert(visitsTable)
    .values([{ ip, timestamp: now }])
    .run();

  const { visitCount } = db
    .select({ visitCount: sql`count(*)`.mapWith(Number) })
    .from(visitsTable)
    .where(and(eq(visitsTable.ip, ip), gt(visitsTable.timestamp, windowStart)))
    .get() ?? { visitCount: 0 };

  // Periodically clean up old records to prevent the table from growing indefinitely
  if (now - lastCleanup > cleanupInterval) {
    lastCleanup = now;
    db.delete(visitsTable).where(lte(visitsTable.timestamp, windowStart)).run();
  }

  if (visitCount > maxRequests) {
    c.header("Retry-After", windowSeconds.toString());
    return c.text("Too Many Requests", 429);
  }

  return next();
});
