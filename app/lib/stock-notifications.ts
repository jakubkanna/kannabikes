import type { Locale } from "./i18n";

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

const WORDPRESS_REQUEST_BASE =
  typeof window === "undefined"
    ? WORDPRESS_BASE_URL
    : import.meta.env.DEV
      ? ""
      : WORDPRESS_BASE_URL;

function buildApiUrl(path: string) {
  const url = `${WORDPRESS_REQUEST_BASE}/wp-json/kanna-stock/v1${path}`;

  if (/^https?:\/\//i.test(url)) {
    return new URL(url);
  }

  const fallbackOrigin =
    typeof window === "undefined" ? WORDPRESS_BASE_URL : window.location.origin;

  return new URL(url, fallbackOrigin);
}

export async function subscribeBackInStock({
  csrfToken,
  payload,
}: {
  csrfToken?: string;
  payload: {
    email?: string;
    locale: Locale;
    newsletterOptIn: boolean;
    productId: number;
    productPath: string;
  };
}) {
  const endpoint = buildApiUrl("/subscriptions");
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (csrfToken) {
    headers.set("X-Kanna-CSRF", csrfToken);
  }

  const response = await fetch(endpoint.toString(), {
    body: JSON.stringify(payload),
    credentials: "include",
    headers,
    method: "POST",
  });

  const result = (await response.json().catch(() => null)) as
    | { message?: string; status?: string; success?: boolean }
    | null;

  if (!response.ok) {
    throw new Error(result?.message ?? `Stock notification request failed (${response.status})`);
  }

  return {
    status: result?.status ?? "created",
    success: Boolean(result?.success),
  };
}
