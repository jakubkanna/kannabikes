import { NavLink } from "react-router";

type SiteHeaderProps = {
  overlay?: boolean;
};

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader({ overlay = false }: SiteHeaderProps) {
  return (
    <header
      className={
        overlay
          ? "absolute inset-x-0 top-0 z-20 px-6 py-6"
          : "sticky top-0 z-30 border-b border-white/10 bg-slate-950/92 px-4 py-4 backdrop-blur md:px-8"
      }
    >
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-6xl items-center justify-end"
      >
        <ul className="flex items-center gap-6 text-xs uppercase tracking-[0.32em] md:gap-8">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  [
                    "transition duration-200",
                    "text-(--kanna-yellow) drop-shadow-[0_2px_6px_rgba(0,0,0,0.33)]",
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
