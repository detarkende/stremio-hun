import z from "zod";
import { AvailableLanguages } from "tmdb-ts";

export const Environment = {
  PRODUCTION: "production",
  DEVELOPMENT: "development",
  LOCAL: "local",
} as const;

const EnvSchema = z.object({
  ENVIRONMENT: z.enum(Object.values(Environment)),
  PORT: z.coerce.number().int().positive().default(3000),
  ADDON_URL: z.url().transform((url) => url.replace(/\/+$/, "")), // Remove trailing slashes
  REDIS_URL: z.url().default("redis://localhost:6379"),
  TMDB_ACCESS_TOKEN: z.string(),
  TMDB_LANGUAGE: z.enum(AvailableLanguages).default("hu-HU"),
  RATE_LIMIT_WINDOW: z.coerce.number().int().positive(),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive(),
  MDBLIST_API_KEY: z.string(),
  RATE_LIMIT_ENABLED: z.stringbool().default(true),
  HTTP_CACHE_ENABLED: z.stringbool().default(true),
});

export type Env = z.infer<typeof EnvSchema>;

const validationResult = EnvSchema.safeParse(process.env);

if (!validationResult.success) {
  console.error("Invalid environment variables:\n", z.prettifyError(validationResult.error));
  process.exit(1);
}

export const env = EnvSchema.parse(process.env);
