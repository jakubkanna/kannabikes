import { Link } from "react-router";
import { SectionPill } from "~/components/section-pill";
import { formatPageTitle } from "~/root";
import type { Route } from "./+types/pre-order";

const STEPS = [
  {
    number: "01",
    title: "Deposit",
    description:
      "Secure your place in the build queue and start the project with the initial payment.",
  },
  {
    number: "02",
    title: "Design",
    description:
      "We shape the bicycle around the rider, intended use, geometry, and component direction.",
  },
  {
    number: "03",
    title: "Build",
    description:
      "The frame and selected parts move through fabrication, finishing, and assembly.",
  },
  {
    number: "04",
    title: "Delivery",
    description:
      "Final approval, shipping or pickup, and handover of the completed bicycle.",
  },
] as const;

export function meta({}: Route.MetaArgs) {
  return [{ title: formatPageTitle("Pre-Order") }];
}

export default function PreOrderPage() {
  return (
    <main className="bg-stone-100 px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionPill>Custom Order</SectionPill>
        <h1
          className="mt-4 max-w-4xl text-4xl tracking-tight text-slate-900 md:text-7xl"
          style={{
            fontFamily: "var(--font-kanna)",
            fontVariationSettings: '"wdth" 125, "wght" 900',
            fontWeight: 900,
          }}
        >
          Pre-order process
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
          A clear four-step flow from reservation to handover. Each stage stays
          visible before the build begins.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {STEPS.map((step) => (
            <section
              key={step.number}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8"
            >
              <p className="text-xs uppercase text-slate-500">{step.number}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                {step.title}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
                {step.description}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            to="/contact"
            className="inline-flex rounded-full bg-black px-6 py-3 text-sm font-semibold uppercase text-white transition hover:bg-slate-800"
          >
            Start inquiry
          </Link>
          <Link
            to="/#custom-order"
            className="inline-flex rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold uppercase text-slate-900 transition hover:border-slate-900"
          >
            Back to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
