import { getTranslations, type SupportedLanguage } from "#translations/i18n.ts";

import { env } from "../utils/env.ts";
import { AddonMediaType } from "./constants.ts";
import type { SearchExtra } from "./schemas.ts";
import {
  getMovieByTmdbId,
  getTvShowByTmdbId,
  getChannel,
  isChannelId,
  mdbListCatalogDetails,
  MediaklikkTvSource,
  searchMovies,
  searchTvShows,
} from "./sources/index.ts";
import type {
  Manifest,
  ManifestCatalog,
  MetaDetail,
  MetaPreview,
  Stream,
} from "./stremio.types.ts";

const mediaklikkTvSource = new MediaklikkTvSource();

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
    types: [AddonMediaType.MOVIE, AddonMediaType.SERIES, "tv"],
    logo: `${env.ADDON_URL}/logo.png`,
    catalogs: [
      {
        type: "tv",
        id: "mediaklikk",
        name: "Mediaklikk",
      },
      ...mdblistCatalogs,
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
    resources: ["meta", "stream"],
    idPrefixes: ["tt", "tmdb-", "mediaklikk-"],
  };
}

export async function getMediaklikkTvCatalog(): Promise<MetaPreview[]> {
  const availableChannels = await mediaklikkTvSource.getAvailableChannels();
  return availableChannels.map((channel) => ({
    id: `mediaklikk-${channel.id}`,
    type: "tv",
    name: channel.displayName,
    description: channel.description,
    poster: `${env.ADDON_URL}${channel.poster}`,
    posterShape: "landscape",
  }));
}

export function getMediaklikkTvMeta(channelId: string): MetaDetail | null {
  const channelIdWithoutPrefix = channelId.replace(/^mediaklikk-/, "");
  if (!isChannelId(channelIdWithoutPrefix)) {
    return null;
  }

  const channel = getChannel(channelIdWithoutPrefix);
  return {
    id: `mediaklikk-${channelIdWithoutPrefix}`,
    type: "tv",
    name: channel.displayName,
    description: channel.description,
    poster: `${env.ADDON_URL}${channel.poster}`,
  };
}

export async function getMediaklikkTvStream(channelId: string): Promise<Stream[]> {
  const channelIdWithoutPrefix = channelId.replace(/^mediaklikk-/, "");
  if (!isChannelId(channelIdWithoutPrefix)) {
    return [];
  }

  const url = await mediaklikkTvSource.getChannelStreamUrl(channelIdWithoutPrefix);
  if (!url) {
    return [];
  }

  return [
    {
      name: "Mediaklikk",
      description: "Live HLS stream",
      url,
    },
  ];
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
