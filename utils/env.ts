import { AvailableLanguages } from "tmdb-ts";
import z from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  ADDON_URL: z.url().transform((url) => url.replace(/\/+$/, "")), // Remove trailing slashes
  TMDB_ACCESS_TOKEN: z.string(),
  TMDB_LANGUAGE: z.enum(AvailableLanguages).default("hu-HU"),
  RATE_LIMIT_WINDOW: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(250),
  MDBLIST_API_KEY: z.string(),
  RATE_LIMIT_ENABLED: z.stringbool().default(true),
  HTTP_CACHE_ENABLED: z.stringbool().default(true),
  DB_PATH: z.string(),
});

export type Env = z.infer<typeof EnvSchema>;

const validationResult = EnvSchema.safeParse(process.env);

if (!validationResult.success) {
  console.error("Invalid environment variables:\n", z.prettifyError(validationResult.error));
  process.exit(1);
}

export const env = EnvSchema.parse(process.env);
