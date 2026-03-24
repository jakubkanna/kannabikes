import { Link } from "react-router";
import { ArchivoInkBleed } from "~/components/archivo-ink-bleed";
import { SectionPill } from "~/components/section-pill";
import { formatPageTitle } from "~/root";
import type { Route } from "./+types/pre-order";

export function meta({}: Route.MetaArgs) {
  return [{ title: formatPageTitle("Pre-Order") }];
}

export default function PreOrderPage() {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <main className="bg-stone-100 px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionPill>Custom Order</SectionPill>
        <h1 className="mt-4 max-w-4xl">
          <ArchivoInkBleed
            className="block w-full"
            color="var(--kanna-ink)"
            fontSize={160}
            lines={["Pre-order process"]}
          />
        </h1>
        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
          <div className="max-w-4xl text-sm leading-7 text-slate-600 md:text-base">
            <p>
              We use a proven deposit-based system to guide each order from
              first contact to final handover.
            </p>
            <p className="mt-5 font-semibold text-[var(--kanna-ink)]">
              How does it work?
            </p>
            <ol className="mt-4 list-decimal space-y-4 pl-5">
              <li>
                <span className="font-semibold text-[var(--kanna-ink)]">
                  Deposit:
                </span>{" "}
                after the initial contact, we will ask you to pay a{" "}
                <span className="font-semibold text-[var(--kanna-ink)]">
                  590 euro
                </span>{" "}
                deposit. This gives you{" "}
                <span className="font-semibold text-[var(--kanna-ink)]">
                  access to the bike configurator
                </span>{" "}
                on our website.
              </li>
              <li>
                <span className="font-semibold text-[var(--kanna-ink)]">
                  Design process:
                </span>{" "}
                you will be asked to fill in the necessary details in the
                configurator, and you will receive the design for your project
                within 2 to 3 weeks, including frame geometry and components
                depending on whether you order a frame only or a full build.
              </li>
              <li>
                <span className="font-semibold text-[var(--kanna-ink)]">
                  Build time:
                </span>{" "}
                once the final payment is complete, we start building the bike
                and shaping the steel into your finished frame.
              </li>
              <li>
                <span className="font-semibold text-[var(--kanna-ink)]">
                  Delivery:
                </span>{" "}
                depending on the option you choose, we can either ship the bike
                or hand it over to you in person.
              </li>
            </ol>
          </div>

          <div className="flex h-full items-center justify-center">
            <img
              src={`${baseUrl}cards-work-process.svg`}
              alt="Pre-order process steps"
              className="block h-auto w-full max-w-full"
            />
          </div>
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
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
