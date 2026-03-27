import type { MetaDescriptor } from "react-router";
import { messages, type AppMessages } from "./i18n-messages";

export type { AppMessages } from "./i18n-messages";

export const SUPPORTED_LOCALES = ["en", "pl"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "kanna-locale";
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL ?? "http://localhost:5173"
).replace(/\/$/, "");
const BASE_URL = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
const DEFAULT_SOCIAL_IMAGE_PATH = `${BASE_URL}/2013_DSF6372_jakubkanna.jpg`.replace(
  /\/{2,}/g,
  "/",
);

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

export function buildSiteUrl(pathname: string) {
  return `${SITE_URL}${pathname === "/" ? "" : pathname}`;
}

function buildAbsoluteUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  return buildSiteUrl(pathOrUrl);
}

export function buildLocalizedMeta({
  alternates,
  description,
  image,
  imageAlt,
  locale,
  pathname,
  robots = "index,follow",
  socialDescription,
  socialTitle,
  type = "website",
  title,
}: {
  alternates?: Partial<Record<Locale, string>>;
  description: string;
  image?: string;
  imageAlt?: string;
  locale: Locale;
  pathname: string;
  robots?: string;
  socialDescription?: string;
  socialTitle?: string;
  type?: "website" | "article" | "product";
  title: string;
}): MetaDescriptor[] {
  const canonicalPath = alternates?.[locale] ?? localizePath(pathname, locale);
  const englishPath = alternates?.en ?? localizePath(pathname, "en");
  const polishPath = alternates?.pl ?? localizePath(pathname, "pl");
  const canonicalUrl = buildSiteUrl(canonicalPath);
  const socialImage = buildAbsoluteUrl(image ?? DEFAULT_SOCIAL_IMAGE_PATH);
  const resolvedSocialTitle = socialTitle ?? title;
  const resolvedSocialDescription = socialDescription ?? description;
  const resolvedImageAlt =
    typeof imageAlt === "string" && imageAlt.trim()
      ? imageAlt.trim()
      : resolvedSocialTitle;
  const twitterCard = image ? "summary_large_image" : "summary";

  return [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: canonicalUrl },
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
    { name: "robots", content: robots },
    { property: "og:url", content: canonicalUrl },
    { property: "og:type", content: type },
    { property: "og:title", content: resolvedSocialTitle },
    { property: "og:description", content: resolvedSocialDescription },
    { property: "og:image", content: socialImage },
    { property: "og:image:url", content: socialImage },
    { property: "og:image:secure_url", content: socialImage },
    { property: "og:image:alt", content: resolvedImageAlt },
    { name: "twitter:card", content: twitterCard },
    { name: "twitter:title", content: resolvedSocialTitle },
    { name: "twitter:description", content: resolvedSocialDescription },
    { name: "twitter:image", content: socialImage },
  ];
}

export function getMessages(locale: Locale): AppMessages {
  return messages[locale];
}
