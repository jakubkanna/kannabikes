import { ArchivoInkBleed } from "~/components/archivo-ink-bleed";
import { LocalizedLink } from "~/components/localized-link";
import { useMessages } from "~/components/locale-provider";
import { SectionPill } from "~/components/section-pill";
import { formatPageTitle } from "~/root";
import {
  buildLocalizedMeta,
  getLocaleFromPath,
  getMessages,
} from "~/lib/i18n";
import type { Route } from "./+types/shop";
import { fetchStoreCategories, fetchStoreProducts } from "~/lib/store-api";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const locale = getLocaleFromPath(new URL(request.url).pathname);
  const [categories, products] = await Promise.all([
    fetchStoreCategories(locale).catch(() => []),
    fetchStoreProducts({ locale, perPage: 12 }).catch(() => []),
  ]);

  return { categories, locale, products };
}

export function meta({ location }: Route.MetaArgs) {
  const locale = getLocaleFromPath(location.pathname);
  const messages = getMessages(locale);
  return buildLocalizedMeta({
    description: messages.meta.shop.description,
    locale,
    pathname: location.pathname,
    title: formatPageTitle(messages.meta.shop.title),
  });
}

export default function ShopPage({ loaderData }: Route.ComponentProps) {
  const messages = useMessages();

  return (
    <main className="bg-stone-100 px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionPill>{messages.commerce.shopPill}</SectionPill>
        <h1 className="mt-4 max-w-4xl">
          <ArchivoInkBleed
            className="block w-full"
            color="var(--kanna-ink)"
            fontSize={160}
            lines={[...messages.pages.shop.titleLines]}
          />
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
          {messages.pages.shop.description}
        </p>

        <section className="mt-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {messages.commerce.categories}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {loaderData.categories.length > 0 ? (
              loaderData.categories.map((category) => (
                <LocalizedLink
                  key={category.id}
                  to={category.path}
                  className="rounded-full border border-stone-300 px-4 py-2 text-sm text-[var(--kanna-ink)] transition hover:border-[var(--kanna-ink)]"
                >
                  {category.name}
                </LocalizedLink>
              ))
            ) : (
              <p className="text-sm text-slate-600">
                {messages.commerce.noCategories}
              </p>
            )}
          </div>
        </section>

        <section className="mt-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {messages.commerce.featuredProducts}
          </p>
          {loaderData.products.length > 0 ? (
            <div className="mt-4 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {loaderData.products.map((product) => (
                <LocalizedLink
                  key={product.id}
                  to={product.path}
                  className="overflow-hidden border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1"
                >
                  {product.imageSrc ? (
                    <img
                      src={product.imageSrc}
                      alt={product.imageAlt}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  ) : null}
                  <div className="p-5">
                    <h2 className="text-xl font-semibold text-[var(--kanna-ink)]">
                      {product.name}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">{product.price}</p>
                  </div>
                </LocalizedLink>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">
              {messages.commerce.noProducts}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
