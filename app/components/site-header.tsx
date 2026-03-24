import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";

const NAV_ITEMS = [
  { to: "/pre-order", label: "Custom order", kind: "nav" },
  { to: "/shop", label: "Shop", kind: "nav" },
  { to: "/about", label: "About", kind: "nav" },
  { to: "/contact", label: "Contact", kind: "nav" },
] as const;

const KANNA_MENU_FONT_STYLE = {
  fontFamily: "var(--font-kanna)",
  fontVariationSettings: '"wdth" 125, "wght" 900',
  fontWeight: 900,
} as const;

export function SiteHeader() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const [useBlendMode, setUseBlendMode] = useState(!isHome);

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
        <Link
          to="/"
          className="shrink-0 transition duration-200 hover:scale-[1.2]"
        >
          <img
            src={`${import.meta.env.BASE_URL}kannabikes_logo.svg`}
            alt="Kanna Bikes"
            className={`h-10 w-auto ${useBlendMode ? "brightness-0 invert" : ""}`}
          />
        </Link>

        <ul
          className={`flex items-center gap-3 text-sm font-black uppercase ${
            useBlendMode ? "text-white" : "text-[var(--kanna-color)]"
          }`}
          style={KANNA_MENU_FONT_STYLE}
        >
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  [
                    "opacity-100 transition duration-200 hover:scale-[1.2] hover:text-[1.2em]",
                    isActive ? "scale-100" : "",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
