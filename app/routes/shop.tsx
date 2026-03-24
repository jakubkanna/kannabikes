import { Link } from "react-router";
import { SectionPill } from "~/components/section-pill";
import { formatPageTitle } from "~/root";
import type { Route } from "./+types/shop";

export function meta({}: Route.MetaArgs) {
  return [{ title: formatPageTitle("Shop") }];
}

export default function ShopPage() {
  return (
    <main className="bg-stone-100 px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionPill>Shop</SectionPill>
        <h1 className="page-heading mt-4 max-w-4xl text-4xl tracking-tight text-[var(--kanna-ink)] md:text-7xl">
          Shop is coming soon.
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
          In the meantime, get in touch if you want to ask about frames,
          components, or current availability.
        </p>
        <div className="mt-8">
          <Link
            to="/contact"
            className="inline-flex rounded-full bg-[var(--kanna-ink)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-black"
          >
            Contact
          </Link>
        </div>
      </div>
    </main>
  );
}
