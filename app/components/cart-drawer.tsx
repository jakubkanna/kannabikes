import { Button, getButtonClassName } from "~/components/button";
import { useEffect, useState } from "react";
import { LocalizedLink } from "~/components/localized-link";
import { useLocale, useMessages } from "~/components/locale-provider";
import {
  fetchStoreCart,
  removeStoreCartItem,
  STORE_CART_UPDATED_EVENT,
  type StoreCart,
  updateStoreCartItem,
} from "~/lib/store-api";

export function CartDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const locale = useLocale();
  const messages = useMessages();
  const [cart, setCart] = useState<StoreCart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

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
  }, [isOpen, locale, messages.cart.loading]);

  useEffect(() => {
    const handleCartUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ cart?: StoreCart }>).detail;

      if (!detail?.cart) {
        return;
      }

      setCart(detail.cart);
      setError(null);
      setIsLoading(false);
    };

    window.addEventListener(STORE_CART_UPDATED_EVENT, handleCartUpdated);

    return () => {
      window.removeEventListener(STORE_CART_UPDATED_EVENT, handleCartUpdated);
    };
  }, []);

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
    <div
      className={`fixed inset-0 z-50 transition ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        onClick={onClose}
        className={`absolute inset-0 bg-black/35 transition ${isOpen ? "opacity-100" : "opacity-0"}`}
        aria-label={messages.cart.close}
      />

      <aside
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-stone-300 bg-stone-100 shadow-[0_0_50px_rgba(0,0,0,0.14)] transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-stone-300 px-5 py-4">
          <h2 className="text-lg font-semibold text-(--kanna-ink)">
            {messages.cart.title}
          </h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="border-stone-300 px-3 py-1"
            onClick={onClose}
          >
            {messages.cart.close}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {isLoading ? (
            <p className="text-sm text-gray-600">{messages.cart.loading}</p>
          ) : error ? (
            <p className="text-sm text-red-700">{error}</p>
          ) : !cart || cart.items.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{messages.cart.empty}</p>
              <LocalizedLink
                to="/shop"
                onClick={onClose}
                className="inline-flex rounded-full bg-[var(--kanna-ink)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
              >
                {messages.cart.emptyCta}
              </LocalizedLink>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item.key}
                  className="border border-stone-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-stone-200">
                        {item.imageSrc ? (
                          <img
                            src={item.imageSrc}
                            alt={item.imageAlt}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <LocalizedLink
                          to={item.path}
                          onClick={onClose}
                          className="text-base font-semibold text-[var(--kanna-ink)]"
                        >
                          {item.name}
                        </LocalizedLink>
                        <p className="mt-1 text-sm text-gray-600">
                          {item.price}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={messages.cart.remove}
                      onClick={() => void handleRemove(item.key)}
                      className="shrink-0 cursor-pointer text-red-700 transition hover:text-red-800"
                    >
                      <img
                        src="/icons/trash-outline.svg"
                        alt=""
                        aria-hidden="true"
                        className="h-5 w-5"
                      />
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-4">
                    <label className="flex items-center gap-3 text-xs text-gray-700">
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-stone-300 px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-500">
              {messages.cart.subtotal}
            </span>
            <span className="text-lg font-semibold text-[var(--kanna-ink)]">
              {cart?.total ?? "0"}
            </span>
          </div>

          <div className="mt-4 flex gap-3">
            <LocalizedLink
              to="/cart"
              onClick={onClose}
              className="button-font-lato inline-flex flex-1 items-center justify-center border border-[var(--kanna-ink)] px-4 py-3 text-sm font-semibold text-[var(--kanna-ink)] transition hover:bg-white"
            >
              {messages.commerce.viewCart}
            </LocalizedLink>
            <LocalizedLink
              to="/checkout"
              onClick={onClose}
              className={getButtonClassName({
                className: "flex-1 px-4",
              })}
            >
              {messages.cart.checkout}
            </LocalizedLink>
          </div>
        </div>
      </aside>
    </div>
  );
}
