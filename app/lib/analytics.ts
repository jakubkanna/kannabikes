export const GA_MEASUREMENT_ID =
  import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() ?? "";

export const ANALYTICS_CONSENT_COOKIE_NAME = "kanna_cookie_consent";
export const ANALYTICS_CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;
export const COOKIE_PREFERENCES_EVENT = "kanna:open-cookie-preferences";

export type AnalyticsConsentStatus = "accepted" | "rejected";

declare global {
  interface Window {
    __kannaAnalyticsConfigured?: boolean;
    __kannaAnalyticsConsentInitialized?: boolean;
    __kannaAnalyticsLoaded?: boolean;
    __kannaAnalyticsInitialized?: boolean;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function isAnalyticsConfigured() {
  return GA_MEASUREMENT_ID.length > 0;
}

export function readAnalyticsConsent():
  | AnalyticsConsentStatus
  | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookieValue = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${ANALYTICS_CONSENT_COOKIE_NAME}=`))
    ?.split("=")[1];

  if (cookieValue === "accepted" || cookieValue === "rejected") {
    return cookieValue;
  }

  return null;
}

export function writeAnalyticsConsent(status: AnalyticsConsentStatus) {
  if (typeof document === "undefined") {
    return;
  }

  const secureFlag =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "Secure"
      : "";

  document.cookie = [
    `${ANALYTICS_CONSENT_COOKIE_NAME}=${status}`,
    `Max-Age=${ANALYTICS_CONSENT_COOKIE_MAX_AGE}`,
    "Path=/",
    "SameSite=Lax",
    secureFlag,
  ].join("; ");
}

function ensureGtagStub() {
  if (typeof window === "undefined") {
    return;
  }

  window.dataLayer = window.dataLayer ?? [];
  window.gtag =
    window.gtag ??
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
}

function insertGoogleAnalyticsScript() {
  if (typeof document === "undefined" || !isAnalyticsConfigured()) {
    return;
  }

  if (document.getElementById("kanna-google-analytics")) {
    return;
  }

  const script = document.createElement("script");
  script.id = "kanna-google-analytics";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
  document.head.appendChild(script);
}

export function initializeGoogleConsentMode() {
  if (typeof window === "undefined" || !isAnalyticsConfigured()) {
    return false;
  }

  ensureGtagStub();

  if (window.__kannaAnalyticsConsentInitialized) {
    return true;
  }

  window.gtag?.("consent", "default", {
    ad_personalization: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    analytics_storage: "denied",
    wait_for_update: 500,
  });
  window.__kannaAnalyticsConsentInitialized = true;

  return true;
}

export function loadGoogleAnalytics() {
  if (typeof window === "undefined" || !isAnalyticsConfigured()) {
    return false;
  }

  initializeGoogleConsentMode();

  if (!window.__kannaAnalyticsInitialized) {
    window.gtag?.("js", new Date());
    window.gtag?.("config", GA_MEASUREMENT_ID, {
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      send_page_view: false,
    });
    window.__kannaAnalyticsInitialized = true;
  }

  if (!window.__kannaAnalyticsLoaded) {
    insertGoogleAnalyticsScript();
    window.__kannaAnalyticsLoaded = true;
  }

  return true;
}

export function applyAnalyticsConsent(status: AnalyticsConsentStatus) {
  if (typeof window === "undefined") {
    return;
  }

  initializeGoogleConsentMode();

  if (status === "accepted") {
    loadGoogleAnalytics();
  } else if (!window.gtag) {
    return;
  }

  window.gtag?.("consent", "update", {
    ad_personalization: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    analytics_storage: status === "accepted" ? "granted" : "denied",
  });
}

function cookieDomainVariants(hostname: string) {
  const parts = hostname.split(".").filter(Boolean);
  const variants = new Set<string | undefined>([undefined, hostname]);

  for (let index = 0; index < parts.length - 1; index += 1) {
    variants.add(`.${parts.slice(index).join(".")}`);
  }

  return [...variants];
}

function expireCookie(name: string, domain?: string) {
  if (typeof document === "undefined") {
    return;
  }

  const secureFlag =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "Secure"
      : "";

  document.cookie = [
    `${name}=`,
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Max-Age=0",
    "Path=/",
    "SameSite=Lax",
    domain ? `Domain=${domain}` : "",
    secureFlag,
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearGoogleAnalyticsCookies() {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }

  const cookieNames = document.cookie
    .split("; ")
    .map((entry) => entry.split("=")[0])
    .filter(
      (name) =>
        name === "_ga" ||
        name === "_gid" ||
        name.startsWith("_ga_") ||
        name.startsWith("_gcl_"),
    );

  const domainVariants = cookieDomainVariants(window.location.hostname);

  cookieNames.forEach((name) => {
    domainVariants.forEach((domain) => expireCookie(name, domain));
  });
}

export function trackPageView({
  locale,
  pagePath,
  pageTitle,
}: {
  locale: string;
  pagePath: string;
  pageTitle: string;
}) {
  if (typeof window === "undefined" || !window.gtag) {
    return;
  }

  window.gtag("event", "page_view", {
    language: locale,
    page_location: window.location.href,
    page_path: pagePath,
    page_title: pageTitle,
  });
}

export function trackClickEvent({
  clickLabel,
  clickTarget,
  clickType,
  isOutbound,
  section,
}: {
  clickLabel: string;
  clickTarget: string;
  clickType: string;
  isOutbound: boolean;
  section: string;
}) {
  if (typeof window === "undefined" || !window.gtag) {
    return;
  }

  window.gtag("event", "site_click", {
    click_label: clickLabel,
    click_target: clickTarget,
    click_type: clickType,
    is_outbound: isOutbound,
    section,
  });
}
