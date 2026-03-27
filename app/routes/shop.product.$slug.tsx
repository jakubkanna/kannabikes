import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";

import { Button } from "~/components/button";
import { CustomerSignInForm } from "~/components/customer-sign-in-form";
import { SelectField, TextareaField } from "~/components/form-field";
import { ProductHydrateFallback } from "~/components/hydrate-fallbacks";
import { ImageGallery } from "~/components/image-gallery";
import { LocalizedLink } from "~/components/localized-link";
import type { Route } from "./+types/shop.product.$slug";
import { useLocale, useMessages } from "~/components/locale-provider";
import { PageContainer, PageShell } from "~/components/page-container";
import { SectionPill } from "~/components/section-pill";
import {
  buildLocalizedMeta,
  getIntlLocale,
  getLocaleFromPath,
  getMessages,
} from "~/lib/i18n";
import {
  addStoreCartItem,
  fetchStoreProductBySlug,
  fetchStoreProductReviews,
  type StoreProductReview,
} from "~/lib/store-api";
import {
  createCustomerReview,
  fetchCustomerReviews,
  fetchCustomerSession,
  type ReviewableProduct,
  type CustomerSession,
} from "~/lib/customer-account";
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
    description: loaderData?.product?.name ?? messages.meta.shop.description,
    locale,
    pathname: location.pathname,
    title: formatPageTitle(
      loaderData?.product?.name ?? messages.meta.shop.title,
    ),
  });
}

export function HydrateFallback() {
  return <ProductHydrateFallback />;
}

export default function ShopProductPage({ loaderData }: Route.ComponentProps) {
  const locale = useLocale();
  const location = useLocation();
  const messages = useMessages();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addToCartError, setAddToCartError] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [reviews, setReviews] = useState<StoreProductReview[]>([]);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [customerSession, setCustomerSession] =
    useState<CustomerSession | null>(null);
  const [customerSessionLoading, setCustomerSessionLoading] = useState(true);
  const [reviewableProducts, setReviewableProducts] = useState<
    ReviewableProduct[]
  >([]);
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewBody, setReviewBody] = useState("");
  const [reviewSubmitStatus, setReviewSubmitStatus] = useState<string | null>(
    null,
  );
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >(() => getInitialOptionSelection(loaderData?.product ?? null));

  if (!loaderData) {
    return (
      <PageShell>
        <PageContainer>
          <div className="max-w-4xl">
            <SectionPill>{messages.commerce.shopPill}</SectionPill>
            <p className="mt-6 text-sm text-gray-600">
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
            <p className="mt-6 text-sm text-gray-600">
              {messages.commerce.noProducts}
            </p>
          </div>
        </PageContainer>
      </PageShell>
    );
  }

  const product = loaderData.product;
  const reviewRedirectPath = `${location.pathname}${location.search}#reviews`;

  useEffect(() => {
    setSelectedOptions(getInitialOptionSelection(product));
  }, [product]);

  useEffect(() => {
    let cancelled = false;

    setReviewsLoading(true);
    setReviewsError(null);

    void fetchStoreProductReviews({
      locale,
      productId: product.id,
    })
      .then((nextReviews) => {
        if (cancelled) {
          return;
        }

        setReviews(nextReviews);
        setReviewsLoading(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setReviews([]);
        setReviewsError(messages.commerce.reviewsLoadError);
        setReviewsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [locale, messages.commerce.reviewsLoadError, product.id]);

  useEffect(() => {
    let cancelled = false;

    setCustomerSessionLoading(true);
    setReviewableProducts([]);

    void fetchCustomerSession(locale)
      .then(async (session) => {
        if (cancelled) {
          return;
        }

        setCustomerSession(session);

        if (!session.authenticated) {
          setCustomerSessionLoading(false);
          return;
        }

        try {
          const nextReviewData = await fetchCustomerReviews(locale);

          if (cancelled) {
            return;
          }

          setReviewableProducts(nextReviewData.reviewableProducts);
        } catch {
          if (cancelled) {
            return;
          }

          setReviewableProducts([]);
        } finally {
          if (!cancelled) {
            setCustomerSessionLoading(false);
          }
        }
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setCustomerSession(null);
        setCustomerSessionLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  const canReviewProduct = useMemo(
    () =>
      reviewableProducts.some(
        (reviewableProduct) => reviewableProduct.id === product.id,
      ),
    [product.id, reviewableProducts],
  );

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

  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
      : 0;
  const visibleStarCount = Math.round(averageRating);

  return (
    <PageShell>
      <PageContainer>
        <nav
          aria-label="Breadcrumb"
          className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-black/45"
        >
          <LocalizedLink to="/shop" className="transition hover:opacity-80">
            <SectionPill>{messages.commerce.shopPill}</SectionPill>
          </LocalizedLink>
          <span aria-hidden="true">/</span>
          <span className="text-[var(--kanna-ink)]">{product.name}</span>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            {product.images.length > 0 ? (
              <ImageGallery
                images={product.images}
                variant="product"
                className="mt-0"
              />
            ) : null}
          </div>

          <div>
            <h1 className="page-heading text-[2.35rem] leading-[0.88] text-[var(--kanna-ink)] md:text-[3.8rem]">
              {product.name}
            </h1>
            {reviewCount > 0 ? (
              <div className="mt-4 flex flex-wrap items-center gap-3 text-[var(--kanna-ink)]">
                <div
                  aria-label={`${averageRating.toFixed(1)} out of 5 stars`}
                  className="flex items-center gap-1 text-sm"
                >
                  {Array.from({ length: 5 }, (_, index) => {
                    const isFilled = index < visibleStarCount;

                    return (
                      <span
                        key={index}
                        className={
                          isFilled ? "text-[var(--kanna-ink)]" : "text-black/20"
                        }
                      >
                        ★
                      </span>
                    );
                  })}
                </div>
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-black/60">
                  {averageRating.toFixed(1)} · {reviewCount}
                </p>
              </div>
            ) : null}
            <p className="mt-4 text-lg font-semibold text-[var(--kanna-ink)]">
              {product.price || product.regularPrice}
            </p>

            {product.shortDescriptionHtml ? (
              <div
                className="mt-6 blog-content text-base"
                dangerouslySetInnerHTML={{
                  __html: product.shortDescriptionHtml,
                }}
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
              <Button onClick={handleAddToCart} disabled={isAddingToCart}>
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

            {reviewsLoading || reviewsError || reviews.length > 0 ? (
              <section
                id="reviews"
                className="mt-12 border-t border-black/15 pt-10"
              >
                <SectionPill>{messages.commerce.reviews}</SectionPill>
                <div className="mt-6 border border-black/90 bg-white p-6">
                  {customerSessionLoading ? (
                    <p className="text-sm text-black/70">
                      {messages.commerce.reviewsLoading}
                    </p>
                  ) : customerSession?.authenticated &&
                    customerSession.csrfToken &&
                    canReviewProduct ? (
                    <form
                      className="space-y-4"
                      onSubmit={async (event) => {
                        event.preventDefault();
                        setReviewSubmitting(true);
                        setReviewSubmitStatus(null);

                        try {
                          await createCustomerReview({
                            csrfToken: customerSession.csrfToken,
                            locale,
                            payload: {
                              productId: product.id,
                              rating: Number(reviewRating),
                              review: reviewBody,
                            },
                          });

                          setReviewBody("");
                          setReviewRating("5");
                          setReviewSubmitStatus(messages.account.reviewSaved);
                          const nextReviews = await fetchStoreProductReviews({
                            locale,
                            productId: product.id,
                          });
                          setReviews(nextReviews);
                        } catch (error) {
                          setReviewSubmitStatus(
                            error instanceof Error
                              ? error.message
                              : messages.account.saveError,
                          );
                        } finally {
                          setReviewSubmitting(false);
                        }
                      }}
                    >
                      <h2 className="text-xl font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                        {messages.commerce.leaveReview}
                      </h2>
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                          {messages.account.ratingLabel}
                        </span>
                        <SelectField
                          value={reviewRating}
                          onChange={(event) =>
                            setReviewRating(event.currentTarget.value)
                          }
                        >
                          {[5, 4, 3, 2, 1].map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </SelectField>
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                          {messages.account.reviewBodyLabel}
                        </span>
                        <TextareaField
                          rows={5}
                          value={reviewBody}
                          onChange={(event) =>
                            setReviewBody(event.currentTarget.value)
                          }
                        />
                      </label>
                      <Button type="submit" disabled={reviewSubmitting}>
                        {messages.account.reviewPublish}
                      </Button>
                      {reviewSubmitStatus ? (
                        <p className="text-sm text-gray-600">
                          {reviewSubmitStatus}
                        </p>
                      ) : null}
                    </form>
                  ) : customerSession?.authenticated ? (
                    <>
                      <h2 className="text-xl font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                        {messages.commerce.leaveReview}
                      </h2>
                      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-black/75">
                        {messages.commerce.reviewsPurchaseRequired}
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                        {messages.commerce.leaveReview}
                      </h2>
                      <CustomerSignInForm
                        description={messages.commerce.reviewsSignInCta}
                        locale={locale}
                        redirectTo={reviewRedirectPath}
                        secondaryDescription={
                          messages.commerce.reviewsSignUpCta
                        }
                        onSuccess={async (session) => {
                          setReviewSubmitStatus(null);
                          setCustomerSession(session);

                          try {
                            const nextReviewData =
                              await fetchCustomerReviews(locale);
                            setReviewableProducts(
                              nextReviewData.reviewableProducts,
                            );
                          } catch {
                            setReviewableProducts([]);
                          }
                        }}
                      />
                    </>
                  )}
                </div>

                <div className="mt-6 space-y-4">
                  {reviewsLoading ? (
                    <p className="text-sm text-black/70">
                      {messages.commerce.reviewsLoading}
                    </p>
                  ) : null}
                  {!reviewsLoading && reviewsError ? (
                    <p className="text-sm text-red-700">{reviewsError}</p>
                  ) : null}
                  {!reviewsLoading && !reviewsError
                    ? reviews.map((review) => (
                        <article
                          key={review.id}
                          className="border border-black/15 bg-white p-5"
                        >
                          <div className="flex flex-wrap items-center gap-3">
                            {review.avatarSrc ? (
                              <img
                                src={review.avatarSrc}
                                alt={review.author}
                                className="h-9 w-9 border border-black/15 object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center border border-black/15 bg-stone-100 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                                {review.author.slice(0, 1)}
                              </div>
                            )}
                            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                              {review.author}
                            </p>
                            <p className="text-xs uppercase tracking-[0.08em] text-black/45">
                              {"★".repeat(
                                Math.max(0, Math.min(review.rating, 5)),
                              )}
                            </p>
                            {review.verified ? (
                              <p className="text-xs uppercase tracking-[0.08em] text-black/55">
                                {messages.commerce.verifiedReview}
                              </p>
                            ) : null}
                            {review.createdAt ? (
                              <p className="ml-auto text-xs uppercase tracking-[0.08em] text-black/45">
                                {new Intl.DateTimeFormat(
                                  getIntlLocale(locale),
                                  {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  },
                                ).format(new Date(review.createdAt))}
                              </p>
                            ) : null}
                          </div>
                          <p className="mt-3 text-sm leading-relaxed text-[var(--kanna-ink)]">
                            {review.body}
                          </p>
                        </article>
                      ))
                    : null}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </PageContainer>
    </PageShell>
  );
}
