import { useEffect, useMemo, useState } from "react";

import { Button } from "~/components/button";
import { SelectField } from "~/components/form-field";
import type { Route } from "./+types/shop.product.$slug";
import { useLocale, useMessages } from "~/components/locale-provider";
import { PageContainer, PageShell } from "~/components/page-container";
import { SectionPill } from "~/components/section-pill";
import {
  buildLocalizedMeta,
  getLocaleFromPath,
  getMessages,
} from "~/lib/i18n";
import { addStoreCartItem, fetchStoreProductBySlug } from "~/lib/store-api";
import { formatPageTitle } from "~/root";

function getInitialOptionSelection(
  product: NonNullable<Route.ComponentProps["loaderData"]>["product"],
) {
  if (!product) {
    return {};
  }

  return Object.fromEntries(
    product.optionAttributes.map((attribute) => [
      attribute.slug,
      attribute.terms.find((term) => term.isDefault)?.slug ?? "",
    ]),
  );
}

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
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    () => getInitialOptionSelection(loaderData?.product ?? null),
  );

  if (!loaderData) {
    return (
      <PageShell>
        <PageContainer>
          <div className="max-w-4xl">
            <SectionPill>{messages.commerce.shopPill}</SectionPill>
            <p className="mt-6 text-sm text-slate-600">
              {messages.commerce.noProducts}
            </p>
          </div>
        </PageContainer>
      </PageShell>
    );
  }

  if (!loaderData.product) {
    return (
      <PageShell>
        <PageContainer>
          <div className="max-w-4xl">
            <SectionPill>{messages.commerce.shopPill}</SectionPill>
            <p className="mt-6 text-sm text-slate-600">
              {messages.commerce.noProducts}
            </p>
          </div>
        </PageContainer>
      </PageShell>
    );
  }

  const product = loaderData.product;

  useEffect(() => {
    setSelectedOptions(getInitialOptionSelection(product));
  }, [product]);

  const matchedVariationId = useMemo(() => {
    if (!product.hasOptions) {
      return product.id;
    }

    const hasAllSelections = product.optionAttributes.every(
      (attribute) => selectedOptions[attribute.slug],
    );

    if (!hasAllSelections) {
      return null;
    }

    const matchedVariation = product.variations.find((variation) =>
      product.optionAttributes.every((attribute) => {
        const selectedValue = selectedOptions[attribute.slug];
        const variationValue =
          variation.attributes[attribute.slug] ??
          variation.attributes[attribute.name.trim().toLowerCase()];

        return variationValue === selectedValue;
      }),
    );

    return matchedVariation?.id ?? null;
  }, [product, selectedOptions]);

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    setAddedToCart(false);
    setAddToCartError(null);

    if (!matchedVariationId) {
      setAddToCartError(messages.commerce.optionRequired);
      setIsAddingToCart(false);
      return;
    }

    try {
      await addStoreCartItem({
        id: matchedVariationId,
        locale,
        openDrawerOnSuccess: true,
      });
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
    <PageShell>
      <PageContainer>
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
            <h1 className="page-heading text-[2.35rem] leading-[0.88] text-[var(--kanna-ink)] md:text-[3.8rem]">
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

            {product.optionAttributes.length > 0 ? (
              <div className="mt-8 space-y-4">
                {product.optionAttributes.map((attribute) => (
                  <label key={attribute.slug} className="block">
                    <span className="mb-2 block text-sm font-semibold text-[var(--kanna-ink)]">
                      {attribute.name}
                    </span>
                    <SelectField
                      value={selectedOptions[attribute.slug] ?? ""}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        setAddedToCart(false);
                        setAddToCartError(null);
                        setSelectedOptions((current) => ({
                          ...current,
                          [attribute.slug]: value,
                        }));
                      }}
                    >
                      <option value="">{messages.commerce.chooseOption}</option>
                      {attribute.terms.map((term) => (
                        <option key={term.slug} value={term.slug}>
                          {term.name}
                        </option>
                      ))}
                    </SelectField>
                  </label>
                ))}
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-4">
              <Button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
              >
                {isAddingToCart
                  ? `${messages.commerce.addToCart}...`
                  : messages.commerce.addToCart}
              </Button>
            </div>

            {addedToCart ? (
              <p className="mt-4 text-sm text-emerald-700">
                {messages.commerce.addedToCart}
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
      </PageContainer>
    </PageShell>
  );
}
