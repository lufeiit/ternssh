import { en } from "./en";
import { zh } from "./zh";
import type { Messages } from "./zh";

export interface LocaleDefinition {
  id: string;
  nativeLabel: string;
  htmlLang: string;
  messages: Messages;
}

export const SUPPORTED_LOCALES: LocaleDefinition[] = [
  {
    id: "zh",
    nativeLabel: "中文",
    htmlLang: "zh-CN",
    messages: zh,
  },
  {
    id: "en",
    nativeLabel: "English",
    htmlLang: "en",
    messages: en,
  },
];

export type { Messages } from "./zh";
export type Locale = (typeof SUPPORTED_LOCALES)[number]["id"];

const localeById = new Map(SUPPORTED_LOCALES.map((item) => [item.id, item]));

export function isLocale(value: string): value is Locale {
  return localeById.has(value);
}

export function getLocaleDefinition(locale: Locale): LocaleDefinition {
  return localeById.get(locale)!;
}

export function detectBrowserLocale(): Locale {
  const languages =
    typeof navigator !== "undefined"
      ? navigator.languages?.length
        ? [...navigator.languages]
        : [navigator.language]
      : ["en"];

  for (const language of languages) {
    const tag = language.toLowerCase();
    if (tag.startsWith("zh")) return "zh";
    if (tag.startsWith("en")) return "en";
  }

  return "en";
}

export function getDefaultLocale(): Locale {
  const stored = localStorage.getItem("ternssh-locale");
  if (stored && isLocale(stored)) return stored;
  return detectBrowserLocale();
}
