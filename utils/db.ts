import { env } from "./env.ts";
import fs from "node:fs";
import path from "node:path";

export function getDBPath() {
  if (!fs.existsSync(env.DB_PATH)) {
    fs.mkdirSync(path.dirname(env.DB_PATH), { recursive: true });
  }
  return env.DB_PATH;
}
