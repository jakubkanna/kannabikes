import type { Route } from "./+types/about";
import { ArchivoInkBleed } from "~/components/archivo-ink-bleed";
import { SectionPill } from "~/components/section-pill";
import { SITE_NAME, formatPageTitle } from "~/root";

export function meta({}: Route.MetaArgs) {
  return [{ title: formatPageTitle("About") }];
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-5xl">
        <SectionPill>About</SectionPill>
        <h1 className="mt-4 max-w-4xl">
          <ArchivoInkBleed
            className="block w-full"
            color="var(--kanna-ink)"
            fontSize={148}
            lines={["About"]}
          />
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
          {SITE_NAME} focuses on made-to-order bicycles shaped around rider fit,
          intended use, and a quieter, more personal build process from first
          message to final delivery.
        </p>
      </div>
    </main>
  );
}
