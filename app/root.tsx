import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigate,
  useNavigation,
} from "react-router";
import { useEffect, useRef } from "react";

import type { Route } from "./+types/root";
import "./app.css";
import { CookieConsentBanner } from "./components/cookie-consent-banner";
import { JsonLd } from "./components/json-ld";
import { LocaleProvider } from "./components/locale-provider";
import { RouteLoader } from "./components/route-loader";
import { SiteFooter } from "./components/site-footer";
import { SiteHeader } from "./components/site-header";
import {
  buildSiteUrl,
  getLocaleFromPath,
  getMessages,
  getStoredLocale,
  localizePath,
  stripLocalePrefix,
} from "./lib/i18n";

export const SITE_NAME = "Kanna Bikes";
const DEFAULT_SITE_DESCRIPTION = "Kanna Bikes";
const SITE_URL = (
  import.meta.env.VITE_SITE_URL ?? "http://localhost:5173"
).replace(/\/$/, "");
const BASE_URL = import.meta.env.BASE_URL;
const OG_IMAGE = `${BASE_URL}2013_DSF6372_jakubkanna.jpg`;
const OG_IMAGE_URL = `${SITE_URL}${OG_IMAGE}`;
const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  logo: OG_IMAGE_URL,
  name: SITE_NAME,
  url: SITE_URL,
};
const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: buildSiteUrl("/"),
};

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Archivo:wght@900&display=swap",
  },
  {
    rel: "preload",
    href: `${BASE_URL}kanna-font.ttf`,
    as: "font",
    type: "font/ttf",
    crossOrigin: "anonymous",
  },
  {
    rel: "icon",
    href: `${BASE_URL}kannabikes_logo.svg`,
    type: "image/svg+xml",
  },
  { rel: "apple-touch-icon", href: `${BASE_URL}kannabikes_logo.svg` },
];

export function formatPageTitle(page: string) {
  return `${page} – ${SITE_NAME}`;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: SITE_NAME },
    { name: "description", content: DEFAULT_SITE_DESCRIPTION },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const locale = getLocaleFromPath(location.pathname);
  const isHome = stripLocalePrefix(location.pathname) === "/";

  return (
    <html lang={locale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <JsonLd data={ORGANIZATION_JSON_LD} />
        <JsonLd data={WEBSITE_JSON_LD} />
      </head>
      <body
        className={`relative ${isHome ? "bg-black" : "bg-white"} text-gray-900 antialiased`}
        style={{ fontFamily: '"Osifont", sans-serif' }}
      >
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const location = useLocation();
  const { hash, pathname, search } = location;
  const shouldOffsetContent = stripLocalePrefix(pathname) !== "/";
  const hasResolvedInitialLocale = useRef(false);
  const nextPathname = navigation.location?.pathname ?? pathname;
  const isRouteLoading =
    navigation.state === "loading" &&
    navigation.location != null &&
    (navigation.location.pathname !== pathname ||
      navigation.location.search !== search);
  const loadingLabel = getMessages(getLocaleFromPath(nextPathname)).common
    .loading;

  useEffect(() => {
    if (hasResolvedInitialLocale.current) {
      return;
    }

    hasResolvedInitialLocale.current = true;

    if (pathname !== "/") {
      return;
    }

    const storedLocale = getStoredLocale();
    if (storedLocale !== "pl") {
      return;
    }

    navigate(`${localizePath(pathname, storedLocale)}${search}${hash}`, {
      replace: true,
    });
  }, [hash, navigate, pathname, search]);

  return (
    <>
      <CookieConsentBanner />
      <SiteHeader />
      <div
        className={[
          shouldOffsetContent ? "pt-(--site-header-height)" : "",
          "relative",
          "transition-[filter,opacity] duration-200 ease-out motion-reduce:transition-none",
          isRouteLoading ? "opacity-40 blur-sm" : "opacity-100 blur-0",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Outlet />
      </div>
      <SiteFooter />
      <RouteLoader isLoading={isRouteLoading} label={loadingLabel} />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const location = useLocation();
  const locale = getLocaleFromPath(location.pathname);
  const messages = getMessages(locale);
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 pb-20 pt-24">
      <h1 className="text-3xl font-semibold">{message}</h1>
      <p className="mt-3 text-gray-700">{details}</p>
      <p className="mt-4">
        <a className="text-sm underline" href={locale === "pl" ? "/pl" : "/"}>
          {messages.contact.backHome}
        </a>
      </p>
      {stack && (
        <pre className="mt-6 w-full overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
