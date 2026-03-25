import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { stripLocalePrefix } from "~/lib/i18n";
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
  const isHome = stripLocalePrefix(pathname) === "/";
  const [useBlendMode, setUseBlendMode] = useState(!isHome);
  const navItems = [
    { to: "/pre-order", label: messages.nav.customOrder },
    { to: "/shop", label: messages.nav.shop },
    { to: "/about", label: messages.nav.about },
    { to: "/contact", label: messages.nav.contact },
  ] as const;

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
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
}
