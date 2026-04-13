import type { Route } from "./+types/about";
import { ArchivoInkBleed } from "~/components/archivo-ink-bleed";
import { ImageGallery } from "~/components/image-gallery";
import { PageContainer, PageShell } from "~/components/page-container";
import { SectionPill } from "~/components/section-pill";
import { SITE_NAME, formatPageTitle } from "~/root";
import { buildLocalizedMeta, getLocaleFromPath, getMessages } from "~/lib/i18n";
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
  const aboutParagraphs = messages.pages.about.body.split("\n\n");
  const aboutLinks = [
    {
      href: "https://archive.jakubkanna.com/works?tags=Velo-art",
      label: "Velo-art",
    },
    {
      href: "https://youtu.be/Add6TU5CxDU",
      label: "Fight or Flight",
    },
  ];
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
    <PageShell>
      <PageContainer>
        <SectionPill>{messages.pages.about.pill}</SectionPill>
        <h1 className="mt-4 max-w-4xl">
          <ArchivoInkBleed
            className="block w-full"
            color="var(--kanna-ink)"
            fontSize={148}
            lines={[...messages.pages.about.titleLines]}
          />
        </h1>
        <div className="mt-4 space-y-4 text-sm leading-6 text-stone-600 lg:w-1/2">
          {aboutParagraphs.map((paragraph) => {
            const paragraphParts = aboutLinks
              .reduce<Array<string | (typeof aboutLinks)[number]>>(
                (parts, link) =>
                  parts.flatMap((part) => {
                    if (typeof part !== "string") return part;
                    const splitParts = part.split(link.label);

                    return splitParts.flatMap((splitPart, index) =>
                      index === splitParts.length - 1
                        ? [splitPart]
                        : [splitPart, link],
                    );
                  }),
                [paragraph],
              )
              .filter((part) => typeof part !== "string" || part.length > 0);

            return (
              <p key={paragraph}>
                {paragraphParts.map((part, index) =>
                  typeof part === "string" ? (
                    part
                  ) : (
                    <a
                      key={`${part.label}-${index}`}
                      href={part.href}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2"
                    >
                      {part.label}
                    </a>
                  ),
                )}
              </p>
            );
          })}
        </div>

        <ImageGallery images={galleryImages} />
      </PageContainer>
    </PageShell>
  );
}
