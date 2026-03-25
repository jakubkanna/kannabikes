import { useEffect, useState } from "react";

import type { Route } from "./+types/cart";
import { LocalizedLink } from "~/components/localized-link";
import { useLocale, useMessages } from "~/components/locale-provider";
import { SectionPill } from "~/components/section-pill";
import {
  buildLocalizedMeta,
  getLocaleFromPath,
  getMessages,
} from "~/lib/i18n";
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
            nextError instanceof Error ? nextError.message : messages.cart.loading,
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
    <main className="min-h-screen bg-stone-100 px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-5xl">
        <SectionPill>{messages.commerce.shopPill}</SectionPill>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-[var(--kanna-ink)]">
          {messages.cart.title}
        </h1>

        {isLoading ? (
          <p className="mt-8 text-sm text-slate-600">{messages.cart.loading}</p>
        ) : error ? (
          <p className="mt-8 text-sm text-red-700">{error}</p>
        ) : !cart || cart.items.length === 0 ? (
          <div className="mt-8 space-y-4">
            <p className="text-sm text-slate-600">{messages.cart.empty}</p>
            <LocalizedLink
              to="/shop"
              className="inline-flex rounded-full bg-[var(--kanna-ink)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-black"
            >
              {messages.cart.emptyCta}
            </LocalizedLink>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item.key}
                  className="flex flex-wrap items-center justify-between gap-4 border border-stone-200 bg-white p-5 shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <LocalizedLink
                      to={item.path}
                      className="text-lg font-semibold text-[var(--kanna-ink)]"
                    >
                      {item.name}
                    </LocalizedLink>
                    <p className="mt-2 text-sm text-slate-600">{item.price}</p>
                  </div>
                  <label className="flex items-center gap-3 text-sm text-slate-700">
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
                      className="w-20 rounded-md border border-stone-300 px-3 py-2"
                    />
                  </label>
                  <p className="text-sm font-semibold text-[var(--kanna-ink)]">
                    {item.total}
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleRemove(item.key)}
                    className="text-sm font-semibold text-red-700"
                  >
                    {messages.cart.remove}
                  </button>
                </div>
              ))}
            </div>

            <aside className="h-fit border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
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
        )}
      </div>
    </main>
  );
}
