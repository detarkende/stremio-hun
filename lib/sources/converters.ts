import { env } from "../../utils/env";
import type { MetaDetail, MetaLink, MetaPreview, MetaVideo } from "../stremio.types";
import { createImageUrl, TmdbImageSizes } from "./tmdb-api";
import type { NormalizedMovie, NormalizedTV, TmdbMovieResults, TmdbTvShowResults } from "./types";

export function tmdbTvShowToStremioMeta(result: TmdbTvShowResults): MetaDetail {
  const { imdbId, tvShow, logoUrl, posterUrl, backdropUrl, cast, seasons } = result;

  const videos: MetaVideo[] = seasons.flatMap((season) =>
    season.episodes.map(
      (episode): MetaVideo => ({
        id: `${imdbId}:${episode.season_number}:${episode.episode_number}`,
        title: episode.name,
        season: episode.season_number,
        episode: episode.episode_number,
        released: new Date(episode.air_date).toISOString(),
        overview: episode.overview,
        thumbnail: createImageUrl(episode.still_path),
        runtime: new Intl.DurationFormat(env.TMDB_LANGUAGE, {
          style: "narrow",
        }).format({ minutes: episode.runtime }),
      }),
    ),
  );

  const tmdbLink: MetaLink = {
    category: "tmdb",
    name: `${tvShow.vote_average}`,
    url: `https://www.themoviedb.org/tv/${tvShow.id}`,
  };
  const castLinks: MetaLink[] = cast.splice(0, 5).map(
    (member): MetaLink => ({
      category: "Cast",
      name: member.name,
      url: `https://www.themoviedb.org/person/${member.id}`,
    }),
  );

  const firstAirDate = new Date(tvShow.first_air_date);
  const lastAirDate = new Date(tvShow.last_air_date);
  const isFinished = tvShow.in_production === false && lastAirDate < new Date();

  const released = firstAirDate.toISOString();
  const releaseInfo = `${firstAirDate.getFullYear()}-${isFinished ? lastAirDate.getFullYear() : ""}`;

  return {
    id: imdbId,
    type: "series",
    name: tvShow.name,
    poster: posterUrl,
    background: backdropUrl,
    logo: logoUrl,
    description: tvShow.overview,
    videos,
    links: [tmdbLink, ...castLinks],
    released,
    releaseInfo,
    website: tvShow.homepage,
    behaviorHints: {
      hasScheduledVideos: videos.some((video) => !video.available),
    },
  };
}

export function tmdbMovieToStremioMeta(result: TmdbMovieResults): MetaDetail {
  const { imdbId, movie, logoUrl, posterUrl, backdropUrl, cast } = result;

  const tmdbLink: MetaLink = {
    category: "tmdb",
    name: `${movie.vote_average}`,
    url: `https://www.themoviedb.org/movie/${movie.id}`,
  };
  const castLinks: MetaLink[] = cast.splice(0, 5).map(
    (member): MetaLink => ({
      category: "Cast",
      name: member.name,
      url: `https://www.themoviedb.org/person/${member.id}`,
    }),
  );

  return {
    id: imdbId,
    type: "movie",
    name: movie.title,
    poster: posterUrl,
    background: backdropUrl,
    logo: logoUrl,
    description: movie.overview,
    links: [tmdbLink, ...castLinks],
    released: new Date(movie.release_date).toISOString(),
    releaseInfo: new Date(movie.release_date).getFullYear().toString(),
    website: movie.homepage,
  };
}

export function tmdbMovieToMetaPreview(result: NormalizedMovie): MetaPreview {
  return {
    id: `tmdb-${result.id}`,
    type: "movie",
    name: result.title,
    poster: createImageUrl(result.poster_path, TmdbImageSizes.POSTER),
    posterShape: "poster",
  };
}

export function tmdbTvShowToMetaPreview(result: NormalizedTV): MetaPreview {
  return {
    id: `tmdb-${result.id}`,
    type: "series",
    name: result.name,
    poster: createImageUrl(result.poster_path, TmdbImageSizes.POSTER),
    posterShape: "poster",
  };
}
