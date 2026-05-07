export const AddonMediaType = {
  MOVIE: "movie",
  SERIES: "series",
} as const;
export const AddonMediaTypeList = Object.values(AddonMediaType);

export type AddonMediaType = (typeof AddonMediaType)[keyof typeof AddonMediaType];
