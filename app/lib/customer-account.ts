import { getLocaleFromPath, localizePath, type Locale } from "./i18n";

export type CustomerUser = {
  avatarUrl: string;
  displayName: string;
  email: string;
  firstName: string;
  id: number;
  lastName: string;
  phone: string;
};

export type CustomerAccountPaths = {
  addresses: string;
  orders: string;
  overview: string;
  profile: string;
  reviews: string;
  sign_in: string;
  sign_up: string;
};

export type CustomerSession = {
  account_paths: CustomerAccountPaths;
  authenticated: boolean;
  csrfToken: string;
  google_connected: boolean;
  user: CustomerUser | null;
};

export type CustomerRegistrationPayload = {
  email: string;
  firstName: string;
  lastName: string;
  locale: Locale;
  password: string;
};

export type CustomerAddressFields = {
  address1: string;
  address2: string;
  city: string;
  company: string;
  country: string;
  email?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  postcode: string;
  state: string;
};

export type CustomerAddressBook = {
  billing: CustomerAddressFields;
  shipping: CustomerAddressFields;
};

export type CustomerAccount = {
  accountPaths: CustomerAccountPaths;
  addresses: CustomerAddressBook;
  googleConnected: boolean;
  user: CustomerUser;
};

export type CustomerOrderSummary = {
  currency: string;
  dateCreated: string;
  id: number;
  items: Array<{
    name: string;
    quantity: number;
  }>;
  number: string;
  status: string;
  total: string;
  viewPath: string;
};

export type CustomerReview = {
  body: string;
  createdAt: string;
  id: number;
  productId: number;
  productName: string;
  productPath: string;
  rating: number;
  status: string;
};

export type ReviewableProduct = {
  id: number;
  name: string;
  path: string;
};

export type CustomerBlogComment = {
  contentHtml: string;
  createdAt: string;
  id: number;
  status: "approved" | "pending";
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

const WORDPRESS_REQUEST_BASE = import.meta.env.DEV ? "" : WORDPRESS_BASE_URL;

function buildApiUrl(path: string) {
  const url = `${WORDPRESS_REQUEST_BASE}/wp-json/kanna-auth/v1${path}`;

  if (/^https?:\/\//i.test(url)) {
    return new URL(url);
  }

  return new URL(url, window.location.origin);
}

async function customerAccountRequest<T>(
  path: string,
  options?: {
    body?: BodyInit | null;
    csrfToken?: string;
    locale?: Locale;
    method?: "GET" | "POST" | "PUT";
  },
) {
  const endpoint = buildApiUrl(path);

  if (options?.locale) {
    endpoint.searchParams.set("locale", options.locale);
  }

  const headers = new Headers();

  if (options?.body) {
    headers.set("Content-Type", "application/json");
  }

  if (options?.csrfToken) {
    headers.set("X-Kanna-CSRF", options.csrfToken);
  }

  const response = await fetch(endpoint.toString(), {
    body: options?.body ?? null,
    credentials: "include",
    headers,
    method: options?.method ?? "GET",
  });

  const payload = (await response.json().catch(() => null)) as
    | (T & { message?: string })
    | null;

  if (!response.ok) {
    throw new Error(payload?.message ?? `Customer account request failed (${response.status})`);
  }

  return payload as T;
}

export async function fetchCustomerSession(locale: Locale) {
  return customerAccountRequest<CustomerSession>("/session", { locale });
}

export async function registerCustomerAccount(payload: CustomerRegistrationPayload) {
  return customerAccountRequest<{
    account_paths: CustomerAccountPaths;
    authenticated: boolean;
    google_connected: boolean;
    success: boolean;
    user: CustomerUser;
  }>("/register", {
    body: JSON.stringify(payload),
    locale: payload.locale,
    method: "POST",
  });
}

export async function loginCustomerSession({
  locale,
  login,
  password,
}: {
  locale: Locale;
  login: string;
  password: string;
}) {
  return customerAccountRequest<CustomerSession & { success: boolean }>("/login", {
    body: JSON.stringify({
      locale,
      login,
      password,
    }),
    locale,
    method: "POST",
  });
}

export async function fetchCustomerAccount(locale: Locale) {
  return customerAccountRequest<CustomerAccount>("/account", { locale });
}

export async function fetchCustomerOrders(locale: Locale) {
  return customerAccountRequest<{ orders: CustomerOrderSummary[] }>("/account/orders", {
    locale,
  });
}

export async function fetchCustomerAddresses(locale: Locale) {
  return customerAccountRequest<{ addresses: CustomerAddressBook }>(
    "/account/addresses",
    {
      locale,
    },
  );
}

export async function updateCustomerAddresses({
  csrfToken,
  locale,
  payload,
}: {
  csrfToken: string;
  locale: Locale;
  payload: CustomerAddressBook;
}) {
  return customerAccountRequest<{ addresses: CustomerAddressBook; success: boolean }>(
    "/account/addresses",
    {
      body: JSON.stringify(payload),
      csrfToken,
      locale,
      method: "PUT",
    },
  );
}

export async function updateCustomerProfile({
  csrfToken,
  locale,
  payload,
}: {
  csrfToken: string;
  locale: Locale;
  payload: {
    displayName: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
}) {
  return customerAccountRequest<{ success: boolean; user: CustomerUser }>(
    "/account/profile",
    {
      body: JSON.stringify(payload),
      csrfToken,
      locale,
      method: "PUT",
    },
  );
}

export async function fetchCustomerReviews(locale: Locale) {
  return customerAccountRequest<{
    reviewableProducts: ReviewableProduct[];
    reviews: CustomerReview[];
  }>("/account/reviews", {
    locale,
  });
}

export async function createCustomerReview({
  csrfToken,
  locale,
  payload,
}: {
  csrfToken: string;
  locale: Locale;
  payload: {
    productId: number;
    rating: number;
    review: string;
  };
}) {
  return customerAccountRequest<{ reviewId: number; success: boolean }>(
    "/account/reviews",
    {
      body: JSON.stringify(payload),
      csrfToken,
      locale,
      method: "POST",
    },
  );
}

export async function createCustomerBlogComment({
  csrfToken,
  locale,
  payload,
}: {
  csrfToken: string;
  locale: Locale;
  payload: {
    content: string;
    postId: number;
  };
}) {
  return customerAccountRequest<{
    comment: CustomerBlogComment;
    success: boolean;
  }>("/blog/comments", {
    body: JSON.stringify(payload),
    csrfToken,
    locale,
    method: "POST",
  });
}

export async function voteCustomerBlogComment({
  commentId,
  csrfToken,
  direction,
  locale,
}: {
  commentId: number;
  csrfToken: string;
  direction: "down" | "up";
  locale: Locale;
}) {
  return customerAccountRequest<{
    commentId: number;
    currentUserVote: -1 | 0 | 1;
    success: boolean;
    voteScore: number;
  }>("/blog/comments/vote", {
    body: JSON.stringify({
      commentId,
      direction,
    }),
    csrfToken,
    locale,
    method: "POST",
  });
}

export async function logoutCustomerSession({
  csrfToken,
  locale,
}: {
  csrfToken: string;
  locale: Locale;
}) {
  return customerAccountRequest<{ success: boolean }>("/logout", {
    csrfToken,
    locale,
    method: "POST",
  });
}

export async function requireCustomerSession({
  locale,
  pathname,
}: {
  locale: Locale;
  pathname: string;
}) {
  const session = await fetchCustomerSession(locale);

  if (session.authenticated) {
    return session;
  }

  const redirectPath = `${pathname}`;
  const signInPath = localizePath("/sign-in", locale);

  throw new Response(null, {
    headers: {
      Location: `${signInPath}?redirect=${encodeURIComponent(redirectPath)}`,
    },
    status: 302,
  });
}

export function getLocaleFromRequestPathname(pathname: string) {
  return getLocaleFromPath(pathname);
}
