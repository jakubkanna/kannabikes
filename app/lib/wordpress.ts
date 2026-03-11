export type WordpressImage = {
  alt: string;
  height: number;
  src: string;
  srcSet: string;
  sources: Array<{ src: string; width: number }>;
  width: number;
};

export type WordpressPost = {
  excerpt: string;
  id: string;
  image: WordpressImage;
  title: string;
  url: string | null;
};

export type FetchPostsResult = {
  hasMore: boolean;
  nextPage: number | null;
  posts: WordpressPost[];
};

type WordpressPostsApiResponse = Array<{
  [key: string]: unknown;
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      alt_text?: string;
      media_details?: {
        height?: number;
        sizes?: Record<
          string,
          {
            source_url?: string;
            width?: number;
          }
        >;
        width?: number;
      };
      source_url?: string;
    }>;
  };
  excerpt?: { rendered?: string };
  id: number;
  link?: string;
  meta?: Record<string, unknown>;
  acf?: Record<string, unknown>;
  title?: { rendered?: string };
}>;

const APP_BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
const WORDPRESS_BASE_URL = (
  import.meta.env.VITE_WORDPRESS_API_URL ?? "http://localhost:8080"
).replace(/\/$/, "");
const WORDPRESS_BASE_ORIGIN = (() => {
  try {
    return new URL(WORDPRESS_BASE_URL).origin;
  } catch {
    return WORDPRESS_BASE_URL;
  }
})();
const PLACEHOLDER_SRC = `${APP_BASE}/placeholder.png`;
const DEFAULT_IMAGE_SIZE = 1400;

function sanitizeHtml(input: string | undefined) {
  return (input ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function createFallbackImage(postId: number): WordpressImage {
  return {
    alt: `Portfolio visual ${postId}`,
    height: DEFAULT_IMAGE_SIZE,
    src: PLACEHOLDER_SRC,
    srcSet: `${PLACEHOLDER_SRC} ${DEFAULT_IMAGE_SIZE}w`,
    sources: [{ src: PLACEHOLDER_SRC, width: DEFAULT_IMAGE_SIZE }],
    width: DEFAULT_IMAGE_SIZE,
  };
}

function normalizeUrl(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (/^(https?:\/\/|mailto:|tel:|\/)/i.test(normalized)) return normalized;
  return null;
}

function normalizeWordpressAssetUrl(value: string | undefined) {
  if (!value) return "";

  try {
    const raw = new URL(value, WORDPRESS_BASE_URL);
    const normalized = new URL(raw.pathname + raw.search + raw.hash, WORDPRESS_BASE_ORIGIN);
    return normalized.toString();
  } catch {
    return value;
  }
}

function pickCustomUrl(post: WordpressPostsApiResponse[number]) {
  const candidateValues: unknown[] = [
    post.url,
    post.acf?.url,
    post.meta?.url,
  ];

  for (const candidate of candidateValues) {
    const normalized = normalizeUrl(candidate);
    if (normalized) return normalized;
  }

  return null;
}

function mapWpImage(postId: number, media: WordpressPostsApiResponse[number]["_embedded"]) {
  const featured = media?.["wp:featuredmedia"]?.[0];
  if (!featured?.source_url) return createFallbackImage(postId);

  const sizes = Object.values(featured.media_details?.sizes ?? {})
    .map((size) => ({
      src: normalizeWordpressAssetUrl(size.source_url),
      width: size.width ?? 0,
    }))
    .filter((size) => size.src && size.width > 0)
    .sort((a, b) => a.width - b.width);

  const normalizedSource = normalizeWordpressAssetUrl(featured.source_url);
  const width = featured.media_details?.width ?? DEFAULT_IMAGE_SIZE;
  const height = featured.media_details?.height ?? DEFAULT_IMAGE_SIZE;
  const sourceSet =
    sizes.length > 0
      ? sizes.map((source) => `${source.src} ${source.width}w`).join(", ")
      : `${normalizedSource} ${width}w`;

  return {
    alt: featured.alt_text?.trim() || `Portfolio visual ${postId}`,
    height,
    src: normalizedSource,
    srcSet: sourceSet,
    sources: sizes.length > 0 ? sizes : [{ src: normalizedSource, width }],
    width,
  };
}

function mapWpPost(post: WordpressPostsApiResponse[number]): WordpressPost {
  const customUrl = pickCustomUrl(post);
  return {
    excerpt: sanitizeHtml(post.excerpt?.rendered),
    id: `post-${post.id}`,
    image: mapWpImage(post.id, post._embedded),
    title: sanitizeHtml(post.title?.rendered) || `Post ${post.id}`,
    url: customUrl,
  };
}

function parsePositiveInt(input: string | null, fallback: number) {
  const value = Number.parseInt(input ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export async function fetchWordpressPostsFromSource(
  page: number,
  pageSize: number,
  fetchImpl: typeof fetch = fetch,
): Promise<FetchPostsResult> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 50);

  const endpoint = new URL(`${WORDPRESS_BASE_URL}/wp-json/wp/v2/posts`);
  endpoint.searchParams.set("page", String(safePage));
  endpoint.searchParams.set("per_page", String(safePageSize));
  endpoint.searchParams.set("status", "publish");
  endpoint.searchParams.set("_embed", "wp:featuredmedia");
  endpoint.searchParams.set("orderby", "date");
  endpoint.searchParams.set("order", "desc");

  const response = await fetchImpl(endpoint.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`WordPress posts fetch failed (${response.status})`);
  }

  const totalPages = parsePositiveInt(response.headers.get("x-wp-totalpages"), 1);
  const payload = (await response.json()) as WordpressPostsApiResponse;
  const posts = payload.map(mapWpPost);

  return {
    hasMore: safePage < totalPages,
    nextPage: safePage < totalPages ? safePage + 1 : null,
    posts,
  };
}

export async function fetchWordpressPosts(
  page: number,
  pageSize: number,
): Promise<FetchPostsResult> {
  return fetchWordpressPostsFromSource(page, pageSize);
}
