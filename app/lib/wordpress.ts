import { localizePath, type Locale } from "./i18n";
import { sanitizeUserHtml } from "./html";
import {
  buildRideWithGpsEmbedUrl,
  buildRideWithGpsRouteUrl,
} from "./blog";

export type WordpressImage = {
  alt: string;
  height: number;
  src: string;
  srcSet: string;
  sources: Array<{ src: string; width: number }>;
  width: number;
};

export type WordpressPost = {
  categorySlugs: string[];
  commentsOpen: boolean;
  contentHtml: string;
  excerpt: string;
  id: string;
  image: WordpressImage;
  locale: Locale;
  postId: number;
  publishedAt: string;
  route: WordpressPostRoute | null;
  slug: string;
  title: string;
  translations: Partial<Record<Locale, string>>;
  url: string | null;
};

export type WordpressPostRoute = {
  gpxDownloadUrl: string | null;
  rideWithGpsEmbedUrl: string | null;
  rideWithGpsUrl: string | null;
};

export type WordpressComment = {
  authorName: string;
  avatarUrl: string | null;
  contentHtml: string;
  createdAt: string;
  currentUserVote: -1 | 0 | 1;
  id: number;
  parentId: number;
  status?: "approved" | "pending";
  voteScore: number;
};

export type FetchPostsResult = {
  hasMore: boolean;
  nextPage: number | null;
  posts: WordpressPost[];
};

export const BLOG_POST_CATEGORY_SLUGS = ["blog", "route", "gear"] as const;

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
  comment_status?: string;
  date?: string;
  excerpt?: { rendered?: string };
  id: number;
  lang?: string;
  link?: string;
  meta?: Record<string, unknown>;
  acf?: Record<string, unknown>;
  slug?: string;
  title?: { rendered?: string };
  translations?: Partial<Record<Locale, number>>;
}>;

type WordpressCommentsApiResponse = {
  comments: Array<{
    authorName?: string;
    avatarUrl?: string;
    contentHtml?: string;
    createdAt?: string;
    currentUserVote?: number;
    id: number;
    parentId?: number;
    status?: "approved" | "pending";
    voteScore?: number;
  }>;
};

type WordpressCategoriesApiResponse = Array<{
  id: number;
  slug?: string;
}>;

type WordpressMediaApiResponse = Array<{
  id: number;
  source_url?: string;
}>;

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
const WORDPRESS_REQUEST_BASE =
  typeof window === "undefined"
    ? WORDPRESS_BASE_URL
    : import.meta.env.DEV
      ? ""
      : WORDPRESS_BASE_URL;
const WORDPRESS_BASE_ORIGIN = (() => {
  try {
    return new URL(WORDPRESS_BASE_URL).origin;
  } catch {
    return WORDPRESS_BASE_URL;
  }
})();
const DEFAULT_IMAGE_SIZE = 1400;

function buildWordpressApiUrl(path: string) {
  const url = `${WORDPRESS_REQUEST_BASE}${path}`;

  if (/^https?:\/\//i.test(url)) {
    return new URL(url);
  }

  const fallbackOrigin =
    typeof window === "undefined" ? WORDPRESS_BASE_URL : window.location.origin;

  return new URL(url, fallbackOrigin);
}

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
    src: "",
    srcSet: "",
    sources: [],
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

function normalizeAcfFileUrl(
  value: unknown,
  mediaUrlsById: Map<number, string> = new Map(),
) {
  if (typeof value === "string") {
    return normalizeUrl(value);
  }

  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return normalizeUrl(mediaUrlsById.get(value));
  }

  if (value && typeof value === "object" && "url" in value) {
    return normalizeUrl((value as { url?: unknown }).url);
  }

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

function mapWpPost(
  post: WordpressPostsApiResponse[number],
  locale: Locale,
  translations: Partial<Record<Locale, string>> = {},
  knownCategorySlugsById: Map<number, string> = new Map(),
  mediaUrlsById: Map<number, string> = new Map(),
): WordpressPost {
  const customUrl = pickCustomUrl(post);
  const rideWithGpsUrl = buildRideWithGpsRouteUrl(
    normalizeUrl(post.acf?.ride_with_gps_url),
  );
  const gpxDownloadUrl = normalizeAcfFileUrl(
    post.acf?.route_gpx_file,
    mediaUrlsById,
  );
  const rideWithGpsEmbedUrl = buildRideWithGpsEmbedUrl(rideWithGpsUrl);
  const route =
    rideWithGpsUrl || gpxDownloadUrl
      ? {
          gpxDownloadUrl,
          rideWithGpsEmbedUrl,
          rideWithGpsUrl,
        }
      : null;
  const categorySlugs = Array.isArray(post.categories)
    ? post.categories
        .map((categoryId) => knownCategorySlugsById.get(categoryId))
        .filter((slug): slug is string => Boolean(slug))
    : [];

  return {
    categorySlugs,
    commentsOpen: post.comment_status !== "closed",
    contentHtml: typeof post.content?.rendered === "string" ? post.content.rendered : "",
    excerpt: sanitizeHtml(post.excerpt?.rendered),
    id: `post-${post.id}`,
    image: mapWpImage(post.id, post._embedded),
    locale,
    postId: post.id,
    publishedAt: typeof post.date === "string" ? post.date : "",
    route,
    slug: typeof post.slug === "string" ? post.slug : String(post.id),
    title: sanitizeHtml(post.title?.rendered) || `Post ${post.id}`,
    translations,
    url: customUrl,
  };
}

function parsePositiveInt(input: string | null, fallback: number) {
  const value = Number.parseInt(input ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function fetchWordpressCategoryId(
  slug: string,
  locale: Locale,
  fetchImpl: typeof fetch = fetch,
) {
  const payload = await fetchWordpressCategoriesBySlugs([slug], locale, fetchImpl);
  const category = payload[0];

  return category?.id ?? null;
}

async function fetchWordpressCategoriesBySlugs(
  slugs: readonly string[],
  locale: Locale,
  fetchImpl: typeof fetch = fetch,
) {
  const normalizedSlugs = Array.from(
    new Set(slugs.map((slug) => slug.trim()).filter(Boolean)),
  );

  if (normalizedSlugs.length === 0) {
    return [];
  }

  const endpoint = buildWordpressApiUrl("/wp-json/wp/v2/categories");
  endpoint.searchParams.set("lang", locale);
  endpoint.searchParams.set("slug", normalizedSlugs.join(","));
  endpoint.searchParams.set("per_page", String(normalizedSlugs.length));

  const response = await fetchImpl(endpoint.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`WordPress category fetch failed (${response.status})`);
  }

  const payload = (await response.json()) as WordpressCategoriesApiResponse;

  return payload.filter(
    (category) =>
      Number.isFinite(category.id) &&
      category.id > 0 &&
      typeof category.slug === "string" &&
      category.slug.trim().length > 0,
  );
}

async function fetchWordpressPostsRequest(
  searchParams: Record<string, string>,
  fetchImpl: typeof fetch = fetch,
) {
  const endpoint = buildWordpressApiUrl("/wp-json/wp/v2/posts");

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

async function fetchWordpressPostSlugsByIds(
  ids: number[],
  locale: Locale,
  fetchImpl: typeof fetch = fetch,
) {
  const uniqueIds = Array.from(new Set(ids.filter((id) => Number.isFinite(id) && id > 0)));

  if (uniqueIds.length === 0) {
    return new Map<number, string>();
  }

  const { payload } = await fetchWordpressPostsRequest(
    {
      _embed: "wp:featuredmedia",
      include: uniqueIds.join(","),
      lang: locale,
      per_page: String(uniqueIds.length),
      status: "publish",
    },
    fetchImpl,
  );

  return new Map(
    payload.map((post) => [
      post.id,
      typeof post.slug === "string" ? post.slug : String(post.id),
    ]),
  );
}

async function fetchWordpressMediaUrlsByIds(
  ids: number[],
  fetchImpl: typeof fetch = fetch,
) {
  const uniqueIds = Array.from(
    new Set(ids.filter((id) => Number.isFinite(id) && id > 0)),
  );

  if (uniqueIds.length === 0) {
    return new Map<number, string>();
  }

  const endpoint = buildWordpressApiUrl("/wp-json/wp/v2/media");
  endpoint.searchParams.set("include", uniqueIds.join(","));
  endpoint.searchParams.set("per_page", String(uniqueIds.length));
  endpoint.searchParams.set("_fields", "id,source_url");

  const response = await fetchImpl(endpoint.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`WordPress media fetch failed (${response.status})`);
  }

  const payload = (await response.json()) as WordpressMediaApiResponse;

  return new Map(
    payload
      .map((media) => [media.id, normalizeUrl(media.source_url)] as const)
      .filter((entry): entry is [number, string] => Boolean(entry[1])),
  );
}

async function mapWordpressPostsWithTranslations(
  posts: WordpressPostsApiResponse,
  locale: Locale,
  fetchImpl: typeof fetch = fetch,
  knownCategorySlugsById: Map<number, string> = new Map(),
) {
  const translationIds = posts.flatMap((post) =>
    Object.entries(post.translations ?? {})
      .filter(([language, id]) => language !== locale && typeof id === "number")
      .map(([, id]) => id as number),
  );
  const translationSlugsById = await fetchWordpressPostSlugsByIds(
    translationIds,
    locale === "en" ? "pl" : "en",
    fetchImpl,
  );
  const mediaIds = posts
    .map((post) => post.acf?.route_gpx_file)
    .filter(
      (value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0,
    );
  const mediaUrlsById = await fetchWordpressMediaUrlsByIds(mediaIds, fetchImpl);

  return posts.map((post) => {
    const translations = Object.entries(post.translations ?? {}).reduce<
      Partial<Record<Locale, string>>
    >((accumulator, [language, id]) => {
      if ((language === "en" || language === "pl") && typeof id === "number") {
        const slug = translationSlugsById.get(id);
        if (slug) {
          accumulator[language] = localizePath(`/blog/${slug}`, language);
        }
      }

      return accumulator;
    }, {});

    return {
      ...mapWpPost(
        post,
        locale,
        translations,
        knownCategorySlugsById,
        mediaUrlsById,
      ),
      url: localizePath(
        `/blog/${typeof post.slug === "string" ? post.slug : post.id}`,
        locale,
      ),
    };
  });
}

export async function fetchWordpressPostsFromSource(
  page: number,
  pageSize: number,
  locale: Locale,
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
      lang: locale,
      orderby: "date",
      order: "desc",
    },
    fetchImpl,
  );
  const posts = await mapWordpressPostsWithTranslations(payload, locale, fetchImpl);

  return {
    hasMore: safePage < totalPages,
    nextPage: safePage < totalPages ? safePage + 1 : null,
    posts,
  };
}

export async function fetchWordpressPosts(
  page: number,
  pageSize: number,
  locale: Locale,
): Promise<FetchPostsResult> {
  return fetchWordpressPostsFromSource(page, pageSize, locale);
}

export async function fetchWordpressPostsByCategory(
  categorySlug: string | readonly string[],
  locale: Locale,
  page: number,
  pageSize: number,
  fetchImpl: typeof fetch = fetch,
): Promise<FetchPostsResult> {
  const categorySlugs = Array.isArray(categorySlug)
    ? categorySlug
    : [categorySlug];
  const categories = await fetchWordpressCategoriesBySlugs(
    categorySlugs,
    locale,
    fetchImpl,
  );
  const categoryIds = categories.map((category) => category.id);
  const categorySlugById = new Map(
    categories.map((category) => [category.id, category.slug ?? String(category.id)]),
  );

  if (categoryIds.length === 0) {
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
      lang: locale,
      orderby: "date",
      order: "desc",
      categories: categoryIds.join(","),
    },
    fetchImpl,
  );
  const matchingPayload = payload.filter((entry) =>
    Array.isArray(entry.categories)
      ? entry.categories.some((categoryId) => categoryIds.includes(categoryId))
      : false,
  );
  const posts = await mapWordpressPostsWithTranslations(
    matchingPayload,
    locale,
    fetchImpl,
    categorySlugById,
  );

  return {
    hasMore: safePage < totalPages,
    nextPage: safePage < totalPages ? safePage + 1 : null,
    posts,
  };
}

export async function fetchWordpressPostBySlug(
  slug: string,
  locale: Locale,
  categorySlug: string | readonly string[] = BLOG_POST_CATEGORY_SLUGS,
  fetchImpl: typeof fetch = fetch,
): Promise<WordpressPost | null> {
  const normalizedSlug = slug.trim();

  if (!normalizedSlug) {
    return null;
  }

  const categorySlugs = Array.isArray(categorySlug)
    ? categorySlug
    : [categorySlug];
  const categories = await fetchWordpressCategoriesBySlugs(
    categorySlugs,
    locale,
    fetchImpl,
  );
  const categoryIds = categories.map((category) => category.id);
  const categorySlugById = new Map(
    categories.map((category) => [category.id, category.slug ?? String(category.id)]),
  );

  if (categoryIds.length === 0) {
    return null;
  }

  const { payload } = await fetchWordpressPostsRequest(
    {
      slug: normalizedSlug,
      status: "publish",
      _embed: "wp:featuredmedia",
      lang: locale,
      categories: categoryIds.join(","),
      per_page: "1",
    },
    fetchImpl,
  );

  const post = payload.find((entry) =>
    Array.isArray(entry.categories)
      ? entry.categories.some((categoryId) => categoryIds.includes(categoryId))
      : false,
  );

  if (!post) {
    return null;
  }

  const [mappedPost] = await mapWordpressPostsWithTranslations(
    [post],
    locale,
    fetchImpl,
    categorySlugById,
  );
  return mappedPost ?? null;
}

export async function fetchWordpressComments(
  postId: number,
  fetchImpl: typeof fetch = fetch,
): Promise<WordpressComment[]> {
  if (!Number.isFinite(postId) || postId <= 0) {
    return [];
  }

  const endpoint = buildWordpressApiUrl("/wp-json/kanna-auth/v1/blog/comments");
  endpoint.searchParams.set("postId", String(postId));

  const response = await fetchImpl(endpoint.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`WordPress comments fetch failed (${response.status})`);
  }

  const payload = (await response.json()) as WordpressCommentsApiResponse;

  return payload.comments.map((comment) => ({
    authorName:
      typeof comment.authorName === "string" && comment.authorName.trim()
        ? comment.authorName.trim()
        : "Anonymous",
    avatarUrl:
      typeof comment.avatarUrl === "string" && comment.avatarUrl.trim()
        ? comment.avatarUrl.trim()
        : null,
    contentHtml: sanitizeUserHtml(
      typeof comment.contentHtml === "string" ? comment.contentHtml : "",
    ),
    createdAt: typeof comment.createdAt === "string" ? comment.createdAt : "",
    currentUserVote:
      comment.currentUserVote === 1
        ? 1
        : comment.currentUserVote === -1
          ? -1
          : 0,
    id: comment.id,
    parentId: Number.isFinite(comment.parentId) ? Number(comment.parentId) : 0,
    status: comment.status,
    voteScore: Number.isFinite(comment.voteScore) ? Number(comment.voteScore) : 0,
  }));
}
