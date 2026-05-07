import type { AvailableLanguage } from "tmdb-ts";
import z from "zod";

import enUS from "./en-US.json" with { type: "json" };
import huHU from "./hu-HU.json" with { type: "json" };

export const SupportedLanguages = {
  HU: "hu-HU",
  EN: "en-US",
} as const satisfies Record<string, AvailableLanguage>;

export const defaultLanguage = SupportedLanguages.HU;

export type SupportedLanguage = (typeof SupportedLanguages)[keyof typeof SupportedLanguages];

export const SupportedLanguageSchema = z.enum(Object.values(SupportedLanguages));

const translationsByLanguage = {
  "hu-HU": huHU,
  "en-US": enUS,
} as const;

export type Translations = (typeof translationsByLanguage)[SupportedLanguage];

export function getTranslations(language: SupportedLanguage): Translations {
  return translationsByLanguage[language];
}
