import { index, prefix, route, type RouteConfig } from "@react-router/dev/routes";

const localizedRoutes = [
  index("routes/_index.tsx", { id: "home" }),
  route("about", "routes/about.tsx", { id: "about" }),
  route("blog", "routes/blog._index.tsx", { id: "blog" }),
  route("blog/:slug", "routes/blog.$slug.tsx", { id: "blog-post" }),
  route("cart", "routes/cart.tsx", { id: "cart" }),
  route("checkout", "routes/checkout.tsx", { id: "checkout" }),
  route("contact", "routes/contact.tsx", { id: "contact" }),
  route("order/:orderNumber", "routes/order.$orderNumber.tsx", { id: "order" }),
  route("pre-order", "routes/pre-order.tsx", { id: "pre-order" }),
  route("privacy-terms", "routes/privacy-terms.tsx", { id: "privacy-terms" }),
  route("shop", "routes/shop.tsx", { id: "shop" }),
  route("shop/categories/:slug", "routes/shop.category.$slug.tsx", {
    id: "shop-category",
  }),
  route("shop/products/:slug", "routes/shop.product.$slug.tsx", {
    id: "shop-product",
  }),
];

const polishRoutes = [
  index("routes/_index.tsx", { id: "pl-home" }),
  route("about", "routes/about.tsx", { id: "pl-about" }),
  route("blog", "routes/blog._index.tsx", { id: "pl-blog" }),
  route("blog/:slug", "routes/blog.$slug.tsx", { id: "pl-blog-post" }),
  route("cart", "routes/cart.tsx", { id: "pl-cart" }),
  route("checkout", "routes/checkout.tsx", { id: "pl-checkout" }),
  route("contact", "routes/contact.tsx", { id: "pl-contact" }),
  route("order/:orderNumber", "routes/order.$orderNumber.tsx", { id: "pl-order" }),
  route("pre-order", "routes/pre-order.tsx", { id: "pl-pre-order" }),
  route("privacy-terms", "routes/privacy-terms.tsx", { id: "pl-privacy-terms" }),
  route("shop", "routes/shop.tsx", { id: "pl-shop" }),
  route("shop/categories/:slug", "routes/shop.category.$slug.tsx", {
    id: "pl-shop-category",
  }),
  route("shop/products/:slug", "routes/shop.product.$slug.tsx", {
    id: "pl-shop-product",
  }),
];

export default [
  ...localizedRoutes,
  ...prefix("pl", polishRoutes),
  route("sitemap.xml", "routes/sitemap[.]xml.ts", { id: "sitemap" }),
] satisfies RouteConfig;
