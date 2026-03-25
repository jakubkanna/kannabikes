import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLocation } from "react-router";
import { CartDrawer } from "~/components/cart-drawer";
import { getLocaleFromPath, stripLocalePrefix } from "~/lib/i18n";
import {
  fetchStoreCart,
  STORE_CART_UPDATED_EVENT,
  type StoreCart,
} from "~/lib/store-api";
import { LanguageSwitcher } from "./language-switcher";
import { LocalizedLink, LocalizedNavLink } from "./localized-link";
import { useMessages } from "./locale-provider";

const KANNA_MENU_FONT_STYLE = {
  fontFamily: "var(--font-kanna)",
  fontVariationSettings: '"wdth" 125, "wght" 900',
  fontWeight: 900,
} as const;

export function SiteHeader() {
  const { pathname } = useLocation();
  const messages = useMessages();
  const localizedPathname = stripLocalePrefix(pathname);
  const isHome = localizedPathname === "/";
  const isShopRoute =
    localizedPathname === "/shop" || localizedPathname.startsWith("/shop/");
  const [useBlendMode, setUseBlendMode] = useState(!isHome);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const navItems = [
    { to: "/pre-order", label: messages.nav.customOrder },
    { to: "/shop", label: messages.nav.shop },
    { to: "/about", label: messages.nav.about },
    { to: "/contact", label: messages.nav.contact },
  ] as const;

  useEffect(() => {
    if (!isShopRoute) {
      setIsCartDrawerOpen(false);
    }
  }, [isShopRoute]);

  useEffect(() => {
    if (!isShopRoute) {
      setCartItemsCount(0);
      return;
    }

    let cancelled = false;
    const locale = getLocaleFromPath(pathname);

    const syncCart = async () => {
      try {
        const cart = await fetchStoreCart(locale);
        if (!cancelled) {
          setCartItemsCount(cart.totalItems);
        }
      } catch {
        if (!cancelled) {
          setCartItemsCount(0);
        }
      }
    };

    void syncCart();

    const handleCartUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ cart?: StoreCart; openDrawer?: boolean }>).detail;
      const totalItems = detail?.cart?.totalItems ?? 0;

      setCartItemsCount(totalItems);

      if (detail?.openDrawer) {
        setIsCartDrawerOpen(true);
      }
    };

    window.addEventListener(STORE_CART_UPDATED_EVENT, handleCartUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener(STORE_CART_UPDATED_EVENT, handleCartUpdated);
    };
  }, [isShopRoute, pathname]);

  useEffect(() => {
    if (!isHome) {
      setUseBlendMode(true);
      return;
    }

    const updateBlendMode = () => {
      const customOrderSection = document.getElementById("custom-order");

      if (!customOrderSection) {
        setUseBlendMode(false);
        return;
      }

      const fadeDistance = customOrderSection.offsetTop;

      if (fadeDistance <= 0) {
        setUseBlendMode(true);
        return;
      }

      const progress = Math.min(Math.max(window.scrollY / fadeDistance, 0), 1);
      setUseBlendMode(progress >= 1);
    };

    updateBlendMode();
    window.addEventListener("scroll", updateBlendMode, { passive: true });
    window.addEventListener("resize", updateBlendMode);

    return () => {
      window.removeEventListener("scroll", updateBlendMode);
      window.removeEventListener("resize", updateBlendMode);
    };
  }, [isHome]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 h-[var(--site-header-height)] px-2 md:px-3 ${
          useBlendMode ? "text-white" : "text-[var(--kanna-color)]"
        }`}
        style={useBlendMode ? { mixBlendMode: "difference" } : undefined}
      >
        <nav
          aria-label="Main"
          className="mx-auto flex h-full max-w-none items-center justify-between gap-6"
        >
          <LocalizedLink
            to="/"
            className="shrink-0 transition duration-200 hover:scale-[1.2]"
          >
            <img
              src={`${import.meta.env.BASE_URL}kannabikes_logo.svg`}
              alt="Kanna Bikes"
              className={`h-10 w-auto ${useBlendMode ? "brightness-0 invert" : ""}`}
            />
          </LocalizedLink>

          <div
            className={`flex items-center gap-3 text-sm font-black uppercase ${
              useBlendMode ? "text-white" : "text-[var(--kanna-color)]"
            }`}
            style={KANNA_MENU_FONT_STYLE}
          >
            <ul className="flex items-center gap-3">
              {navItems.map((item) => (
                <li key={item.to}>
                  <LocalizedNavLink
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        "opacity-100 transition duration-200 hover:scale-[1.2] hover:text-[1.2em]",
                        isActive ? "scale-100" : "",
                      ].join(" ")
                    }
                  >
                    {item.label}
                  </LocalizedNavLink>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-3">
              <LocalizedLink
                to="/account"
                aria-label={messages.account.openAccount}
                className="inline-flex cursor-pointer items-center justify-center p-1 transition duration-200 hover:scale-[1.15]"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 512 512"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="32"
                >
                  <path d="M344 144c-3.92 52.87-47.1 96-88 96s-84.08-43.13-88-96c-4-55.43 35.9-96 88-96s92 40.57 88 96Z" />
                  <path d="M256 304c-87 0-144 38-144 80v48h288v-48c0-42-57-80-144-80Z" />
                </svg>
              </LocalizedLink>
              <AnimatePresence initial={false}>
                {isShopRoute ? (
                  <motion.button
                    layout
                    key="cart-trigger"
                    type="button"
                    onClick={() => setIsCartDrawerOpen(true)}
                    aria-label={messages.commerce.viewCart}
                    className="relative inline-flex cursor-pointer items-center justify-center rounded-full p-1 transition duration-200 hover:scale-[1.15]"
                    initial={{ opacity: 0, scale: 0.8, x: 10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 10 }}
                    transition={{
                      layout: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
                      opacity: { duration: 0.18 },
                      scale: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
                      x: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
                    }}
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 512 512"
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="32"
                    >
                      <circle cx="176" cy="416" r="16" />
                      <circle cx="400" cy="416" r="16" />
                      <path d="M48 80h64l48 272h256l48-208H128" />
                    </svg>
                    <AnimatePresence initial={false}>
                      {cartItemsCount > 0 ? (
                        <motion.span
                          key="cart-count"
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.7 }}
                          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                          className="absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--kanna-ink)] px-1 text-[10px] leading-none text-white"
                        >
                          {cartItemsCount}
                        </motion.span>
                      ) : null}
                    </AnimatePresence>
                  </motion.button>
                ) : null}
              </AnimatePresence>
              <LanguageSwitcher />
            </div>
          </div>
        </nav>
      </header>
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
      />
    </>
  );
}
