import { index, integer, text, snakeCase } from "drizzle-orm/sqlite-core";

export const visitsTable = snakeCase.table(
  "visits",
  {
    ip: text().notNull(),
    timestamp: integer().notNull(),
  },
  (table) => [index("idx_visits_ip_timestamp").on(table.ip, table.timestamp)],
);

export const mediaklikkChannelCacheTable = snakeCase.table("mediaklikk_channel_cache", {
  channelId: text().primaryKey(),
  url: text().notNull(),
  updatedAt: integer().notNull(),
});
