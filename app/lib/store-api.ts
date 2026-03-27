import {
  getIntlLocale,
  getLocaleFromPath,
  localizePath,
  type Locale,
} from "./i18n";

type StoreApiImage = {
  alt?: string;
  id?: number;
  name?: string;
  src?: string;
  srcset?: string;
  thumbnail?: string;
};

type StoreApiCategory = {
  id: number;
  image?: StoreApiImage | null;
  name?: string;
  slug?: string;
};

type StoreApiProductAttributeTerm = {
  default?: boolean;
  id?: number;
  name?: string;
  slug?: string;
};

type StoreApiProductAttribute = {
  has_variations?: boolean;
  id?: number;
  name?: string;
  taxonomy?: string;
  terms?: StoreApiProductAttributeTerm[];
};

type StoreApiProductVariation = {
  attributes?: Array<{
    name?: string;
    value?: string;
  }>;
  id: number;
};

type StoreApiProduct = {
  attributes?: StoreApiProductAttribute[];
  categories?: StoreApiCategory[];
  description?: string;
  has_options?: boolean;
  id: number;
  images?: StoreApiImage[];
  name?: string;
  permalink?: string;
  prices?: {
    currency_code?: string;
    currency_minor_unit?: number;
    price?: string;
    regular_price?: string;
    sale_price?: string;
  };
  short_description?: string;
  slug?: string;
  stock_status?: string;
  summary?: string;
  type?: string;
  translations?: Record<string, { permalink?: string; slug?: string } | string>;
  variations?: StoreApiProductVariation[];
};

type StoreApiProductReview = {
  date_created?: string;
  id: number;
  rating?: number;
  review?: string;
  reviewer?: string;
  reviewer_avatar_urls?: Record<string, string>;
  verified?: boolean;
};

type StoreApiCartItem = {
  id: string;
  key: string;
  name: string;
  permalink?: string;
  permutation: string[];
  prices: {
    currency_code: string;
    currency_minor_unit: number;
    line_price: string;
    price: string;
  };
  quantity: number;
  slug: string;
  totals: {
    line_total: string;
  };
};

type StoreApiCart = {
  items: StoreApiCartItem[];
  items_count?: number;
  shipping_rates?: Array<{
    shipping_rates?: Array<{
      name?: string;
      selected?: boolean;
    }>;
  }>;
  totals: {
    total_shipping?: string | null;
    total_shipping_tax?: string | null;
    total_tax?: string;
    total_items: string;
    total_items_tax?: string;
    total_price: string;
  };
};

export type StoreCategory = {
  id: number;
  imageSrc: string | null;
  name: string;
  path: string;
  slug: string;
};

export type StoreProduct = {
  categorySlugs: string[];
  currencyCode: string;
  currencyMinorUnit: number;
  descriptionHtml: string;
  hasOptions: boolean;
  id: number;
  imageAlt: string;
  imageSrc: string | null;
  images: Array<{
    alt: string;
    src: string;
  }>;
  locale: Locale;
  name: string;
  optionAttributes: Array<{
    name: string;
    slug: string;
    terms: Array<{
      isDefault: boolean;
      name: string;
      slug: string;
    }>;
  }>;
  path: string;
  price: string;
  productType: string;
  regularPrice: string;
  salePrice: string;
  shortDescriptionHtml: string;
  slug: string;
  stockStatus: string;
  translationPaths: Partial<Record<Locale, string>>;
  variations: Array<{
    attributes: Record<string, string>;
    id: number;
  }>;
};

export type StoreProductReview = {
  author: string;
  avatarSrc: string | null;
  body: string;
  createdAt: string;
  id: number;
  rating: number;
  verified: boolean;
};

export type StoreCartItem = {
  id: string;
  key: string;
  name: string;
  path: string;
  price: string;
  quantity: number;
  total: string;
};

export type StoreCart = {
  items: StoreCartItem[];
  shippingCalculated: boolean;
  shipping: string;
  shippingMethod: string;
  subtotal: string;
  total: string;
  totalItems: number;
  vat: string;
};

export const STORE_CART_UPDATED_EVENT = "kanna:store-cart-updated";

type StoreCartUpdatedDetail = {
  cart: StoreCart;
  openDrawer?: boolean;
};

export type CheckoutPayload = {
  billing_address: {
    address_1: string;
    city: string;
    country: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    postcode: string;
  };
  customer_note?: string;
  payment_method: string;
  shipping_address?: {
    address_1: string;
    city: string;
    country: string;
    first_name: string;
    last_name: string;
    postcode: string;
  };
};

const DEFAULT_WORDPRESS_API_BASE =
  import.meta.env.VITE_WORDPRESS_API_BASE_URL ?? "http://localhost/wp-json/kanna/v1";

const WORDPRESS_BASE_URL = (() => {
  const explicitBaseUrl = import.meta.env.VITE_WORDPRESS_API_URL;

  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/$/, "");
  }

  try {
    return new URL(DEFAULT_WORDPRESS_API_BASE).origin;
  } catch {
    return DEFAULT_WORDPRESS_API_BASE.replace(/\/wp-json.*$/i, "");
  }
})();
const WORDPRESS_REQUEST_BASE =
  typeof window === "undefined"
    ? WORDPRESS_BASE_URL
    : import.meta.env.DEV
      ? ""
      : WORDPRESS_BASE_URL;

const STORE_API_BASE = `${WORDPRESS_BASE_URL}/wp-json/wc/store/v1`;
const CART_TOKEN_STORAGE_KEY = "kanna-store-cart-token";
const STORE_NONCE_STORAGE_KEY = "kanna-store-nonce";

function buildApiUrl(path: string) {
  const url = `${WORDPRESS_REQUEST_BASE}/wp-json/wc/store/v1${path}`;

  if (/^https?:\/\//i.test(url)) {
    return new URL(url);
  }

  const fallbackOrigin =
    typeof window === "undefined" ? WORDPRESS_BASE_URL : window.location.origin;

  return new URL(url, fallbackOrigin);
}

function normalizeMoney(
  rawValue: string | undefined,
  currencyCode: string,
  minorUnit: number,
  locale: Locale,
) {
  const parsedValue = Number.parseInt(rawValue ?? "0", 10);

  if (!Number.isFinite(parsedValue)) {
    return "";
  }

  const displayCurrency = locale === "pl" ? "PLN" : currencyCode || "EUR";

  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: "currency",
    currency: displayCurrency,
    minimumFractionDigits: minorUnit,
    maximumFractionDigits: minorUnit,
  }).format(parsedValue / 10 ** minorUnit);
}

function getStoredCartToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(CART_TOKEN_STORAGE_KEY) ?? "";
}

function setStoredCartToken(cartToken: string) {
  if (typeof window === "undefined" || !cartToken) {
    return;
  }

  window.localStorage.setItem(CART_TOKEN_STORAGE_KEY, cartToken);
}

function getStoredStoreNonce() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(STORE_NONCE_STORAGE_KEY) ?? "";
}

function setStoredStoreNonce(nonce: string) {
  if (typeof window === "undefined" || !nonce) {
    return;
  }

  window.localStorage.setItem(STORE_NONCE_STORAGE_KEY, nonce);
}

function normalizeOptionKey(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function buildStoreProductPath({
  fallbackId,
  locale,
  permalink,
  slug,
}: {
  fallbackId: number | string;
  locale: Locale;
  permalink?: string;
  slug?: string;
}) {
  const normalizedSlug = slug?.trim();

  if (normalizedSlug) {
    return localizePath(`/shop/products/${normalizedSlug}`, locale);
  }

  if (permalink) {
    try {
      const pathname = new URL(permalink, WORDPRESS_BASE_URL).pathname.replace(/\/+$/, "");
      const strippedPathname = pathname.replace(/^\/pl(?=\/|$)/, "") || "/";
      const segments = strippedPathname.split("/").filter(Boolean);
      const permalinkSlug = segments[segments.length - 1];

      if (permalinkSlug) {
        return localizePath(`/shop/products/${permalinkSlug}`, locale);
      }
    } catch {
      // Fall through to the id-based path.
    }
  }

  return localizePath(`/shop/products/${fallbackId}`, locale);
}

async function storeApiRequest<T>(
  path: string,
  options?: {
    body?: BodyInit | null;
    locale?: Locale;
    method?: "GET" | "POST";
    searchParams?: Record<string, string | number | undefined>;
  },
) {
  const endpoint = buildApiUrl(path);
  const locale = options?.locale;

  if (locale) {
    endpoint.searchParams.set("lang", locale);
  }

  for (const [key, value] of Object.entries(options?.searchParams ?? {})) {
    if (value === undefined || value === "") continue;
    endpoint.searchParams.set(key, String(value));
  }

  const cartToken = getStoredCartToken();
  const nonce = getStoredStoreNonce();
  const headers = new Headers();

  if (cartToken) {
    headers.set("Cart-Token", cartToken);
  }

  if (nonce) {
    headers.set("Nonce", nonce);
  }

  if (typeof options?.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(endpoint.toString(), {
    method: options?.method ?? "GET",
    headers,
    body: options?.body ?? null,
  });
  const nextCartToken = response.headers.get("Cart-Token");
  const nextNonce = response.headers.get("Nonce");

  if (nextCartToken) {
    setStoredCartToken(nextCartToken);
  }

  if (nextNonce) {
    setStoredStoreNonce(nextNonce);
  }

  const payload = (await response.json().catch(() => null)) as
    | (T & { message?: string })
    | null;

  if (!response.ok) {
    throw new Error(payload?.message ?? `Store API request failed (${response.status})`);
  }

  return payload as T;
}

function mapTranslationPaths(
  translations: StoreApiProduct["translations"],
  fallbackPath: string,
) {
  const mapped: Partial<Record<Locale, string>> = {};

  if (!translations) {
    return mapped;
  }

  for (const locale of ["en", "pl"] as const) {
    const translation = translations[locale];

    if (!translation) continue;

    if (typeof translation === "string") {
      try {
        const pathname = new URL(translation, WORDPRESS_BASE_URL).pathname;
        mapped[locale] = localizePath(pathname.replace(/^\/shop\//, "/shop/products/"), locale);
      } catch {}
      continue;
    }

    if (translation.slug) {
      mapped[locale] = localizePath(`/shop/products/${translation.slug}`, locale);
      continue;
    }

    if (translation.permalink) {
      try {
        const pathname = new URL(translation.permalink, WORDPRESS_BASE_URL).pathname;
        mapped[locale] = localizePath(pathname.replace(/^\/shop\//, "/shop/products/"), locale);
      } catch {}
    }
  }

  if (!mapped.en) {
    mapped.en = localizePath(fallbackPath, "en");
  }

  if (!mapped.pl) {
    mapped.pl = localizePath(fallbackPath, "pl");
  }

  return mapped;
}

function mapOptionAttributes(attributes: StoreApiProduct["attributes"]) {
  return (attributes ?? [])
    .filter((attribute) => attribute.has_variations)
    .map((attribute) => ({
      name: attribute.name ?? "",
      slug: attribute.taxonomy ?? normalizeOptionKey(attribute.name),
      terms: (attribute.terms ?? []).map((term) => ({
        isDefault: Boolean(term.default),
        name: term.name ?? "",
        slug: term.slug ?? "",
      })),
    }))
    .filter((attribute) => attribute.name && attribute.terms.length > 0);
}

function mapProductVariations(variations: StoreApiProduct["variations"]) {
  return (variations ?? []).map((variation) => ({
    attributes: Object.fromEntries(
      (variation.attributes ?? [])
        .filter((attribute) => attribute.name && attribute.value)
        .map((attribute) => [normalizeOptionKey(attribute.name), attribute.value ?? ""]),
    ),
    id: variation.id,
  }));
}

function mapStoreProduct(product: StoreApiProduct, locale: Locale): StoreProduct {
  const prices = product.prices ?? {};
  const currencyCode = prices.currency_code ?? "EUR";
  const currencyMinorUnit = prices.currency_minor_unit ?? 2;
  const path = buildStoreProductPath({
    fallbackId: product.id,
    locale,
    permalink: product.permalink,
    slug: product.slug,
  });
  const optionAttributes = mapOptionAttributes(product.attributes);
  const variations = mapProductVariations(product.variations);
  const images = (product.images ?? [])
    .map((image) => ({
      alt: image.alt ?? image.name ?? product.name ?? "",
      src: image.src ?? image.thumbnail ?? "",
    }))
    .filter((image) => image.src);

  return {
    categorySlugs: (product.categories ?? [])
      .map((category) => category.slug ?? "")
      .filter(Boolean),
    currencyCode,
    currencyMinorUnit,
    descriptionHtml: product.description ?? "",
    hasOptions: Boolean(product.has_options),
    id: product.id,
    imageAlt: product.images?.[0]?.alt ?? product.images?.[0]?.name ?? product.name ?? "",
    imageSrc:
      product.images?.[0]?.src ??
      product.images?.[0]?.thumbnail ??
      null,
    images,
    locale,
    name: product.name ?? `Product ${product.id}`,
    optionAttributes,
    path,
    price: normalizeMoney(prices.price, currencyCode, currencyMinorUnit, locale),
    productType: product.type ?? "simple",
    regularPrice: normalizeMoney(
      prices.regular_price,
      currencyCode,
      currencyMinorUnit,
      locale,
    ),
    salePrice: normalizeMoney(
      prices.sale_price,
      currencyCode,
      currencyMinorUnit,
      locale,
    ),
    shortDescriptionHtml:
      product.short_description ?? product.summary ?? product.description ?? "",
    slug: product.slug ?? String(product.id),
    stockStatus: product.stock_status ?? "",
    translationPaths: mapTranslationPaths(product.translations, path),
    variations,
  };
}

function mapStoreCategory(category: StoreApiCategory, locale: Locale): StoreCategory {
  return {
    id: category.id,
    imageSrc: category.image?.src ?? category.image?.thumbnail ?? null,
    name: category.name ?? `Category ${category.id}`,
    path: localizePath(`/shop/categories/${category.slug ?? category.id}`, locale),
    slug: category.slug ?? String(category.id),
  };
}

function mapStoreCart(cart: StoreApiCart, locale: Locale): StoreCart {
  const totalCurrencyCode =
    cart.items[0]?.prices.currency_code ?? "EUR";
  const totalMinorUnit =
    cart.items[0]?.prices.currency_minor_unit ?? 2;
  const selectedShippingRate =
    cart.shipping_rates
      ?.flatMap((rateGroup) => rateGroup.shipping_rates ?? [])
      .find((rate) => rate.selected)?.name ?? "";

  return {
    items: cart.items.map((item) => ({
      id: item.id,
      key: item.key,
      name: item.name,
      path: buildStoreProductPath({
        fallbackId: item.id,
        locale,
        permalink: item.permalink,
        slug: item.slug,
      }),
      price: normalizeMoney(
        item.prices.price,
        item.prices.currency_code,
        item.prices.currency_minor_unit,
        locale,
      ),
      quantity: item.quantity,
      total: normalizeMoney(
        item.totals.line_total,
        item.prices.currency_code,
        item.prices.currency_minor_unit,
        locale,
      ),
    })),
    shippingCalculated:
      cart.totals.total_shipping !== null &&
      cart.totals.total_shipping !== undefined,
    shipping: normalizeMoney(
      cart.totals.total_shipping ?? "0",
      totalCurrencyCode,
      totalMinorUnit,
      locale,
    ),
    shippingMethod: selectedShippingRate,
    subtotal: normalizeMoney(
      cart.totals.total_items,
      totalCurrencyCode,
      totalMinorUnit,
      locale,
    ),
    total: normalizeMoney(
      cart.totals.total_price,
      totalCurrencyCode,
      totalMinorUnit,
      locale,
    ),
    totalItems:
      cart.items_count ??
      cart.items.reduce((sum, item) => sum + item.quantity, 0),
    vat: normalizeMoney(
      cart.totals.total_tax,
      totalCurrencyCode,
      totalMinorUnit,
      locale,
    ),
  };
}

function stripHtml(value: string | undefined) {
  return (value ?? "").replace(/<[^>]*>/g, "").trim();
}

function mapStoreProductReview(
  review: StoreApiProductReview,
): StoreProductReview {
  return {
    author: review.reviewer ?? "Customer",
    avatarSrc:
      review.reviewer_avatar_urls?.["96"] ??
      review.reviewer_avatar_urls?.["48"] ??
      null,
    body: stripHtml(review.review),
    createdAt: review.date_created ?? "",
    id: review.id,
    rating: review.rating ?? 0,
    verified: Boolean(review.verified),
  };
}

function emitStoreCartUpdated(
  cart: StoreCart,
  options?: {
    openDrawer?: boolean;
  },
) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<StoreCartUpdatedDetail>(STORE_CART_UPDATED_EVENT, {
      detail: {
        cart,
        openDrawer: options?.openDrawer,
      },
    }),
  );
}

export async function fetchStoreCategories(locale: Locale) {
  const payload = await storeApiRequest<StoreApiCategory[]>("/products/categories", {
    locale,
    searchParams: { per_page: 100 },
  });

  return payload.map((category) => mapStoreCategory(category, locale));
}

export async function fetchStoreCategoryBySlug({
  locale,
  slug,
}: {
  locale: Locale;
  slug: string;
}) {
  const payload = await storeApiRequest<StoreApiCategory[]>("/products/categories", {
    locale,
    searchParams: { slug },
  });
  const category = payload[0];
  return category ? mapStoreCategory(category, locale) : null;
}

export async function fetchStoreProducts({
  categoryId,
  locale,
  page = 1,
  perPage = 24,
}: {
  categoryId?: number;
  locale: Locale;
  page?: number;
  perPage?: number;
}) {
  const payload = await storeApiRequest<StoreApiProduct[]>("/products", {
    locale,
    searchParams: {
      category: categoryId,
      page,
      per_page: perPage,
    },
  });

  return payload.map((product) => mapStoreProduct(product, locale));
}

export async function fetchStoreProductBySlug({
  locale,
  slug,
}: {
  locale: Locale;
  slug: string;
}) {
  const payload = await storeApiRequest<StoreApiProduct[]>("/products", {
    locale,
    searchParams: { slug },
  });
  const product = payload[0];

  return product ? mapStoreProduct(product, locale) : null;
}

export async function fetchStoreProductReviews({
  locale,
  productId,
}: {
  locale: Locale;
  productId: number;
}) {
  const payload = await storeApiRequest<StoreApiProductReview[]>(
    "/products/reviews",
    {
      locale,
      searchParams: {
        per_page: 50,
        product_id: productId,
      },
    },
  );

  return payload.map((review) => mapStoreProductReview(review));
}

export async function fetchStoreCart(locale: Locale) {
  const payload = await storeApiRequest<StoreApiCart>("/cart", { locale });
  const cart = mapStoreCart(payload, locale);
  emitStoreCartUpdated(cart);
  return cart;
}

async function ensureCart(locale: Locale) {
  const cartToken = getStoredCartToken();
  const nonce = getStoredStoreNonce();

  if (cartToken && nonce) {
    return;
  }

  await fetchStoreCart(locale);
}

export async function addStoreCartItem({
  id,
  locale,
  quantity = 1,
  openDrawerOnSuccess = false,
}: {
  id: number;
  locale: Locale;
  openDrawerOnSuccess?: boolean;
  quantity?: number;
}) {
  await ensureCart(locale);
  const body = JSON.stringify({ id, quantity });
  const payload = await storeApiRequest<StoreApiCart>("/cart/add-item", {
    body,
    locale,
    method: "POST",
  });
  const cart = mapStoreCart(payload, locale);
  emitStoreCartUpdated(cart, { openDrawer: openDrawerOnSuccess });
  return cart;
}

export async function updateStoreCartItem({
  key,
  locale,
  quantity,
}: {
  key: string;
  locale: Locale;
  quantity: number;
}) {
  const body = JSON.stringify({ key, quantity });
  const payload = await storeApiRequest<StoreApiCart>("/cart/update-item", {
    body,
    locale,
    method: "POST",
  });
  const cart = mapStoreCart(payload, locale);
  emitStoreCartUpdated(cart);
  return cart;
}

export async function removeStoreCartItem({
  key,
  locale,
}: {
  key: string;
  locale: Locale;
}) {
  const body = JSON.stringify({ key });
  const payload = await storeApiRequest<StoreApiCart>("/cart/remove-item", {
    body,
    locale,
    method: "POST",
  });
  const cart = mapStoreCart(payload, locale);
  emitStoreCartUpdated(cart);
  return cart;
}

export async function submitStoreCheckout({
  locale,
  payload,
}: {
  locale: Locale;
  payload: CheckoutPayload;
}) {
  await ensureCart(locale);
  return storeApiRequest<{ order_id?: number; payment_result?: { redirect_url?: string } }>(
    "/checkout",
    {
      body: JSON.stringify(payload),
      locale,
      method: "POST",
    },
  );
}

export function getLocaleFromRequestPathname(pathname: string) {
  return getLocaleFromPath(pathname);
}
