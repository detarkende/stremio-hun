import mdblistConfig from "./mdblist-lists.json" with { type: "json" };

export const TMDB_PAGE_SIZE = 20;

export const mdbListCatalogDetails: { id: string; name: string }[] = Object.keys(
  mdblistConfig.lists,
).map((key) => ({
  id: key,
  name: mdblistConfig.lists[key].name,
}));

export const mdblistCatalogIds = Object.keys(mdblistConfig.lists);
