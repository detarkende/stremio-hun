import fs from "node:fs";
import path from "node:path";

import { env } from "./env.ts";

export function getDBPath() {
  if (!fs.existsSync(env.DB_PATH)) {
    fs.mkdirSync(path.dirname(env.DB_PATH), { recursive: true });
  }
  return env.DB_PATH;
}
