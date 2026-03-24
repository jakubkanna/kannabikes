import type { Route } from "./+types/about";
import { ArchivoInkBleed } from "~/components/archivo-ink-bleed";
import { ImageGallery } from "~/components/image-gallery";
import { SectionPill } from "~/components/section-pill";
import { SITE_NAME, formatPageTitle } from "~/root";

export function meta({}: Route.MetaArgs) {
  return [{ title: formatPageTitle("About") }];
}

export default function AboutPage() {
  const baseUrl = import.meta.env.BASE_URL;
  const galleryImages = [
    {
      alt: "Jakub Kanna bicycle-related artwork",
      src: `${baseUrl}about/DSF4080_JAKUBTRZ-2048x1365%20(1).jpeg`,
    },
    {
      alt: "Jakub Kanna bicycle-related artwork",
      src: `${baseUrl}about/619242148_18086628577896167_841511226042017979_n.jpg`,
    },
    {
      alt: "Jakub Kanna bicycle-related artwork",
      src: `${baseUrl}about/_G4A7766_specific-case-of-mbk_jakubkanna.jpeg`,
    },
  ] as const;

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
          {SITE_NAME} was started by multidisciplinary artist Jakub Kanna.
          Driven by a strong connection to the bicycle world and by works such
          as{" "}
          <a
            href="https://archive.jakubkanna.com/works?tags=Velo-art"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            Velo-art
          </a>
          , along with other projects shown at the Museum of Modern Art in
          Warsaw and works like Fight or Flight, he decided to leave the IT
          industry and build his own frame. In the end, it is not easy to find a
          frame that fits a 6&apos;5&quot; rider. Kanna Bikes is dedicated to
          everyone who does not feel they fit into big companies and is looking
          for a deeper way of experiencing the world through a bicycle.
        </p>

        <ImageGallery images={galleryImages} />
      </div>
    </main>
  );
}
