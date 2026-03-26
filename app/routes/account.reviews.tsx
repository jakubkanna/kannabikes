import { useState } from "react";
import { redirect } from "react-router";
import { AccountShell } from "~/components/account-shell";
import { SelectField, TextareaField } from "~/components/form-field";
import { AccountHydrateFallback } from "~/components/hydrate-fallbacks";
import { useMessages } from "~/components/locale-provider";
import {
  createCustomerReview,
  fetchCustomerReviews,
  fetchCustomerSession,
} from "~/lib/customer-account";
import { buildLocalizedMeta, getLocaleFromPath, getMessages } from "~/lib/i18n";
import { formatPageTitle } from "~/root";
import type { Route } from "./+types/account.reviews";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const pathname = new URL(request.url).pathname;
  const locale = getLocaleFromPath(pathname);
  const session = await fetchCustomerSession(locale);

  if (!session.authenticated) {
    throw redirect(
      `${session.account_paths.sign_in}?redirect=${encodeURIComponent(pathname)}`,
    );
  }

  const reviewsPayload = await fetchCustomerReviews(locale);

  return { locale, reviewsPayload, session };
}

export function meta({ location }: Route.MetaArgs) {
  const locale = getLocaleFromPath(location.pathname);
  const messages = getMessages(locale);

  return buildLocalizedMeta({
    description: messages.account.reviewsBody,
    locale,
    pathname: location.pathname,
    title: formatPageTitle(messages.account.reviewsTitle),
  });
}

export function HydrateFallback() {
  return <AccountHydrateFallback variant="split" />;
}

export default function AccountReviewsPage({
  loaderData,
}: Route.ComponentProps) {
  const messages = useMessages();
  const [reviewableProducts, setReviewableProducts] = useState(
    loaderData.reviewsPayload.reviewableProducts,
  );
  const [reviews, setReviews] = useState(loaderData.reviewsPayload.reviews);
  const [productId, setProductId] = useState(
    loaderData.reviewsPayload.reviewableProducts[0]?.id
      ? String(loaderData.reviewsPayload.reviewableProducts[0].id)
      : "",
  );
  const [rating, setRating] = useState("5");
  const [review, setReview] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  return (
    <AccountShell
      session={loaderData.session}
      title={messages.account.reviewsTitle}
    >
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          className="space-y-4 border border-black/15 bg-white p-6"
          onSubmit={async (event) => {
            event.preventDefault();

            if (!productId) {
              return;
            }

            setIsSaving(true);
            setStatus(null);

            try {
              await createCustomerReview({
                csrfToken: loaderData.session.csrfToken,
                locale: loaderData.locale,
                payload: {
                  productId: Number(productId),
                  rating: Number(rating),
                  review,
                },
              });

              const nextPayload = await fetchCustomerReviews(loaderData.locale);
              setReviewableProducts(nextPayload.reviewableProducts);
              setReviews(nextPayload.reviews);
              setProductId(
                nextPayload.reviewableProducts[0]?.id
                  ? String(nextPayload.reviewableProducts[0].id)
                  : "",
              );
              setReview("");
              setRating("5");
              setStatus(messages.account.reviewSaved);
            } catch {
              setStatus(messages.account.saveError);
            } finally {
              setIsSaving(false);
            }
          }}
        >
          <h2 className="text-lg font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
            {messages.account.reviewableProducts}
          </h2>
          {reviewableProducts.length === 0 ? (
            <p className="text-sm text-gray-600">
              {messages.account.noReviewableProducts}
            </p>
          ) : (
            <>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                  {messages.account.selectProductLabel}
                </span>
                <SelectField
                  value={productId}
                  onChange={(event) => setProductId(event.currentTarget.value)}
                >
                  {reviewableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </SelectField>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                  {messages.account.ratingLabel}
                </span>
                <SelectField
                  value={rating}
                  onChange={(event) => setRating(event.currentTarget.value)}
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
                  rows={6}
                  value={review}
                  onChange={(event) => setReview(event.currentTarget.value)}
                />
              </label>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex min-h-12 cursor-pointer items-center justify-center border border-[var(--kanna-ink)] bg-[var(--kanna-ink)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-black disabled:opacity-60"
              >
                {messages.account.reviewPublish}
              </button>
            </>
          )}
          {status ? <p className="text-sm text-gray-600">{status}</p> : null}
        </form>

        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-600">
              {messages.account.noReviews}
            </p>
          ) : (
            reviews.map((item) => (
              <article
                key={item.id}
                className="border border-black/15 bg-white p-5"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                    {item.productName}
                  </p>
                  <p className="text-xs uppercase tracking-[0.08em] text-black/45">
                    {"★".repeat(Math.max(0, Math.min(item.rating, 5)))}
                  </p>
                  {item.status !== "approved" ? (
                    <p className="text-xs uppercase tracking-[0.08em] text-black/45">
                      {messages.account.reviewPending}
                    </p>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[var(--kanna-ink)]">
                  {item.body}
                </p>
              </article>
            ))
          )}
        </div>
      </div>
    </AccountShell>
  );
}
