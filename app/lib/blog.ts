import type { Locale } from "./i18n";

const BLOG_CATEGORY_CONFIG = [
  {
    label: {
      en: "Routes",
      pl: "Trasy",
    },
    slug: "routes",
  },
  {
    label: {
      en: "Gear",
      pl: "Sprzęt",
    },
    slug: "gear",
  },
] as const;

const ROUTES_KEYWORDS = [
  "route",
  "routes",
  "trip",
  "trips",
  "tour",
  "tours",
  "travel",
  "travels",
  "trail",
  "trails",
  "bikepacking",
  "gravel route",
  "gravel routes",
  "itinerary",
  "trasa",
  "trasy",
  "wyprawa",
  "wyprawy",
  "podroz",
  "podroze",
  "szlak",
  "szlaki",
];

const GEAR_KEYWORDS = [
  "gear",
  "equipment",
  "setup",
  "set-up",
  "geometry",
  "geometria",
  "bike fit",
  "frame",
  "frameset",
  "fork",
  "cockpit",
  "wheel",
  "wheels",
  "tire",
  "tires",
  "tyre",
  "tyres",
  "drivetrain",
  "component",
  "components",
  "kit",
  "sprzet",
  "osprzet",
  "rama",
  "ramy",
  "widelec",
  "naped",
  "kolo",
  "kola",
];

export type BlogCategorySlug = (typeof BLOG_CATEGORY_CONFIG)[number]["slug"];

export type BlogCategory = {
  label: string;
  slug: BlogCategorySlug;
};

type BlogCategorySource = {
  categorySlugs?: string[];
  excerpt: string;
  slug: string;
  title: string;
  route?: {
    gpxDownloadUrl: string | null;
    rideWithGpsUrl: string | null;
  } | null;
};

function normalizeKeywordSource(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function hasKeywordMatch(source: string, keywords: readonly string[]) {
  return keywords.some((keyword) => source.includes(keyword));
}

function parsePositiveInteger(value: string) {
  return /^\d+$/.test(value) ? value : null;
}

export function getRideWithGpsRouteId(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    if (!hostname.endsWith("ridewithgps.com")) {
      return null;
    }

    const routeMatch = url.pathname.match(/^\/routes\/(\d+)(?:\/|$)/);

    if (routeMatch?.[1]) {
      return parsePositiveInteger(routeMatch[1]);
    }

    if (url.pathname === "/embeds") {
      return parsePositiveInteger(url.searchParams.get("id") ?? "");
    }
  } catch {
    return null;
  }

  return null;
}

export function buildRideWithGpsRouteUrl(value: string | null | undefined) {
  const routeId = getRideWithGpsRouteId(value);

  return routeId ? `https://ridewithgps.com/routes/${routeId}` : null;
}

export function buildRideWithGpsEmbedUrl(value: string | null | undefined) {
  const routeId = getRideWithGpsRouteId(value);

  return routeId
    ? `https://ridewithgps.com/embeds?id=${routeId}&sampleGraph=true&type=route`
    : null;
}

export function getBlogCategories(locale: Locale): BlogCategory[] {
  return BLOG_CATEGORY_CONFIG.map((category) => ({
    label: category.label[locale],
    slug: category.slug,
  }));
}

export function getBlogCategorySlugs(
  post: BlogCategorySource,
): BlogCategorySlug[] {
  const source = normalizeKeywordSource(
    [post.slug, post.title, post.excerpt].filter(Boolean).join(" "),
  );
  const categories: BlogCategorySlug[] = [];
  const categorySlugs = post.categorySlugs ?? [];

  if (post.route?.rideWithGpsUrl || post.route?.gpxDownloadUrl) {
    categories.push("routes");
  }

  if (categorySlugs.includes("route")) {
    if (!categories.includes("routes")) {
      categories.push("routes");
    }
  }

  if (categorySlugs.includes("gear")) {
    categories.push("gear");
  }

  if (hasKeywordMatch(source, ROUTES_KEYWORDS)) {
    if (!categories.includes("routes")) {
      categories.push("routes");
    }
  }

  if (hasKeywordMatch(source, GEAR_KEYWORDS)) {
    categories.push("gear");
  }

  return categories;
}
