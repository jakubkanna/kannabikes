import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { useEffect, useState } from "react";

import type { Route } from "./+types/root";
import "./app.css";

export const SITE_NAME = "Kornelia Nowak";
const DEFAULT_SITE_DESCRIPTION = "Portfolio";
const SITE_URL = (
  import.meta.env.VITE_SITE_URL ?? "http://localhost:5173"
).replace(/\/$/, "");
const OG_IMAGE = "/kornelianowak.svg";
const OG_IMAGE_URL = `${SITE_URL}${OG_IMAGE}`;
const WORDPRESS_BASE_URL = (
  import.meta.env.VITE_WORDPRESS_API_URL ?? "http://localhost:8080"
).replace(/\/$/, "");
const CONTACT_PAGE_SLUG = "contact";

export async function loader({ request }: Route.LoaderArgs) {
  let siteDescription = DEFAULT_SITE_DESCRIPTION;

  try {
    const endpoint = new URL(`${WORDPRESS_BASE_URL}/wp-json`);
    const response = await fetch(endpoint.toString(), {
      headers: { Accept: "application/json" },
      signal: request.signal,
    });

    if (response.ok) {
      const payload = (await response.json()) as { description?: unknown };
      if (
        typeof payload.description === "string" &&
        payload.description.trim()
      ) {
        siteDescription = payload.description.trim();
      }
    }
  } catch {
    // Keep default description when WordPress is unavailable.
  }

  return { siteDescription };
}

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/kornelianowak.svg", type: "image/svg+xml" },
  { rel: "apple-touch-icon", href: "/kornelianowak.svg" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "preload",
    as: "style",
    href: "https://fonts.googleapis.com/css2?family=Rubik+Bubbles&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Rubik+Bubbles&display=swap",
  },
];

export function meta({ data }: Route.MetaArgs) {
  const siteDescription = data?.siteDescription ?? DEFAULT_SITE_DESCRIPTION;

  return [
    { title: SITE_NAME },
    { name: "description", content: siteDescription },
    { name: "robots", content: "index,follow" },
    { property: "og:url", content: SITE_URL },
    { property: "og:type", content: "website" },
    { property: "og:title", content: SITE_NAME },
    { property: "og:description", content: siteDescription },
    { property: "og:image", content: OG_IMAGE_URL },
    { property: "og:image:url", content: OG_IMAGE_URL },
    { property: "og:image:secure_url", content: OG_IMAGE_URL },
    { property: "og:image:type", content: "image/svg+xml" },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: `${SITE_NAME} social preview image` },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: SITE_NAME },
    { name: "twitter:description", content: siteDescription },
    { name: "twitter:image", content: OG_IMAGE_URL },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-red-500 text-slate-900 antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const [isLogoMenuOpen, setIsLogoMenuOpen] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [contactPageHtml, setContactPageHtml] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadContactPage() {
      try {
        const endpoint = new URL(`${WORDPRESS_BASE_URL}/wp-json/wp/v2/pages`);
        endpoint.searchParams.set("slug", CONTACT_PAGE_SLUG);
        endpoint.searchParams.set("_fields", "content");

        const response = await fetch(endpoint.toString(), {
          headers: { Accept: "application/json" },
        });
        if (!response.ok) return;

        const payload = (await response.json()) as Array<{
          content?: { rendered?: string };
        }>;
        const page = payload[0];
        if (!page || cancelled) return;

        if (!cancelled) {
          setContactPageHtml(page.content?.rendered ?? "");
        }
      } catch {
        // Keep contact content empty if fetch fails.
      }
    }

    void loadContactPage();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative min-h-screen">
      <header className="fixed inset-x-0 top-0 z-20  bg-transparent">
        <div className="flex flex-col items-start px-4 pt-3" id="Logo">
          <button
            className="cursor-pointer"
            onClick={() => setIsLogoMenuOpen((prev) => !prev)}
            onMouseEnter={() => setIsLogoHovered(true)}
            onMouseLeave={() => setIsLogoHovered(false)}
            type="button"
            aria-label="Toggle contact links"
            aria-expanded={isLogoMenuOpen}
          >
            <div className="flex items-center gap-2">
              <img
                src={
                  isLogoHovered
                    ? "/kornelianowak-blue.svg"
                    : "/kornelianowak.svg"
                }
                alt={SITE_NAME}
                className="logo-pop-on-load h-10 w-auto md:h-12"
              />
              {isLogoMenuOpen ? (
                <>
                  <img
                    src={
                      isLogoHovered
                        ? "/kornelianowak-blue.svg"
                        : "/kornelianowak.svg"
                    }
                    alt=""
                    aria-hidden="true"
                    className="logo-pop-on-load h-10 w-auto md:h-12"
                  />
                  <img
                    src={
                      isLogoHovered
                        ? "/kornelianowak-blue.svg"
                        : "/kornelianowak.svg"
                    }
                    alt=""
                    aria-hidden="true"
                    className="logo-pop-on-load h-10 w-auto md:h-12"
                  />
                </>
              ) : null}
            </div>
          </button>
          <div
            className={`mt-2 text-3xl font-kornelia transition-all duration-300 ease-out ${
              isLogoMenuOpen
                ? "translate-y-0 opacity-100"
                : "-translate-y-3 opacity-0 pointer-events-none"
            }`}
          >
            <div
              className="mobile-wrap-anywhere [&_a]:underline [&_a]:decoration-transparent hover:[&_a]:decoration-current"
              dangerouslySetInnerHTML={{ __html: contactPageHtml }}
            />
          </div>
        </div>
      </header>

      <main className="min-h-screen w-full pb-20 pt-24">
        <Outlet />
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-20 bg-transparent">
        <div className="flex w-full flex-col items-end justify-center px-4 py-2 md:items-end font-kornelia">
          <div className="group relative flex items-center gap-2 pt-2 opacity-50 transition-opacity duration-200 hover:opacity-100 font-mono">
            <a
              className="mobile-wrap-anywhere text-xs"
              href="https://studio.jakubkanna.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              {SITE_NAME} © 2026
            </a>
            <a
              className="cursor-pointer leading-none select-none"
              href="https://studio.jakubkanna.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit studio.jakubkanna.com"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <rect x="4" y="5" width="16" height="11" rx="1.5" />
                <path d="M2.5 18.5h19" />
                <path d="M9.5 18.5h5" />
              </svg>
            </a>
            <small className="pointer-events-none absolute bottom-full right-0 mb-2 w-max max-w-65 rounded bg-slate-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              Designed & Developed by JAKUB KANNA
            </small>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
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
      <p className="mt-3 text-slate-700">{details}</p>
      <p className="mt-4">
        <a className="text-sm underline" href="/">
          Go to homepage
        </a>
      </p>
      {stack && (
        <pre className="mt-6 w-full overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
