import { useEffect } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { defineCustomElements } from "ionicons/loader";

import type { Route } from "./+types/root";
import "./app.css";

export const SITE_NAME = "Kanna Bikes";
const DEFAULT_SITE_DESCRIPTION = "Kanna Bikes";
const SITE_URL = (
  import.meta.env.VITE_SITE_URL ?? "http://localhost:5173"
).replace(/\/$/, "");
const BASE_URL = import.meta.env.BASE_URL;
const OG_IMAGE = `${BASE_URL}kannabikes_logo.svg`;
const OG_IMAGE_URL = `${SITE_URL}${OG_IMAGE}`;

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: `${BASE_URL}kannabikes_logo.svg`, type: "image/svg+xml" },
  { rel: "apple-touch-icon", href: `${BASE_URL}kannabikes_logo.svg` },
];

export function meta({}: Route.MetaArgs) {
  return [
    { title: SITE_NAME },
    { name: "description", content: DEFAULT_SITE_DESCRIPTION },
    { name: "robots", content: "index,follow" },
    { property: "og:url", content: SITE_URL },
    { property: "og:type", content: "website" },
    { property: "og:title", content: SITE_NAME },
    { property: "og:description", content: DEFAULT_SITE_DESCRIPTION },
    { property: "og:image", content: OG_IMAGE_URL },
    { property: "og:image:url", content: OG_IMAGE_URL },
    { property: "og:image:secure_url", content: OG_IMAGE_URL },
    { property: "og:image:type", content: "image/svg+xml" },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: `${SITE_NAME} social preview image` },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: SITE_NAME },
    { name: "twitter:description", content: DEFAULT_SITE_DESCRIPTION },
    { name: "twitter:image", content: OG_IMAGE_URL },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    defineCustomElements(window);
  }, []);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-white text-slate-900 antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
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
