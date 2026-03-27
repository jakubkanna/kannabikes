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

function MenuOutlineIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 512 512"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeMiterlimit="10"
      strokeWidth="32"
    >
      <path d="M80 160h352M80 256h352M80 352h352" />
    </svg>
  );
}

function CloseOutlineIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 512 512"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="32"
    >
      <path d="M368 368 144 144M368 144 144 368" />
    </svg>
  );
}

export function SiteHeader() {
  const { pathname } = useLocation();
  const messages = useMessages();
  const localizedPathname = stripLocalePrefix(pathname);
  const isHome = localizedPathname === "/";
  const isCommerceRoute =
    localizedPathname === "/cart" ||
    localizedPathname === "/checkout" ||
    localizedPathname === "/shop" || localizedPathname.startsWith("/shop/");
  const [useBlendMode, setUseBlendMode] = useState(!isHome);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const headerMarkToneClassName = useBlendMode ? "brightness-0 invert" : "";
  const headerToneClassName = useBlendMode
    ? "text-white"
    : "text-(--kanna-color)";
  const navItems = [
    { to: "/pre-order", label: messages.nav.customOrder },
    { to: "/shop", label: messages.nav.shop },
    { to: "/about", label: messages.nav.about },
    { to: "/contact", label: messages.nav.contact },
  ] as const;
  const mobileNavItems = [
    ...navItems,
    { to: "/account", label: messages.account.title },
    ...(isCommerceRoute
      ? [
          {
            to: "/cart",
            label:
              cartItemsCount > 0
                ? `${messages.cart.title} (${cartItemsCount})`
                : messages.cart.title,
          },
        ]
      : []),
  ] as const;

  useEffect(() => {
    if (!isCommerceRoute) {
      setIsCartDrawerOpen(false);
    }
  }, [isCommerceRoute]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isCommerceRoute) {
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
      const detail = (
        event as CustomEvent<{ cart?: StoreCart; openDrawer?: boolean }>
      ).detail;
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
  }, [isCommerceRoute, pathname]);

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
        className={`fixed inset-x-0 top-0 z-40 h-(--site-header-height) px-2 md:px-3 ${headerToneClassName}`}
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
              className={`h-10 w-auto ${headerMarkToneClassName}`}
            />
          </LocalizedLink>

          <div
            className={`hidden items-center gap-3 text-sm font-black uppercase md:flex ${headerToneClassName}`}
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
                {isCommerceRoute ? (
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
                          transition={{
                            duration: 0.18,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-(--kanna-ink) px-1 text-[10px] leading-none text-white"
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

          <button
            type="button"
            aria-label={messages.common.openMenu}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-site-menu"
            className={`inline-flex items-center justify-center p-2 md:hidden ${headerToneClassName}`}
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <MenuOutlineIcon className="h-7 w-7" />
          </button>
        </nav>
      </header>
      <AnimatePresence>
        {isMobileMenuOpen ? (
          <motion.div
            key="mobile-site-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-white text-(--kanna-ink) md:hidden"
          >
            <div className="flex h-(--site-header-height) items-center justify-between px-2">
              <LocalizedLink to="/" className="shrink-0" onClick={() => setIsMobileMenuOpen(false)}>
                <img
                  src={`${import.meta.env.BASE_URL}kannabikes_logo.svg`}
                  alt="Kanna Bikes"
                  className="h-10 w-auto"
                />
              </LocalizedLink>
              <button
                type="button"
                aria-label={messages.common.closeMenu}
                className="inline-flex items-center justify-center p-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <CloseOutlineIcon className="h-7 w-7" />
              </button>
            </div>

            <nav
              id="mobile-site-menu"
              aria-label="Mobile"
              className="flex min-h-[calc(100svh-var(--site-header-height))] flex-col items-center justify-center gap-10 px-6 pb-8 pt-4 text-center"
            >
              <motion.ul
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                    },
                  },
                }}
                className="space-y-5 text-[2rem] uppercase leading-none"
                style={KANNA_MENU_FONT_STYLE}
              >
                {mobileNavItems.map((item) => (
                  <motion.li
                    key={item.to}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.22 }}
                  >
                    <LocalizedNavLink
                      to={item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        [
                          "block transition",
                          isActive ? "opacity-100" : "opacity-65 hover:opacity-100",
                        ].join(" ")
                      }
                    >
                      {item.label}
                    </LocalizedNavLink>
                  </motion.li>
                ))}
              </motion.ul>

              <div className="flex flex-col items-center gap-5">
                <LanguageSwitcher />
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
      />
    </>
  );
}
