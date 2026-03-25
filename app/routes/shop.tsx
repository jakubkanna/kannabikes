import { useState } from "react";

import { ArchivoInkBleed } from "~/components/archivo-ink-bleed";
import { InputField, SelectField } from "~/components/form-field";
import { LocalizedLink } from "~/components/localized-link";
import { useMessages } from "~/components/locale-provider";
import { PageContainer, PageShell } from "~/components/page-container";
import { SectionPill } from "~/components/section-pill";
import { formatPageTitle } from "~/root";
import { buildLocalizedMeta, getLocaleFromPath, getMessages } from "~/lib/i18n";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState("all");

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredProducts = loaderData.products.filter((product) => {
    const matchesSearch =
      normalizedQuery.length === 0 ||
      product.name.toLowerCase().includes(normalizedQuery);
    const matchesCategory =
      selectedCategorySlug === "all" ||
      product.categorySlugs.includes(selectedCategorySlug);

    return matchesSearch && matchesCategory;
  });

  return (
    <PageShell>
      <PageContainer>
        <SectionPill>{messages.commerce.shopPill}</SectionPill>
        <h1 className="mt-4 max-w-4xl">
          <ArchivoInkBleed
            className="block w-full"
            color="var(--kanna-ink)"
            fontSize={160}
            lines={[...messages.pages.shop.titleLines]}
          />
        </h1>

        <section className="mt-12">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_18rem]">
            <InputField
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search products"
              aria-label="Search products"
              className="bg-white"
            />
            <SelectField
              value={selectedCategorySlug}
              onChange={(event) => setSelectedCategorySlug(event.target.value)}
              aria-label={messages.commerce.categories}
              className="bg-white"
            >
              <option value="all">All categories</option>
              {loaderData.categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </SelectField>
          </div>

          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {messages.commerce.featuredProducts}
          </p>
          {filteredProducts.length > 0 ? (
            <div className="mt-4 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
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
                    <p className="mt-2 text-sm text-slate-600">
                      {product.price}
                    </p>
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
      </PageContainer>
    </PageShell>
  );
}
