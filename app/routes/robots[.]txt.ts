import { SITE_URL } from "~/lib/i18n";
import type { Route } from "./+types/robots[.]txt";

function normalizeBaseUrl(input: string) {
  return input.endsWith("/") ? input.slice(0, -1) : input;
}

export async function loader({ request }: Route.LoaderArgs) {
  const requestUrl = new URL(request.url);
  const siteUrl = normalizeBaseUrl(
    import.meta.env.VITE_SITE_URL?.trim() || SITE_URL || requestUrl.origin,
  );

  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /cart",
    "Disallow: /checkout",
    "Disallow: /account",
    "Disallow: /sign-in",
    "Disallow: /sign-up",
    "Disallow: /forgot-password",
    "Disallow: /order/",
    "Disallow: /pl/cart",
    "Disallow: /pl/checkout",
    "Disallow: /pl/account",
    "Disallow: /pl/sign-in",
    "Disallow: /pl/sign-up",
    "Disallow: /pl/forgot-password",
    "Disallow: /pl/order/",
    `Sitemap: ${siteUrl}/sitemap.xml`,
  ].join("\n");

  return new Response(body, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
