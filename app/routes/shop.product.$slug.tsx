import { useState } from "react";

import type { Route } from "./+types/shop.product.$slug";
import { LocalizedLink } from "~/components/localized-link";
import { useLocale, useMessages } from "~/components/locale-provider";
import { SectionPill } from "~/components/section-pill";
import {
  buildLocalizedMeta,
  getLocaleFromPath,
  getMessages,
} from "~/lib/i18n";
import { addStoreCartItem, fetchStoreProductBySlug } from "~/lib/store-api";
import { formatPageTitle } from "~/root";

export async function clientLoader({
  params,
  request,
}: Route.ClientLoaderArgs) {
  const locale = getLocaleFromPath(new URL(request.url).pathname);
  const product = await fetchStoreProductBySlug({
    locale,
    slug: params.slug ?? "",
  }).catch(() => null);

  return {
    alternatePaths: product?.translationPaths ?? {
      en: "/shop",
      pl: "/pl/shop",
    },
    locale,
    product,
  };
}

export function meta({ loaderData, location }: Route.MetaArgs) {
  const locale = getLocaleFromPath(location.pathname);
  const messages = getMessages(locale);

  return buildLocalizedMeta({
    alternates: loaderData?.alternatePaths,
    description:
      loaderData?.product?.name ?? messages.meta.shop.description,
    locale,
    pathname: location.pathname,
    title: formatPageTitle(
      loaderData?.product?.name ?? messages.meta.shop.title,
    ),
  });
}

export default function ShopProductPage({ loaderData }: Route.ComponentProps) {
  const locale = useLocale();
  const messages = useMessages();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addToCartError, setAddToCartError] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);

  if (!loaderData) {
    return (
      <main className="min-h-screen bg-stone-100 px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-4xl">
          <SectionPill>{messages.commerce.shopPill}</SectionPill>
          <p className="mt-6 text-sm text-slate-600">
            {messages.commerce.noProducts}
          </p>
        </div>
      </main>
    );
  }

  if (!loaderData.product) {
    return (
      <main className="min-h-screen bg-stone-100 px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-4xl">
          <SectionPill>{messages.commerce.shopPill}</SectionPill>
          <p className="mt-6 text-sm text-slate-600">
            {messages.commerce.noProducts}
          </p>
        </div>
      </main>
    );
  }

  const product = loaderData.product;

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    setAddedToCart(false);
    setAddToCartError(null);

    try {
      await addStoreCartItem({ id: product.id, locale });
      setAddedToCart(true);
    } catch (error) {
      setAddToCartError(
        error instanceof Error ? error.message : messages.commerce.noProducts,
      );
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionPill>{messages.commerce.shopPill}</SectionPill>
        <div className="mt-8 grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="overflow-hidden border border-stone-200 bg-white shadow-sm">
            {product.imageSrc ? (
              <img
                src={product.imageSrc}
                alt={product.imageAlt}
                className="aspect-square w-full object-cover"
              />
            ) : null}
          </div>

          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-[var(--kanna-ink)] md:text-5xl">
              {product.name}
            </h1>
            <p className="mt-4 text-lg font-semibold text-[var(--kanna-ink)]">
              {product.price || product.regularPrice}
            </p>

            {product.shortDescriptionHtml ? (
              <div
                className="mt-6 blog-content text-base"
                dangerouslySetInnerHTML={{ __html: product.shortDescriptionHtml }}
              />
            ) : null}

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="inline-flex items-center justify-center rounded-full bg-[var(--kanna-ink)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
              >
                {isAddingToCart
                  ? `${messages.commerce.addToCart}...`
                  : messages.commerce.addToCart}
              </button>
              <LocalizedLink
                to="/cart"
                className="inline-flex items-center justify-center rounded-full border border-[var(--kanna-ink)] px-6 py-3 text-sm font-semibold text-[var(--kanna-ink)] transition hover:bg-white"
              >
                {messages.commerce.viewCart}
              </LocalizedLink>
            </div>

            {addedToCart ? (
              <p className="mt-4 text-sm text-emerald-700">
                {messages.commerce.viewCart}
              </p>
            ) : null}
            {addToCartError ? (
              <p className="mt-4 text-sm text-red-700">{addToCartError}</p>
            ) : null}

            {product.descriptionHtml ? (
              <div
                className="blog-content mt-10 text-base"
                dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
              />
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
