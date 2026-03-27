export type LocalizedRouteDefinition =
  | {
      file: string;
      id: string;
      index: true;
      staticSitemap?: {
        priority?: string;
      };
    }
  | {
      file: string;
      id: string;
      path: string;
      staticSitemap?: {
        priority?: string;
      };
    };

export type StaticSitemapEntry = {
  path: string;
  priority?: string;
};

const SUPPORTED_ROUTE_LOCALES = ["en", "pl"] as const;

export const LOCALIZED_ROUTE_DEFINITIONS = [
  {
    file: "routes/_index.tsx",
    id: "home",
    index: true,
    staticSitemap: { priority: "1.0" },
  },
  {
    file: "routes/about.tsx",
    id: "about",
    path: "about",
    staticSitemap: {},
  },
  { file: "routes/account.tsx", id: "account", path: "account" },
  { file: "routes/account.orders.tsx", id: "account-orders", path: "account/orders" },
  { file: "routes/account.profile.tsx", id: "account-profile", path: "account/profile" },
  {
    file: "routes/account.addresses.tsx",
    id: "account-addresses",
    path: "account/addresses",
  },
  {
    file: "routes/account.comments.tsx",
    id: "account-comments",
    path: "account/comments",
  },
  {
    file: "routes/account.reviews.tsx",
    id: "account-reviews",
    path: "account/reviews",
  },
  {
    file: "routes/blog._index.tsx",
    id: "blog",
    path: "blog",
    staticSitemap: {},
  },
  { file: "routes/blog.$slug.tsx", id: "blog-post", path: "blog/:slug" },
  { file: "routes/cart.tsx", id: "cart", path: "cart" },
  { file: "routes/checkout.tsx", id: "checkout", path: "checkout" },
  {
    file: "routes/contact.tsx",
    id: "contact",
    path: "contact",
    staticSitemap: {},
  },
  {
    file: "routes/delivery.tsx",
    id: "delivery",
    path: "delivery",
    staticSitemap: {},
  },
  {
    file: "routes/forgot-password.tsx",
    id: "forgot-password",
    path: "forgot-password",
  },
  { file: "routes/order.$orderNumber.tsx", id: "order", path: "order/:orderNumber" },
  {
    file: "routes/pre-order.tsx",
    id: "pre-order",
    path: "pre-order",
    staticSitemap: {},
  },
  {
    file: "routes/privacy-terms.tsx",
    id: "privacy-terms",
    path: "privacy-terms",
    staticSitemap: {},
  },
  { file: "routes/shop.tsx", id: "shop", path: "shop", staticSitemap: {} },
  {
    file: "routes/shop.category.$slug.tsx",
    id: "shop-category",
    path: "shop/categories/:slug",
  },
  {
    file: "routes/shop.product.$slug.tsx",
    id: "shop-product",
    path: "shop/products/:slug",
  },
  { file: "routes/sign-in.tsx", id: "sign-in", path: "sign-in" },
  { file: "routes/sign-up.tsx", id: "sign-up", path: "sign-up" },
  {
    file: "routes/warranty.tsx",
    id: "warranty",
    path: "warranty",
    staticSitemap: {},
  },
] satisfies LocalizedRouteDefinition[];

function localizeRoutePath(
  pathname: string,
  locale: (typeof SUPPORTED_ROUTE_LOCALES)[number],
) {
  if (locale === "en") {
    return pathname;
  }

  return pathname === "/" ? "/pl" : `/pl${pathname}`;
}

function getRoutePath(route: LocalizedRouteDefinition) {
  if ("index" in route && route.index) {
    return "/";
  }

  if ("path" in route) {
    return `/${route.path}`;
  }

  return "/";
}

export function getStaticPublicSitemapEntries(): StaticSitemapEntry[] {
  return SUPPORTED_ROUTE_LOCALES.flatMap((locale) =>
    LOCALIZED_ROUTE_DEFINITIONS.flatMap((route) => {
      if (!route.staticSitemap) {
        return [];
      }

      return [
        {
          path: localizeRoutePath(getRoutePath(route), locale),
          priority: route.staticSitemap.priority,
        },
      ];
    }),
  );
}
