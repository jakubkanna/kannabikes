import { useEffect, useState } from "react";
import { ArchivoInkBleed } from "~/components/archivo-ink-bleed";
import { getButtonClassName } from "~/components/button";
import { LocalizedLink } from "~/components/localized-link";
import { useMessages } from "~/components/locale-provider";
import { PageContainer, PageShell } from "~/components/page-container";
import { SectionPill } from "~/components/section-pill";
import { formatPageTitle } from "~/root";
import type { Route } from "./+types/pre-order";
import { buildLocalizedMeta, getLocaleFromPath, getMessages } from "~/lib/i18n";

export function meta({ location }: Route.MetaArgs) {
  const locale = getLocaleFromPath(location.pathname);
  const messages = getMessages(locale);
  return buildLocalizedMeta({
    description: messages.meta.preOrder.description,
    locale,
    pathname: location.pathname,
    title: formatPageTitle(messages.meta.preOrder.title),
  });
}

export default function PreOrderPage() {
  const messages = useMessages();
  const baseUrl = import.meta.env.BASE_URL;
  const [bodyImageVariant, setBodyImageVariant] = useState<"M" | "F">("M");

  useEffect(() => {
    setBodyImageVariant(Math.random() < 0.5 ? "M" : "F");
  }, []);

  const bodyImageSrc = `${baseUrl}bodies/body-kannabikes-${bodyImageVariant}.svg`;

  return (
    <PageShell>
      <PageContainer>
        <SectionPill>{messages.pages.preOrder.pill}</SectionPill>
        <h1 className="mt-4 max-w-4xl">
          <ArchivoInkBleed
            className="block w-full"
            color="var(--kanna-ink)"
            fontSize={160}
            lines={[...messages.pages.preOrder.titleLines]}
          />
        </h1>
        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-start">
          <div className="text-sm leading-7 text-stone-600 md:text-base lg:w-1/2">
            <p>{messages.pages.preOrder.intro}</p>
            <p className="mt-[150px] font-semibold text-[var(--kanna-ink)]">
              {messages.pages.preOrder.why}
            </p>
            <p className="mt-5">{messages.pages.preOrder.processIntro}</p>
            <ol className="mt-4 list-decimal space-y-4 pl-5">
              {messages.pages.preOrder.steps.map((step) => (
                <li key={step.title}>
                  <span className="font-semibold text-[var(--kanna-ink)]">
                    {step.title}
                  </span>{" "}
                  {step.body}
                </li>
              ))}
            </ol>
          </div>

          <div className="flex h-full items-center justify-center">
            <img
              src={bodyImageSrc}
              alt={messages.pages.preOrder.imageAlt}
              className="mx-auto block h-auto w-full max-w-full cursor-pointer"
              onClick={() =>
                setBodyImageVariant((current) => (current === "M" ? "F" : "M"))
              }
            />
          </div>
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <LocalizedLink
            to="/contact"
            className={getButtonClassName({})}
          >
            {messages.pages.preOrder.contact}
          </LocalizedLink>
        </div>
      </PageContainer>
    </PageShell>
  );
}
