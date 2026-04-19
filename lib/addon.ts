import pkg from "../package.json" with { type: "json" };
import { env } from "../utils/env.ts";
import { AddonMediaType } from "./constants.ts";
import type { SearchExtra, SkipExtra } from "./schemas.ts";
import {
  getMovieByTmdbId,
  getPopularMovies,
  getPopularTvShows,
  getTmdbIdByImdbId,
  getTvShowByTmdbId,
  mdbListCatalogDetails,
  searchMovies,
  searchTvShows,
} from "./sources/index.ts";
import type { Manifest, ManifestCatalog, MetaDetail, MetaPreview } from "./stremio.types.ts";
import t from "./translations.json" with { type: "json" };

const popularCatalogs: ManifestCatalog[] = [
  {
    type: AddonMediaType.MOVIE,
    id: "popular",
    name: t.catalogs.popular,
    extra: [{ name: "skip" }],
  },
  {
    type: AddonMediaType.SERIES,
    id: "popular",
    name: t.catalogs.popular,
    extra: [{ name: "skip" }],
  },
];

const mdblistCatalogs: ManifestCatalog[] = mdbListCatalogDetails.flatMap(
  (catalog): ManifestCatalog[] => {
    return [
      {
        type: AddonMediaType.MOVIE,
        id: `mdblist-${catalog.id}`,
        name: catalog.name,
      },
      {
        type: AddonMediaType.SERIES,
        id: `mdblist-${catalog.id}`,
        name: catalog.name,
      },
    ];
  },
);

export async function getManifest(): Promise<Manifest> {
  return {
    id: "org.stremio.hun",
    name: "Stremio Hun",
    description: pkg.description,
    version: pkg.version,
    types: [AddonMediaType.MOVIE, AddonMediaType.SERIES],
    logo: `${env.ADDON_URL}/logo.png`,
    catalogs: [
      ...mdblistCatalogs,
      ...popularCatalogs,
      {
        type: AddonMediaType.SERIES,
        id: "search",
        name: t.catalogs.search.results,
        extra: [
          { name: "skip", isRequired: true },
          { name: "search", isRequired: true },
        ],
      },
      {
        type: AddonMediaType.MOVIE,
        id: "search",
        name: t.catalogs.search.results,
        extra: [
          { name: "skip", isRequired: true },
          { name: "search", isRequired: true },
        ],
      },
    ],
    resources: ["meta"],
    idPrefixes: ["tt", "tmdb-"],
  };
}

export async function getMediaByImdbId(
  imdbId: string,
  mediaType: AddonMediaType,
): Promise<MetaDetail> {
  const tmdbId = await getTmdbIdByImdbId(imdbId, mediaType);
  if (!tmdbId) {
    throw new Error(`TMDB ID not found for IMDb ID: ${imdbId}`);
  }
  return await getMediaByTmdbId(tmdbId, mediaType);
}

export async function getMediaByTmdbId(
  tmdbId: number,
  mediaType: AddonMediaType,
): Promise<MetaDetail> {
  switch (mediaType) {
    case AddonMediaType.SERIES: {
      return await getTvShowByTmdbId(tmdbId);
    }
    case AddonMediaType.MOVIE: {
      return await getMovieByTmdbId(tmdbId);
    }
  }
}

export async function searchMedia(
  type: AddonMediaType,
  extra: SearchExtra,
): Promise<MetaPreview[]> {
  const { search, skip } = extra;
  switch (type) {
    case AddonMediaType.MOVIE: {
      return await searchMovies({ keyword: search, skip });
    }
    case AddonMediaType.SERIES: {
      return await searchTvShows({ keyword: search, skip });
    }
  }
}

export async function getPopularMediaResults(
  type: AddonMediaType,
  extra: SkipExtra,
): Promise<MetaPreview[]> {
  switch (type) {
    case AddonMediaType.MOVIE: {
      return await getPopularMovies(extra);
    }
    case AddonMediaType.SERIES: {
      return await getPopularTvShows(extra);
    }
  }
}
