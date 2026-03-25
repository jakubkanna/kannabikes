import type { Route } from "./+types/shop.category.$slug";
import { LocalizedLink } from "~/components/localized-link";
import { useMessages } from "~/components/locale-provider";
import { PageContainer, PageShell } from "~/components/page-container";
import { SectionPill } from "~/components/section-pill";
import {
  buildLocalizedMeta,
  getLocaleFromPath,
  getMessages,
} from "~/lib/i18n";
import {
  fetchStoreCategories,
  fetchStoreCategoryBySlug,
  fetchStoreProducts,
} from "~/lib/store-api";
import { formatPageTitle } from "~/root";

export async function clientLoader({
  params,
  request,
}: Route.ClientLoaderArgs) {
  const locale = getLocaleFromPath(new URL(request.url).pathname);
  const category = await fetchStoreCategoryBySlug({
    locale,
    slug: params.slug ?? "",
  }).catch(() => null);
  const [categories, products] = await Promise.all([
    fetchStoreCategories(locale).catch(() => []),
    category
      ? fetchStoreProducts({ categoryId: category.id, locale, perPage: 24 }).catch(
          () => [],
        )
      : Promise.resolve([]),
  ]);

  return {
    alternatePaths: {
      en: "/shop",
      pl: "/pl/shop",
    },
    categories,
    category,
    locale,
    products,
  };
}

export function meta({ loaderData, location }: Route.MetaArgs) {
  const locale = getLocaleFromPath(location.pathname);
  const messages = getMessages(locale);
  return buildLocalizedMeta({
    alternates: loaderData?.alternatePaths,
    description:
      loaderData?.category?.name ?? messages.meta.shop.description,
    locale,
    pathname: location.pathname,
    title: formatPageTitle(
      loaderData?.category?.name ?? messages.meta.shop.title,
    ),
  });
}

export default function ShopCategoryPage({ loaderData }: Route.ComponentProps) {
  const messages = useMessages();
  const categories = loaderData?.categories ?? [];
  const category = loaderData?.category ?? null;
  const products = loaderData?.products ?? [];

  if (!loaderData) {
    return (
      <PageShell>
        <PageContainer>
          <SectionPill>{messages.commerce.shopPill}</SectionPill>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-[var(--kanna-ink)]">
            {messages.commerce.categories}
          </h1>
          <p className="mt-8 text-sm text-slate-600">
            {messages.commerce.noProducts}
          </p>
        </PageContainer>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageContainer>
        <SectionPill>{messages.commerce.shopPill}</SectionPill>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-[var(--kanna-ink)]">
          {category?.name ?? messages.commerce.categories}
        </h1>

        <div className="mt-8 flex flex-wrap gap-3">
          {categories.map((categoryItem) => (
            <LocalizedLink
              key={categoryItem.id}
              to={categoryItem.path}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                category?.id === categoryItem.id
                  ? "border-[var(--kanna-ink)] bg-[var(--kanna-ink)] text-white"
                  : "border-stone-300 text-[var(--kanna-ink)]"
              }`}
            >
              {categoryItem.name}
            </LocalizedLink>
          ))}
        </div>

        {products.length > 0 ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
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
          <p className="mt-8 text-sm text-slate-600">
            {messages.commerce.noProducts}
          </p>
        )}
      </PageContainer>
    </PageShell>
  );
}
