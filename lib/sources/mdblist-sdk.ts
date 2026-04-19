import { env } from "../../utils/env.ts";
import type { MdblistList } from "./types.ts";
import { fetch } from "../../utils/http-cache.ts";

export async function getMdblisListById(listId: string): Promise<MdblistList> {
  const searchParams = new URLSearchParams({ apikey: env.MDBLIST_API_KEY });
  const url = `https://api.mdblist.com/external/lists/${listId}/items?${searchParams.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch list with id ${listId}`);
  }
  return response.json() as Promise<MdblistList>;
}
