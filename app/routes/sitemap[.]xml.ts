import { fetchStoreCategories, fetchStoreProducts } from "~/lib/store-api";
import { SITE_URL, type Locale } from "~/lib/i18n";
import {
  BLOG_POST_CATEGORY_SLUGS,
  fetchWordpressPostsByCategory,
} from "~/lib/wordpress";
import { getStaticPublicSitemapEntries } from "../../route-manifest";
import type { Route } from "./+types/sitemap[.]xml";

type SitemapEntry = {
  lastmod?: string;
  path: string;
  priority?: string;
};

const STATIC_PUBLIC_PATHS: SitemapEntry[] = getStaticPublicSitemapEntries();

function reportSitemapSourceFailure(source: string, error: unknown) {
  console.error(`[sitemap] Failed to fetch ${source}.`, error);
}

function normalizeBaseUrl(input: string) {
  return input.endsWith("/") ? input.slice(0, -1) : input;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function addEntry(
  entries: Map<string, SitemapEntry>,
  entry: SitemapEntry | null | undefined,
) {
  if (!entry?.path?.startsWith("/")) {
    return;
  }

  const current = entries.get(entry.path);

  if (!current) {
    entries.set(entry.path, entry);
    return;
  }

  if (!current.lastmod && entry.lastmod) {
    current.lastmod = entry.lastmod;
  }
}

async function fetchAllStoreProducts(locale: Locale) {
  const products = [];
  const perPage = 100;

  for (let page = 1; page <= 10; page += 1) {
    const batch = await fetchStoreProducts({ locale, page, perPage }).catch((error) => {
      reportSitemapSourceFailure(`store products (${locale}, page ${page})`, error);
      return [];
    });

    if (batch.length === 0) {
      break;
    }

    products.push(...batch);

    if (batch.length < perPage) {
      break;
    }
  }

  return products;
}

async function fetchAllBlogPosts(locale: Locale) {
  const posts = [];
  let page = 1;

  while (page <= 20) {
    const result = await fetchWordpressPostsByCategory(
      BLOG_POST_CATEGORY_SLUGS,
      locale,
      page,
      50,
    )
      .catch((error) => {
        reportSitemapSourceFailure(`blog posts (${locale}, page ${page})`, error);
        return {
        hasMore: false,
        nextPage: null,
        posts: [],
      };
      });

    posts.push(...result.posts);

    if (!result.hasMore || !result.nextPage) {
      break;
    }

    page = result.nextPage;
  }

  return posts;
}

export async function loader({ request }: Route.LoaderArgs) {
  const requestUrl = new URL(request.url);
  const siteUrl = normalizeBaseUrl(
    import.meta.env.VITE_SITE_URL?.trim() || SITE_URL || requestUrl.origin,
  );
  const entries = new Map<string, SitemapEntry>();

  for (const entry of STATIC_PUBLIC_PATHS) {
    addEntry(entries, entry);
  }

  const [enCategories, plCategories, enProducts, plProducts, enPosts, plPosts] =
    await Promise.all([
      fetchStoreCategories("en").catch((error) => {
        reportSitemapSourceFailure("store categories (en)", error);
        return [];
      }),
      fetchStoreCategories("pl").catch((error) => {
        reportSitemapSourceFailure("store categories (pl)", error);
        return [];
      }),
      fetchAllStoreProducts("en"),
      fetchAllStoreProducts("pl"),
      fetchAllBlogPosts("en"),
      fetchAllBlogPosts("pl"),
    ]);

  for (const category of [...enCategories, ...plCategories]) {
    addEntry(entries, {
      path: category.path,
      priority: "0.7",
    });
  }

  for (const product of [...enProducts, ...plProducts]) {
    addEntry(entries, {
      path: product.path,
      priority: "0.8",
    });

    for (const translatedPath of Object.values(product.translationPaths)) {
      if (!translatedPath) {
        continue;
      }

      addEntry(entries, {
        path: translatedPath,
        priority: "0.8",
      });
    }
  }

  for (const post of [...enPosts, ...plPosts]) {
    if (post.url) {
      addEntry(entries, {
        lastmod: post.publishedAt || undefined,
        path: post.url,
        priority: "0.7",
      });
    }

    for (const translatedPath of Object.values(post.translations)) {
      if (!translatedPath) {
        continue;
      }

      addEntry(entries, {
        lastmod: post.publishedAt || undefined,
        path: translatedPath,
        priority: "0.7",
      });
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from(entries.values())
  .sort((a, b) => a.path.localeCompare(b.path))
  .map((entry) => `  <url>
    <loc>${escapeXml(`${siteUrl}${entry.path === "/" ? "" : entry.path}`)}</loc>${entry.lastmod ? `
    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>${entry.priority ?? "0.6"}</priority>
  </url>`)
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
