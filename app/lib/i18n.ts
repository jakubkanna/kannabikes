import type { MetaDescriptor } from "react-router";
import { messages, type AppMessages } from "./i18n-messages";

export type { AppMessages } from "./i18n-messages";

export const SUPPORTED_LOCALES = ["en", "pl"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "kanna-locale";
const SITE_URL = (
  import.meta.env.VITE_SITE_URL ?? "http://localhost:5173"
).replace(/\/$/, "");

export function isSupportedLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "pl";
}

export function getLocaleFromPath(pathname: string): Locale {
  return pathname === "/pl" || pathname.startsWith("/pl/") ? "pl" : "en";
}

export function stripLocalePrefix(pathname: string) {
  if (pathname === "/pl") {
    return "/";
  }

  if (pathname.startsWith("/pl/")) {
    return pathname.slice(3) || "/";
  }

  return pathname || "/";
}

export function localizePath(pathname: string, locale: Locale) {
  if (!pathname.startsWith("/")) {
    return pathname;
  }

  const strippedPath = stripLocalePrefix(pathname);
  if (locale === "en") {
    return strippedPath;
  }

  return strippedPath === "/" ? "/pl" : `/pl${strippedPath}`;
}

export function getIntlLocale(locale: Locale) {
  return locale === "pl" ? "pl-PL" : "en-GB";
}

export function getStoredLocale() {
  if (typeof window === "undefined") {
    return null;
  }

  const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return isSupportedLocale(storedLocale) ? storedLocale : null;
}

export function setStoredLocale(locale: Locale) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

function buildSiteUrl(pathname: string) {
  return `${SITE_URL}${pathname === "/" ? "" : pathname}`;
}

export function buildLocalizedMeta({
  alternates,
  description,
  locale,
  pathname,
  title,
}: {
  alternates?: Partial<Record<Locale, string>>;
  description: string;
  locale: Locale;
  pathname: string;
  title: string;
}): MetaDescriptor[] {
  const canonicalPath = alternates?.[locale] ?? localizePath(pathname, locale);
  const englishPath = alternates?.en ?? localizePath(pathname, "en");
  const polishPath = alternates?.pl ?? localizePath(pathname, "pl");

  return [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: buildSiteUrl(canonicalPath) },
    {
      tagName: "link",
      rel: "alternate",
      hrefLang: "en",
      href: buildSiteUrl(englishPath),
    },
    {
      tagName: "link",
      rel: "alternate",
      hrefLang: "pl",
      href: buildSiteUrl(polishPath),
    },
    {
      tagName: "link",
      rel: "alternate",
      hrefLang: "x-default",
      href: buildSiteUrl(englishPath),
    },
  ];
}

export function getMessages(locale: Locale): AppMessages {
  return messages[locale];
}
