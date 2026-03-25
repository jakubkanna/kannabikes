import { localizePath, type Locale } from "./i18n";

const SITE_URL = (
  import.meta.env.VITE_SITE_URL ?? "http://localhost:5173"
).replace(/\/$/, "");
const DEFAULT_WORDPRESS_API_BASE =
  import.meta.env.VITE_WORDPRESS_API_BASE_URL ?? "http://localhost/wp-json/kanna/v1";
const WORDPRESS_BASE_URL = (() => {
  const explicitBaseUrl = import.meta.env.VITE_WORDPRESS_API_URL;

  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/$/, "");
  }

  try {
    return new URL(DEFAULT_WORDPRESS_API_BASE).origin;
  } catch {
    return DEFAULT_WORDPRESS_API_BASE.replace(/\/wp-json.*$/i, "");
  }
})();

function getFrontendRedirectUrl({
  locale,
  redirectTo,
}: {
  locale: Locale;
  redirectTo?: string | null;
}) {
  const fallbackPath = redirectTo || localizePath("/account", locale);

  return new URL(
    fallbackPath.startsWith("/") ? fallbackPath : `/${fallbackPath}`,
    SITE_URL,
  );
}

export function getGoogleAuthUrl({
  intent,
  locale,
  redirectTo,
}: {
  intent: "sign-in" | "sign-up";
  locale: Locale;
  redirectTo?: string | null;
}) {
  const baseUrl = import.meta.env.VITE_GOOGLE_AUTH_URL?.trim();

  if (!baseUrl) {
    return null;
  }

  const targetUrl = getFrontendRedirectUrl({ locale, redirectTo });
  const authUrl = new URL(baseUrl, SITE_URL);

  authUrl.searchParams.set("locale", locale);
  authUrl.searchParams.set("intent", intent);
  authUrl.searchParams.set("redirect_to", targetUrl.toString());

  return authUrl.toString();
}

export function getWordpressLoginUrl({
  locale,
  redirectTo,
}: {
  locale?: Locale;
  redirectTo?: string | null;
} = {}) {
  const url = new URL("/wp-login.php", WORDPRESS_BASE_URL);

  if (locale) {
    const redirectUrl = getFrontendRedirectUrl({ locale, redirectTo });
    url.searchParams.set("redirect_to", redirectUrl.toString());
  }

  return url.toString();
}

export function getForgotPasswordPath({
  locale,
  redirectTo,
}: {
  locale: Locale;
  redirectTo?: string | null;
}) {
  const url = new URL(localizePath("/forgot-password", locale), SITE_URL);

  if (redirectTo) {
    url.searchParams.set("redirect", redirectTo);
  }

  return `${url.pathname}${url.search}`;
}

export function getFrontendAccountRedirect({
  locale,
  redirectTo,
}: {
  locale: Locale;
  redirectTo?: string | null;
}) {
  return getFrontendRedirectUrl({ locale, redirectTo }).toString();
}

export function hasWordpressLoginCookie() {
  if (typeof document === "undefined") {
    return false;
  }

  return document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .some((entry) => entry.startsWith("wordpress_logged_in_"));
}
