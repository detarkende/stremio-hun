import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { drizzle } from "drizzle-orm/node-sqlite";
import { migrate } from "drizzle-orm/node-sqlite/migrator";

import { env } from "#server/utils/env.ts";

export function getDBPath() {
  if (!fs.existsSync(env.DB_PATH)) {
    fs.mkdirSync(path.dirname(env.DB_PATH), { recursive: true });
  }
  return env.DB_PATH;
}

const sqlite = new DatabaseSync(getDBPath());
const db = drizzle({ client: sqlite });

const isDevelopment = env.NODE_ENV === "development";

const migrationsFolder = isDevelopment
  ? path.resolve(import.meta.dirname, "../../../drizzle")
  : path.resolve(import.meta.dirname, "../drizzle");

migrate(db, { migrationsFolder });

export * from "./schema";
export { db };
