import z from "zod";
import { AddonMediaTypeList } from "./constants";
import { mdblistCatalogIds } from "./sources";
import type { MDBListCatalogNames } from "./sources/types";

export const MetaHandlerTmdbPathSchema = z.object({
  type: z.enum(AddonMediaTypeList),
  id: z
    .string()
    .transform((id) => id.replace(/\.json$/, "")) // Remove .json suffix
    .transform((id) => id.replace(/^tmdb-/, "")) // Remove tmdb- prefix if present
    .refine((id) => !isNaN(parseInt(id)), "Invalid ID") // Validate that the remaining string is a number
    .transform((id) => parseInt(id)), // Convert to number
});

export const MetaHandlerImdbPathSchema = z.object({
  type: z.enum(AddonMediaTypeList),
  id: z.string().transform((id) => id.replace(/\.json$/, "")), // Remove .json suffix
});

function createExtraSchema<OutputType>(schema: z.ZodType<OutputType>) {
  return z
    .string()
    .default("")
    .transform((query) => query.replace(/\.json$/, "")) // Remove .json suffix
    .refine((queryString) => {
      try {
        const query = new URLSearchParams(queryString);
        const queryObject = Object.fromEntries([...query]);
        return schema.safeParse(queryObject).success;
      } catch {
        return false;
      }
    }, "Invalid search query")
    .transform((queryString) => {
      const query = new URLSearchParams(queryString);
      const queryObject = Object.fromEntries([...query]);
      return schema.parse(queryObject);
    });
}

const BaseExtraSchema = z.object({
  skip: z.coerce.number().int().positive().default(0),
});

const SearchExtraSchema = BaseExtraSchema.extend({
  search: z.string().min(1, "Search query cannot be empty"),
});

export type SearchExtra = z.infer<typeof SearchExtraSchema>;

export type SkipExtra = Omit<SearchExtra, "search">;

export const SearchCatalogPathSchema = z.object({
  type: z.enum(AddonMediaTypeList),
  extra: createExtraSchema(SearchExtraSchema),
});

export const PopularCatalogPathSchema = z.object({
  type: z.enum(AddonMediaTypeList),
  extra: createExtraSchema(BaseExtraSchema),
});

export const MdblistCatalogPathSchema = z.object({
  type: z.enum(AddonMediaTypeList),
  catalogId: z
    .enum(mdblistCatalogIds.map((id) => `mdblist-${id}` as const))
    .transform((id) => id.replace(/^mdblist-/, "") as MDBListCatalogNames), // Remove mdblist- prefix
});
