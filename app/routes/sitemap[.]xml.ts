import type { Route } from "./+types/sitemap[.]xml";

const DEFAULT_SITE_URL = "https://kannabikes.com";

function normalizeBaseUrl(input: string) {
  return input.endsWith("/") ? input.slice(0, -1) : input;
}

export async function loader({ request }: Route.LoaderArgs) {
  const envSiteUrl = import.meta.env.VITE_SITE_URL;
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin.includes("localhost")
    ? DEFAULT_SITE_URL
    : requestUrl.origin;
  const siteUrl = normalizeBaseUrl(envSiteUrl ?? origin);

  const pages = [
    "/",
    "/about",
    "/blog",
    "/cart",
    "/checkout",
    "/contact",
    "/delivery",
    "/pre-order",
    "/privacy-terms",
    "/shop",
    "/warranty",
    "/pl",
    "/pl/about",
    "/pl/blog",
    "/pl/cart",
    "/pl/checkout",
    "/pl/contact",
    "/pl/delivery",
    "/pl/pre-order",
    "/pl/privacy-terms",
    "/pl/shop",
    "/pl/warranty",
  ];
  const now = new Date().toISOString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (path) => `  <url>
    <loc>${siteUrl}${path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${path === "/" ? "1.0" : "0.8"}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
