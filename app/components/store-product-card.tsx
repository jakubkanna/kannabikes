import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { LocalizedLink } from "~/components/localized-link";
import { useMessages } from "~/components/locale-provider";
import type { Locale } from "~/lib/i18n";
import { addStoreCartItem, type StoreProduct } from "~/lib/store-api";

function MinimalProductAction({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={[
        "inline-flex min-h-10 items-center justify-center border border-black/15 px-4 text-xs font-semibold uppercase text-[var(--kanna-ink)] transition hover:border-black hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-60",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function MinimalProductLink({
  children,
  className,
  to,
}: {
  children: ReactNode;
  className?: string;
  to: string;
}) {
  return (
    <LocalizedLink
      to={to}
      className={[
        "inline-flex min-h-10 items-center justify-center border border-black/15 px-4 text-xs font-semibold uppercase text-[var(--kanna-ink)] transition hover:border-black hover:bg-black hover:text-white",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </LocalizedLink>
  );
}

export function StoreProductCard({
  locale,
  product,
}: {
  locale: Locale;
  product: StoreProduct;
}) {
  const messages = useMessages();
  const [isAdding, setIsAdding] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canAddDirectly =
    !product.hasOptions &&
    product.productType !== "variable" &&
    product.stockStatus !== "outofstock";

  async function handleAddToCart() {
    setIsAdding(true);
    setAddedToCart(false);
    setErrorMessage(null);

    try {
      await addStoreCartItem({
        id: product.id,
        locale,
        openDrawerOnSuccess: true,
      });
      setAddedToCart(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : messages.commerce.noProducts,
      );
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <article className="flex h-full flex-col overflow-hidden border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1">
      <LocalizedLink to={product.path} className="flex flex-1 flex-col">
        {product.imageSrc ? (
          <img
            src={product.imageSrc}
            alt={product.imageAlt}
            className="aspect-[4/3] w-full object-cover"
          />
        ) : null}
        <div className="flex flex-1 flex-col p-5">
          <h2 className="text-xl font-semibold text-[var(--kanna-ink)]">
            {product.name}
          </h2>
          <p className="mt-2 text-sm text-stone-600">{product.price}</p>
        </div>
      </LocalizedLink>
      <div className="mt-auto border-t border-black/10 px-5 py-4">
        {canAddDirectly ? (
          <MinimalProductAction
            onClick={() => void handleAddToCart()}
            disabled={isAdding}
            className="w-full"
          >
            {isAdding
              ? `${messages.commerce.addToCart}...`
              : addedToCart
                ? messages.commerce.addedToCart
                : messages.commerce.addToCart}
          </MinimalProductAction>
        ) : (
          <MinimalProductLink to={product.path} className="w-full">
            {messages.commerce.chooseOption}
          </MinimalProductLink>
        )}
      </div>
      {errorMessage ? (
        <p className="px-5 pb-4 text-sm text-red-700">{errorMessage}</p>
      ) : null}
    </article>
  );
}
