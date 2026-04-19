import type {
  AggregateCast,
  Cast,
  Movie,
  MovieDetails,
  SeasonDetails,
  TV,
  TvShowDetails,
} from "tmdb-ts";
import type { Prettify } from "../types.ts";
import mdbListLists from "./mdblist-lists.json" with { type: "json" };

export type NormalizedCast = Prettify<Cast | AggregateCast>;

export type NormalizedTV = Omit<TV, "adult">;
export type NormalizedMovie = Omit<Movie, "adult">;

export interface TmdbTvShowResults {
  imdbId: string;
  tvShow: TvShowDetails;
  cast: NormalizedCast[];
  seasons: SeasonDetails[];
  logoUrl: string | undefined;
  backdropUrl: string | undefined;
  posterUrl: string | undefined;
}

export interface TmdbMovieResults {
  imdbId: string;
  movie: MovieDetails;
  cast: NormalizedCast[];
  logoUrl: string | undefined;
  backdropUrl: string | undefined;
  posterUrl: string | undefined;
}

export interface MdblistList {
  movies: MdblistMedia[];
  shows: MdblistMedia[];
}

interface MdblistMedia {
  id: number;
  ids: {
    imdb: string;
    tmdb: number;
    tvdb: number;
    mdblist: string;
  };
  rank: number;
  adult: number;
  title: string;
  status: string;
  country: string;
  imdb_id: string;
  runtime: number;
  tvdb_id: number;
  language: string;
  mediatype: string;
  release_date: string;
  release_year: number;
  spoken_language: string;
}

export type MDBListCatalogNames = keyof typeof mdbListLists.lists;
