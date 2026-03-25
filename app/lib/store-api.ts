import { getLocaleFromPath, localizePath, type Locale } from "./i18n";

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

type StoreApiProduct = {
  categories?: StoreApiCategory[];
  description?: string;
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
  translations?: Record<string, { permalink?: string; slug?: string } | string>;
};

type StoreApiCartItem = {
  id: string;
  key: string;
  name: string;
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
  totals: {
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
  currencyCode: string;
  currencyMinorUnit: number;
  descriptionHtml: string;
  id: number;
  imageAlt: string;
  imageSrc: string | null;
  locale: Locale;
  name: string;
  path: string;
  price: string;
  regularPrice: string;
  salePrice: string;
  shortDescriptionHtml: string;
  slug: string;
  stockStatus: string;
  translationPaths: Partial<Record<Locale, string>>;
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
  total: string;
  totalItems: string;
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

const STORE_API_BASE = `${WORDPRESS_BASE_URL}/wp-json/wc/store/v1`;
const CART_TOKEN_STORAGE_KEY = "kanna-store-cart-token";

function normalizeMoney(
  rawValue: string | undefined,
  currencyCode: string,
  minorUnit: number,
) {
  const parsedValue = Number.parseInt(rawValue ?? "0", 10);

  if (!Number.isFinite(parsedValue)) {
    return "";
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode || "EUR",
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

async function storeApiRequest<T>(
  path: string,
  options?: {
    body?: BodyInit | null;
    locale?: Locale;
    method?: "GET" | "POST";
    searchParams?: Record<string, string | number | undefined>;
  },
) {
  const endpoint = new URL(`${STORE_API_BASE}${path}`);
  const locale = options?.locale;

  if (locale) {
    endpoint.searchParams.set("lang", locale);
  }

  for (const [key, value] of Object.entries(options?.searchParams ?? {})) {
    if (value === undefined || value === "") continue;
    endpoint.searchParams.set(key, String(value));
  }

  const cartToken = getStoredCartToken();
  const response = await fetch(endpoint.toString(), {
    method: options?.method ?? "GET",
    headers: cartToken ? { "Cart-Token": cartToken } : undefined,
    body: options?.body ?? null,
  });
  const nextCartToken = response.headers.get("Cart-Token");

  if (nextCartToken) {
    setStoredCartToken(nextCartToken);
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

function mapStoreProduct(product: StoreApiProduct, locale: Locale): StoreProduct {
  const prices = product.prices ?? {};
  const currencyCode = prices.currency_code ?? "EUR";
  const currencyMinorUnit = prices.currency_minor_unit ?? 2;
  const path = localizePath(`/shop/products/${product.slug ?? product.id}`, locale);

  return {
    currencyCode,
    currencyMinorUnit,
    descriptionHtml: product.description ?? "",
    id: product.id,
    imageAlt: product.images?.[0]?.alt ?? product.images?.[0]?.name ?? product.name ?? "",
    imageSrc:
      product.images?.[0]?.src ??
      product.images?.[0]?.thumbnail ??
      null,
    locale,
    name: product.name ?? `Product ${product.id}`,
    path,
    price: normalizeMoney(prices.price, currencyCode, currencyMinorUnit),
    regularPrice: normalizeMoney(
      prices.regular_price,
      currencyCode,
      currencyMinorUnit,
    ),
    salePrice: normalizeMoney(prices.sale_price, currencyCode, currencyMinorUnit),
    shortDescriptionHtml:
      product.short_description ?? product.summary ?? product.description ?? "",
    slug: product.slug ?? String(product.id),
    stockStatus: product.stock_status ?? "",
    translationPaths: mapTranslationPaths(product.translations, path),
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

  return {
    items: cart.items.map((item) => ({
      id: item.id,
      key: item.key,
      name: item.name,
      path: localizePath(`/shop/products/${item.slug}`, locale),
      price: normalizeMoney(
        item.prices.price,
        item.prices.currency_code,
        item.prices.currency_minor_unit,
      ),
      quantity: item.quantity,
      total: normalizeMoney(
        item.totals.line_total,
        item.prices.currency_code,
        item.prices.currency_minor_unit,
      ),
    })),
    total: normalizeMoney(
      cart.totals.total_price,
      totalCurrencyCode,
      totalMinorUnit,
    ),
    totalItems: cart.totals.total_items,
  };
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

export async function fetchStoreCart(locale: Locale) {
  const payload = await storeApiRequest<StoreApiCart>("/cart", { locale });
  return mapStoreCart(payload, locale);
}

async function ensureCart(locale: Locale) {
  const cartToken = getStoredCartToken();
  if (cartToken) {
    return;
  }

  await fetchStoreCart(locale);
}

export async function addStoreCartItem({
  id,
  locale,
  quantity = 1,
}: {
  id: number;
  locale: Locale;
  quantity?: number;
}) {
  await ensureCart(locale);
  const body = JSON.stringify({ id, quantity });
  const payload = await storeApiRequest<StoreApiCart>("/cart/add-item", {
    body,
    locale,
    method: "POST",
  });
  return mapStoreCart(payload, locale);
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
  return mapStoreCart(payload, locale);
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
  return mapStoreCart(payload, locale);
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
