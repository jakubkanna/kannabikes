import type { Route } from "./+types/about";
import { SectionPill } from "~/components/section-pill";
import { SITE_NAME, formatPageTitle } from "~/root";

export function meta({}: Route.MetaArgs) {
  return [{ title: formatPageTitle("About") }];
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-5xl rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm md:p-8">
        <SectionPill>About</SectionPill>
        <h1 className="page-heading mt-4 max-w-4xl text-4xl tracking-tight text-[var(--kanna-ink)] md:text-7xl">
          Built around custom steel bikes and direct collaboration.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
          {SITE_NAME} focuses on made-to-order bicycles shaped around rider fit,
          intended use, and a quieter, more personal build process from first
          message to final delivery.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <section className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">
              Fit First
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Each project starts from rider measurements and riding goals,
              rather than a fixed stock geometry.
            </p>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">
              Designed Together
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Specification, paint, and finishing details are handled as a
              guided conversation instead of a generic checkout flow.
            </p>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">
              Transparent Process
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The portal keeps deposit, design approval, production, and final
              delivery visible throughout the order lifecycle.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
