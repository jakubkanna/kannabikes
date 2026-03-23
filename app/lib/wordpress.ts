export type WordpressImage = {
  alt: string;
  height: number;
  src: string;
  srcSet: string;
  sources: Array<{ src: string; width: number }>;
  width: number;
};

export type WordpressPost = {
  contentHtml: string;
  excerpt: string;
  id: string;
  image: WordpressImage;
  publishedAt: string;
  slug: string;
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
  categories?: number[];
  content?: { rendered?: string };
  date?: string;
  excerpt?: { rendered?: string };
  id: number;
  link?: string;
  meta?: Record<string, unknown>;
  acf?: Record<string, unknown>;
  slug?: string;
  title?: { rendered?: string };
}>;

type WordpressCategoriesApiResponse = Array<{
  id: number;
  slug?: string;
}>;

const APP_BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
const WORDPRESS_API_BASE = (
  import.meta.env.VITE_WORDPRESS_API_BASE_URL ?? ""
).replace(/\/$/, "");
const WORDPRESS_BASE_URL = (() => {
  const explicitBaseUrl = import.meta.env.VITE_WORDPRESS_API_URL;

  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/$/, "");
  }

  if (WORDPRESS_API_BASE) {
    try {
      return new URL(WORDPRESS_API_BASE).origin;
    } catch {
      return WORDPRESS_API_BASE.replace(/\/wp-json.*$/i, "");
    }
  }

  return "http://localhost";
})();
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
    contentHtml: typeof post.content?.rendered === "string" ? post.content.rendered : "",
    excerpt: sanitizeHtml(post.excerpt?.rendered),
    id: `post-${post.id}`,
    image: mapWpImage(post.id, post._embedded),
    publishedAt: typeof post.date === "string" ? post.date : "",
    slug: typeof post.slug === "string" ? post.slug : String(post.id),
    title: sanitizeHtml(post.title?.rendered) || `Post ${post.id}`,
    url: customUrl,
  };
}

function parsePositiveInt(input: string | null, fallback: number) {
  const value = Number.parseInt(input ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function fetchWordpressCategoryId(
  slug: string,
  fetchImpl: typeof fetch = fetch,
) {
  const endpoint = new URL(`${WORDPRESS_BASE_URL}/wp-json/wp/v2/categories`);
  endpoint.searchParams.set("slug", slug);
  endpoint.searchParams.set("per_page", "1");

  const response = await fetchImpl(endpoint.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`WordPress category fetch failed (${response.status})`);
  }

  const payload = (await response.json()) as WordpressCategoriesApiResponse;
  const category = payload[0];

  return category?.id ?? null;
}

async function fetchWordpressPostsRequest(
  searchParams: Record<string, string>,
  fetchImpl: typeof fetch = fetch,
) {
  const endpoint = new URL(`${WORDPRESS_BASE_URL}/wp-json/wp/v2/posts`);

  for (const [key, value] of Object.entries(searchParams)) {
    endpoint.searchParams.set(key, value);
  }

  const response = await fetchImpl(endpoint.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`WordPress posts fetch failed (${response.status})`);
  }

  const payload = (await response.json()) as WordpressPostsApiResponse;

  return {
    payload,
    totalPages: parsePositiveInt(response.headers.get("x-wp-totalpages"), 1),
  };
}

export async function fetchWordpressPostsFromSource(
  page: number,
  pageSize: number,
  fetchImpl: typeof fetch = fetch,
): Promise<FetchPostsResult> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 50);

  const { payload, totalPages } = await fetchWordpressPostsRequest(
    {
      page: String(safePage),
      per_page: String(safePageSize),
      status: "publish",
      _embed: "wp:featuredmedia",
      orderby: "date",
      order: "desc",
    },
    fetchImpl,
  );
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

export async function fetchWordpressPostsByCategory(
  categorySlug: string,
  page: number,
  pageSize: number,
  fetchImpl: typeof fetch = fetch,
): Promise<FetchPostsResult> {
  const categoryId = await fetchWordpressCategoryId(categorySlug, fetchImpl);

  if (!categoryId) {
    return {
      hasMore: false,
      nextPage: null,
      posts: [],
    };
  }

  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 50);
  const { payload, totalPages } = await fetchWordpressPostsRequest(
    {
      page: String(safePage),
      per_page: String(safePageSize),
      status: "publish",
      _embed: "wp:featuredmedia",
      orderby: "date",
      order: "desc",
      categories: String(categoryId),
    },
    fetchImpl,
  );

  const posts = payload.map((post) => ({
    ...mapWpPost(post),
    url: `/blog/${typeof post.slug === "string" ? post.slug : post.id}`,
  }));

  return {
    hasMore: safePage < totalPages,
    nextPage: safePage < totalPages ? safePage + 1 : null,
    posts,
  };
}

export async function fetchWordpressPostBySlug(
  slug: string,
  categorySlug = "blog",
  fetchImpl: typeof fetch = fetch,
): Promise<WordpressPost | null> {
  const normalizedSlug = slug.trim();

  if (!normalizedSlug) {
    return null;
  }

  const categoryId = await fetchWordpressCategoryId(categorySlug, fetchImpl);

  if (!categoryId) {
    return null;
  }

  const { payload } = await fetchWordpressPostsRequest(
    {
      slug: normalizedSlug,
      status: "publish",
      _embed: "wp:featuredmedia",
      categories: String(categoryId),
      per_page: "1",
    },
    fetchImpl,
  );

  const post = payload.find((entry) =>
    Array.isArray(entry.categories) ? entry.categories.includes(categoryId) : false,
  );

  if (!post) {
    return null;
  }

  return {
    ...mapWpPost(post),
    url: `/blog/${normalizedSlug}`,
  };
}
