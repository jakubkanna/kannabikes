import type { Route } from "./+types/about";
import { ArchivoInkBleed } from "~/components/archivo-ink-bleed";
import { ImageGallery } from "~/components/image-gallery";
import { SectionPill } from "~/components/section-pill";
import { SITE_NAME, formatPageTitle } from "~/root";
import {
  buildLocalizedMeta,
  getLocaleFromPath,
  getMessages,
} from "~/lib/i18n";
import { useMessages } from "~/components/locale-provider";

export function meta({ location }: Route.MetaArgs) {
  const locale = getLocaleFromPath(location.pathname);
  const messages = getMessages(locale);
  return buildLocalizedMeta({
    description: messages.meta.about.description,
    locale,
    pathname: location.pathname,
    title: formatPageTitle(messages.meta.about.title),
  });
}

export default function AboutPage() {
  const messages = useMessages();
  const baseUrl = import.meta.env.BASE_URL;
  const galleryImages = [
    {
      alt: `${SITE_NAME} artwork`,
      src: `${baseUrl}about/DSF4080_JAKUBTRZ-2048x1365%20(1).jpeg`,
    },
    {
      alt: `${SITE_NAME} artwork`,
      src: `${baseUrl}about/619242148_18086628577896167_841511226042017979_n.jpg`,
    },
    {
      alt: `${SITE_NAME} artwork`,
      src: `${baseUrl}about/_G4A7766_specific-case-of-mbk_jakubkanna.jpeg`,
    },
  ] as const;

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-5xl">
        <SectionPill>{messages.pages.about.pill}</SectionPill>
        <h1 className="mt-4 max-w-4xl">
          <ArchivoInkBleed
            className="block w-full"
            color="var(--kanna-ink)"
            fontSize={148}
            lines={[...messages.pages.about.titleLines]}
          />
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
          {messages.pages.about.body.split("Velo-art")[0]}
          <a
            href="https://archive.jakubkanna.com/works?tags=Velo-art"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            Velo-art
          </a>
          {messages.pages.about.body.split("Velo-art")[1]}
        </p>

        <ImageGallery images={galleryImages} />
      </div>
    </main>
  );
}
