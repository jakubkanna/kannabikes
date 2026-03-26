import { useEffect, useState } from "react";

import { Button } from "~/components/button";
import type { Route } from "./+types/cart";
import { LocalizedLink } from "~/components/localized-link";
import { useLocale, useMessages } from "~/components/locale-provider";
import { PageShell } from "~/components/page-container";
import { AnimatedOrderSection } from "~/components/order-page/order-motion";
import { SectionStack } from "~/components/order-page/section-stack";
import { SectionPill } from "~/components/section-pill";
import { buildLocalizedMeta, getLocaleFromPath, getMessages } from "~/lib/i18n";
import {
  fetchStoreCart,
  removeStoreCartItem,
  type StoreCart,
  updateStoreCartItem,
} from "~/lib/store-api";
import { formatPageTitle } from "~/root";

export function meta({ location }: Route.MetaArgs) {
  const locale = getLocaleFromPath(location.pathname);
  const messages = getMessages(locale);
  return buildLocalizedMeta({
    description: messages.meta.cart.description,
    locale,
    pathname: location.pathname,
    title: formatPageTitle(messages.meta.cart.title),
  });
}

export default function CartPage() {
  const locale = useLocale();
  const messages = useMessages();
  const [cart, setCart] = useState<StoreCart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadCart = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const nextCart = await fetchStoreCart(locale);
        if (!cancelled) {
          setCart(nextCart);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : messages.cart.loading,
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadCart();

    return () => {
      cancelled = true;
    };
  }, [locale, messages.cart.loading]);

  const handleQuantityChange = async (key: string, quantity: number) => {
    try {
      const nextCart = await updateStoreCartItem({ key, locale, quantity });
      setCart(nextCart);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : null);
    }
  };

  const handleRemove = async (key: string) => {
    try {
      const nextCart = await removeStoreCartItem({ key, locale });
      setCart(nextCart);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : null);
    }
  };

  return (
    <PageShell>
      <SectionStack>
        <AnimatedOrderSection className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <SectionPill>{messages.commerce.shopPill}</SectionPill>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-[var(--kanna-ink)]">
            {messages.cart.title}
          </h1>
        </AnimatedOrderSection>

        {isLoading ? (
          <AnimatedOrderSection className="rounded-xl border border-dashed border-stone-300 bg-stone-100/80 p-6 shadow-sm">
            <p className="text-sm text-gray-600">{messages.cart.loading}</p>
          </AnimatedOrderSection>
        ) : error ? (
          <AnimatedOrderSection className="rounded-xl border border-red-200 bg-red-50/80 p-6 shadow-sm">
            <p className="text-sm text-red-700">{error}</p>
          </AnimatedOrderSection>
        ) : !cart || cart.items.length === 0 ? (
          <AnimatedOrderSection className="rounded-xl border border-dashed border-stone-300 bg-stone-100/80 p-6 shadow-sm">
            <p className="text-sm text-gray-600">{messages.cart.empty}</p>
            <LocalizedLink
              to="/shop"
              className="mt-6 inline-flex rounded-full bg-[var(--kanna-ink)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-black"
            >
              {messages.cart.emptyCta}
            </LocalizedLink>
          </AnimatedOrderSection>
        ) : (
          <AnimatedOrderSection className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-stone-200 bg-stone-50/50 p-5"
                  >
                    <div className="min-w-0 flex-1">
                      <LocalizedLink
                        to={item.path}
                        className="text-lg font-semibold text-[var(--kanna-ink)]"
                      >
                        {item.name}
                      </LocalizedLink>
                      <p className="mt-2 text-sm text-gray-600">{item.price}</p>
                    </div>
                    <label className="flex items-center gap-3 text-sm text-gray-700">
                      <span>{messages.cart.quantity}</span>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(event) =>
                          void handleQuantityChange(
                            item.key,
                            Number.parseInt(event.target.value, 10) || 1,
                          )
                        }
                        className="w-20 rounded-md border border-black/90 bg-white px-3 py-2 text-[var(--kanna-ink)] outline-none transition focus:border-[var(--kanna-color)] focus:ring-[3px] focus:ring-[color:color-mix(in_srgb,var(--kanna-color)_35%,transparent)]"
                      />
                    </label>
                    <p className="text-sm font-semibold text-[var(--kanna-ink)]">
                      {item.total}
                    </p>
                    <Button
                      onClick={() => void handleRemove(item.key)}
                      size="sm"
                      variant="secondary"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      {messages.cart.remove}
                    </Button>
                  </div>
                ))}
              </div>

              <aside className="h-fit rounded-xl border border-stone-200 bg-stone-50/50 p-5 lg:sticky lg:top-[calc(var(--site-header-height)+2rem)]">
                <SectionPill>{messages.cart.title}</SectionPill>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-500">
                  {messages.cart.subtotal}
                </p>
                <p className="mt-3 text-2xl font-semibold text-[var(--kanna-ink)]">
                  {cart.total}
                </p>
                <LocalizedLink
                  to="/checkout"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[var(--kanna-ink)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-black"
                >
                  {messages.cart.checkout}
                </LocalizedLink>
              </aside>
            </div>
          </AnimatedOrderSection>
        )}
      </SectionStack>
    </PageShell>
  );
}
