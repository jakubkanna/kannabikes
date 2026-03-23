import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router";

type SiteHeaderProps = {
  overlay?: boolean;
};

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader({ overlay = false }: SiteHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!overlay) {
      setIsScrolled(false);
      return;
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [overlay]);

  const showHomeLogo = !overlay || isScrolled;
  const navJustifyClass =
    overlay && !isScrolled ? "justify-center" : "justify-between";

  return (
    <header
      className={
        overlay
          ? "absolute inset-x-0 top-0 z-20 h-[var(--site-header-height)] px-4 md:px-8"
          : "relative z-20 h-[var(--site-header-height)] px-4 md:px-8"
      }
    >
      <nav
        aria-label="Main"
        className={`mx-auto flex h-full max-w-6xl items-center gap-6 ${navJustifyClass}`}
      >
        {showHomeLogo ? (
          <Link to="/" className="shrink-0">
            <img
              src={`${import.meta.env.BASE_URL}kannabikes_logo.svg`}
              alt="Kanna Bikes"
              className="h-10 w-auto"
            />
          </Link>
        ) : null}

        <ul className="flex items-center gap-5 text-sm font-medium md:gap-8">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  [
                    "transition duration-200",
                    overlay
                      ? "text-(--kanna-yellow) drop-shadow-[0_2px_6px_rgba(0,0,0,0.33)]"
                      : "text-slate-900",
                    isActive
                      ? "opacity-100"
                      : "opacity-78 hover:opacity-100",
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
