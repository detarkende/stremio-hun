import { getConnInfo } from "@hono/node-server/conninfo";
import { createMiddleware } from "hono/factory";
import { env } from "../../utils/env.ts";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-sqlite";
import { DatabaseSync } from "node:sqlite";
import { getDBPath } from "../../utils/db.ts";

const sqlite = new DatabaseSync(getDBPath());
const db = drizzle({ client: sqlite });

db.run(sql`CREATE TABLE IF NOT EXISTS visits (
  ip TEXT NOT NULL,
  timestamp INTEGER NOT NULL
) STRICT;`);

db.run(sql`CREATE INDEX IF NOT EXISTS idx_visits_ip_timestamp ON visits (ip, timestamp);`);

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

  db.run(sql`INSERT INTO visits (ip, timestamp) VALUES (${ip}, ${now})`);

  const { count } = db.get<{ count: number }>(sql`
    SELECT COUNT(*) as count FROM visits
    WHERE ip = ${ip} AND timestamp > ${windowStart};
  `);

  // Periodically clean up old records to prevent the table from growing indefinitely
  if (now - lastCleanup > cleanupInterval) {
    lastCleanup = now;
    db.run(sql`DELETE FROM visits WHERE timestamp <= ${windowStart};`);
  }

  if (count > maxRequests) {
    c.header("Retry-After", windowSeconds.toString());
    return c.text("Too Many Requests", 429);
  }

  await next();
});
