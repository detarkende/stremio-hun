import { env } from "../../utils/env";
import { TMDB, type Images } from "tmdb-ts";
import { TMDB_PAGE_SIZE } from "./constants";
import type { MDBListCatalogNames, TmdbMovieResults, TmdbTvShowResults } from "./types";
import {
  tmdbMovieToMetaPreview,
  tmdbMovieToStremioMeta,
  tmdbTvShowToMetaPreview,
  tmdbTvShowToStremioMeta,
} from "./converters";
import type { MetaDetail, MetaPreview } from "../stremio.types";
import { getMdblisListById } from "./mdblist-sdk";
import mdbListConfig from "./mdblist-lists.json" with { type: "json" };
import { AddonMediaType } from "../constants";
import { fetch } from "../../utils/http-cache";

export const tmdb = new TMDB(env.TMDB_ACCESS_TOKEN, {
  // type assertion: tmdb-ts is inferring the type of fetch from the global scope, but when running in Bun, the global fetch contains some Bun-specific extensions that cause type errors (Example: `fetch.preconnect()`)
  fetch: fetch as unknown as typeof globalThis.fetch,
});
const language = env.TMDB_LANGUAGE;

// ============================
// === Get Media by IMDB id ===
// ============================

export async function getTmdbIdByImdbId(
  imdbId: string,
  mediaType: AddonMediaType,
): Promise<number | null> {
  const result = await tmdb.find.byExternalId(imdbId, {
    language,
    external_source: "imdb_id",
  });
  const resultArray = mediaType === AddonMediaType.MOVIE ? result.movie_results : result.tv_results;

  return resultArray[0]?.id ?? null;
}

// ============================
// === Get Media by TMDB id ===
// ============================

export async function getMovieByTmdbId(tmdbId: number): Promise<MetaDetail> {
  const movie = await tmdb.movies.details(tmdbId, ["credits", "external_ids", "images"], language, {
    include_image_language: `${language},en,null`,
  });
  const { logoUrl, backdropUrl, posterUrl } = getMediaImages(movie.images);

  const result: TmdbMovieResults = {
    imdbId: movie.external_ids.imdb_id,
    movie,
    cast: movie.credits.cast,
    logoUrl,
    backdropUrl,
    posterUrl,
  };
  return tmdbMovieToStremioMeta(result);
}

export async function getTvShowByTmdbId(tmdbId: number): Promise<MetaDetail> {
  const tvShow = await tmdb.tvShows.details(
    tmdbId,
    ["aggregate_credits", "external_ids", "images"],
    language,
    { include_image_language: `${language},en,null` },
  );

  const seasons = await Promise.all(
    tvShow.seasons.map(({ season_number }) =>
      tmdb.tvSeasons.details({ tvShowID: tmdbId, seasonNumber: season_number }, [], { language }),
    ),
  );

  const { logoUrl, backdropUrl, posterUrl } = getMediaImages(tvShow.images);

  const result: TmdbTvShowResults = {
    imdbId: tvShow.external_ids.imdb_id,
    tvShow,
    cast: tvShow.aggregate_credits.cast,
    seasons,
    logoUrl,
    backdropUrl,
    posterUrl,
  };
  return tmdbTvShowToStremioMeta(result);
}

// ==============
// === Search ===
// ==============

export async function searchMovies({
  keyword,
  skip,
}: {
  keyword: string;
  skip: number;
}): Promise<MetaPreview[]> {
  const page = Math.floor(skip / TMDB_PAGE_SIZE) + 1;
  const { results } = await tmdb.search.movies({
    query: keyword,
    region: language,
    language,
    page,
  });
  return results.map(tmdbMovieToMetaPreview);
}

export async function searchTvShows({
  keyword,
  skip,
}: {
  keyword: string;
  skip: number;
}): Promise<MetaPreview[]> {
  const page = Math.floor(skip / TMDB_PAGE_SIZE) + 1;
  const { results } = await tmdb.search.tvShows({
    query: keyword,
    language,
    page,
  });
  return results.map(tmdbTvShowToMetaPreview);
}

// ==========================
// === Get Popular Media ===
// ==========================

export async function getPopularTvShows({ skip }: { skip: number }): Promise<MetaPreview[]> {
  const page = Math.floor(skip / TMDB_PAGE_SIZE) + 1;
  const { results } = await tmdb.tvShows.popular({ language, page });
  return results.map(tmdbTvShowToMetaPreview);
}

export async function getPopularMovies({ skip }: { skip: number }): Promise<MetaPreview[]> {
  const page = Math.floor(skip / TMDB_PAGE_SIZE) + 1;
  const { results } = await tmdb.movies.popular({ language, page });
  return results.map(tmdbMovieToMetaPreview);
}

// =================
// === Top Rated ===
// =================

export async function getTopRatedTvShows({ skip }: { skip: number }): Promise<MetaPreview[]> {
  const page = Math.floor(skip / TMDB_PAGE_SIZE) + 1;
  const { results } = await tmdb.tvShows.topRated({ language, page });
  return results.map(tmdbTvShowToMetaPreview);
}

export async function getTopRatedMovies({ skip }: { skip: number }): Promise<MetaPreview[]> {
  const page = Math.floor(skip / TMDB_PAGE_SIZE) + 1;
  const { results } = await tmdb.movies.topRated({ language, page });
  return results.map(tmdbMovieToMetaPreview);
}

// ========================
// === MDBList Catalogs ===
// ========================
export async function getMdblistCatalog(
  mediaType: AddonMediaType,
  listId: MDBListCatalogNames,
): Promise<MetaPreview[]> {
  const { movies, shows } = await getMdblisListById(mdbListConfig.lists[listId].listId);
  const media = mediaType === AddonMediaType.MOVIE ? movies : shows;

  const filteredMedia = media.filter((item) => item.ids.tmdb && item.ids.imdb); // Filter out items that don't have either TMDB or IMDb IDs

  const metas: MetaPreview[] = await Promise.all(
    filteredMedia.map(async (item): Promise<MetaPreview> => {
      const tmdbId = item.ids.tmdb;

      //  Note: arguments are duplicated here because typescript says that the union of the two endpoint functions is too complex.
      const tmdbDetails =
        mediaType === "movie"
          ? await tmdb.movies.details(tmdbId, ["images", "external_ids"], language, {
              include_image_language: `${language},en,null`,
            })
          : await tmdb.tvShows.details(tmdbId, ["images", "external_ids"], language, {
              include_image_language: `${language},en,null`,
            });

      const { logoUrl, posterUrl, backdropUrl } = getMediaImages(tmdbDetails.images);
      return {
        id: tmdbDetails.external_ids.imdb_id || item.ids.imdb,
        type: mediaType,
        name:
          "title" in tmdbDetails
            ? tmdbDetails.title
            : (tmdbDetails.name ?? item.title ?? "Unknown Title"),
        poster: posterUrl,
        background: backdropUrl,
        logo: logoUrl,
        description: tmdbDetails.overview,
        posterShape: "poster",
      };
    }),
  );
  return metas;
}

// ==============
// === Images ===
// ======""========

export function getMediaImages(images: Omit<Images, "id">) {
  const iso_639_1 = language.split("-")[0]; // Get the language code without the region (e.g., "en" from "en-US")

  const bestLogo =
    images.logos.find((logo) => logo.iso_639_1 === iso_639_1) ||
    images.logos.find((logo) => logo.iso_639_1 === null) ||
    images.logos.find((logo) => logo.iso_639_1 === "en");

  const bestBackdrop =
    images.backdrops.find((backdrop) => backdrop.iso_639_1 === null) ||
    images.backdrops.find((backdrop) => backdrop.iso_639_1 === iso_639_1) ||
    images.backdrops.find((backdrop) => backdrop.iso_639_1 === "en");

  const bestPoster =
    images.posters.find((poster) => poster.iso_639_1 === iso_639_1) ||
    images.posters.find((poster) => poster.iso_639_1 === null) ||
    images.posters.find((poster) => poster.iso_639_1 === "en");

  return {
    logoUrl: bestLogo ? createImageUrl(bestLogo.file_path) : undefined,
    backdropUrl: bestBackdrop ? createImageUrl(bestBackdrop.file_path) : undefined,
    posterUrl: bestPoster ? createImageUrl(bestPoster.file_path) : undefined,
  };
}

export const TmdbImageSizes = {
  ORIGINAL: "original",
  W500: "w500",
  POSTER: "w600_and_h900_bestv2",
} as const;

type ImageSize = (typeof TmdbImageSizes)[keyof typeof TmdbImageSizes];

export function createImageUrl(path: string, size: ImageSize = TmdbImageSizes.ORIGINAL): string {
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
