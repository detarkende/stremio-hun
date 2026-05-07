import { getTranslations, type SupportedLanguage } from "#translations/i18n.ts";

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

function getPopularCatalogs(language: SupportedLanguage): ManifestCatalog[] {
  const t = getTranslations(language);
  return [
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
}

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

export async function getManifest(language: SupportedLanguage): Promise<Manifest> {
  const t = getTranslations(language);
  return {
    id: "org.stremio.hun",
    name: "Stremio Hun",
    description: "A Stremio addon for Hungarian content.",
    version: env.APP_VERSION,
    types: [AddonMediaType.MOVIE, AddonMediaType.SERIES],
    logo: `${env.ADDON_URL}/logo.png`,
    catalogs: [
      ...mdblistCatalogs,
      ...getPopularCatalogs(language),
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
  language: SupportedLanguage,
): Promise<MetaDetail> {
  const tmdbId = await getTmdbIdByImdbId(imdbId, mediaType, language);
  if (!tmdbId) {
    throw new Error(`TMDB ID not found for IMDb ID: ${imdbId}`);
  }
  return await getMediaByTmdbId(tmdbId, mediaType, language);
}

export async function getMediaByTmdbId(
  tmdbId: number,
  mediaType: AddonMediaType,
  language: SupportedLanguage,
): Promise<MetaDetail> {
  switch (mediaType) {
    case AddonMediaType.SERIES: {
      return await getTvShowByTmdbId(tmdbId, language);
    }
    case AddonMediaType.MOVIE: {
      return await getMovieByTmdbId(tmdbId, language);
    }
  }
}

export async function searchMedia(
  type: AddonMediaType,
  extra: SearchExtra,
  language: SupportedLanguage,
): Promise<MetaPreview[]> {
  const { search, skip } = extra;
  switch (type) {
    case AddonMediaType.MOVIE: {
      return await searchMovies({ keyword: search, skip, language });
    }
    case AddonMediaType.SERIES: {
      return await searchTvShows({ keyword: search, skip, language });
    }
  }
}

export async function getPopularMediaResults(
  type: AddonMediaType,
  extra: SkipExtra,
  language: SupportedLanguage,
): Promise<MetaPreview[]> {
  switch (type) {
    case AddonMediaType.MOVIE: {
      return await getPopularMovies({ ...extra, language });
    }
    case AddonMediaType.SERIES: {
      return await getPopularTvShows({ ...extra, language });
    }
  }
}
