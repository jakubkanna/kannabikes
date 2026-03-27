import type { Route } from "./+types/warranty";
import { PageContainer, PageShell } from "~/components/page-container";
import { SectionPill } from "~/components/section-pill";
import { useLocale } from "~/components/locale-provider";
import {
  buildLocalizedMeta,
  getLocaleFromPath,
  getMessages,
  type Locale,
} from "~/lib/i18n";
import { formatPageTitle } from "~/root";

const WARRANTY_CONTENT: Record<
  Locale,
  {
    lead: string;
    sections: Array<{
      body: string[];
      title: string;
    }>;
    title: string;
  }
> = {
  en: {
    lead:
      "This page sets out the default 5 year frame warranty for Kanna Bikes frames. It is a baseline policy and may be supplemented by the specific documents issued with your order.",
    sections: [
      {
        title: "1. What the warranty covers",
        body: [
          "The warranty covers defects in materials or workmanship in the original Kanna Bikes frame for 5 years from the date of delivery.",
          "This warranty is intended for the original owner unless we confirm a different arrangement in writing.",
        ],
      },
      {
        title: "2. What is not covered",
        body: [
          "The warranty does not cover normal wear, cosmetic wear, paint damage, surface corrosion caused by neglect, consumable parts, or routine service.",
          "It also does not cover crash damage, misuse, improper storage, incorrect assembly, modifications by third parties, or use outside the intended purpose of the bicycle.",
        ],
      },
      {
        title: "3. How to make a claim",
        body: [
          "If you believe the frame has a warranty issue, stop riding the bicycle if safety may be affected and contact Kanna Bikes with your order details, a description of the issue, and clear photos.",
          "If inspection is required, we may ask for the frame or bicycle to be returned for assessment before confirming the warranty outcome.",
        ],
      },
      {
        title: "4. Remedy",
        body: [
          "If a valid warranty claim is confirmed, Kanna Bikes may decide to repair the frame, replace it, or offer another appropriate remedy.",
          "If the original model, finish, or exact parts are no longer available, an equivalent alternative may be used.",
        ],
      },
      {
        title: "5. Additional rights",
        body: [
          "This warranty is a voluntary commercial warranty and does not limit any statutory consumer rights that may apply under the law.",
        ],
      },
    ],
    title: "5 year frame warranty",
  },
  pl: {
    lead:
      "Ta strona określa domyślne warunki 5-letniej gwarancji na ramę Kanna Bikes. Jest to podstawowa polityka, która może zostać uzupełniona dokumentami wydanymi dla konkretnego zamówienia.",
    sections: [
      {
        title: "1. Co obejmuje gwarancja",
        body: [
          "Gwarancja obejmuje wady materiałowe lub wykonawcze oryginalnej ramy Kanna Bikes przez 5 lat od dnia dostawy.",
          "Gwarancja jest przeznaczona dla pierwszego właściciela, chyba że osobno potwierdzimy inny model na piśmie.",
        ],
      },
      {
        title: "2. Czego gwarancja nie obejmuje",
        body: [
          "Gwarancja nie obejmuje normalnego zużycia, śladów estetycznych, uszkodzeń lakieru, korozji powierzchniowej wynikającej z zaniedbania, części eksploatacyjnych ani rutynowego serwisu.",
          "Nie obejmuje również uszkodzeń powstałych wskutek wypadku, niewłaściwego użytkowania, złego przechowywania, nieprawidłowego montażu, modyfikacji wykonanych przez osoby trzecie ani używania roweru niezgodnie z jego przeznaczeniem.",
        ],
      },
      {
        title: "3. Jak zgłosić roszczenie",
        body: [
          "Jeśli uważasz, że rama ma problem objęty gwarancją, przestań korzystać z roweru, jeśli może to wpływać na bezpieczeństwo, i skontaktuj się z Kanna Bikes, podając dane zamówienia, opis problemu i czytelne zdjęcia.",
          "Jeżeli będzie potrzebna inspekcja, możemy poprosić o odesłanie ramy lub roweru do oceny przed potwierdzeniem wyniku reklamacji gwarancyjnej.",
        ],
      },
      {
        title: "4. Sposób realizacji gwarancji",
        body: [
          "Jeśli roszczenie gwarancyjne okaże się zasadne, Kanna Bikes może zdecydować o naprawie ramy, jej wymianie albo innym odpowiednim sposobie usunięcia problemu.",
          "Jeżeli pierwotny model, wykończenie lub dokładne części nie są już dostępne, możemy zastosować równoważne rozwiązanie.",
        ],
      },
      {
        title: "5. Dodatkowe prawa",
        body: [
          "Ta gwarancja jest dobrowolną gwarancją handlową i nie ogranicza ustawowych praw konsumenta, które mogą przysługiwać na podstawie prawa.",
        ],
      },
    ],
    title: "5-letnia gwarancja na ramę",
  },
};

export function meta({ location }: Route.MetaArgs) {
  const locale = getLocaleFromPath(location.pathname);
  const messages = getMessages(locale);
  return buildLocalizedMeta({
    description: messages.meta.warranty.description,
    locale,
    pathname: location.pathname,
    title: formatPageTitle(messages.meta.warranty.title),
  });
}

export default function WarrantyPage() {
  const locale = useLocale();
  const content = WARRANTY_CONTENT[locale];

  return (
    <PageShell>
      <PageContainer>
        <div className="max-w-4xl rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm md:p-8">
          <SectionPill>{content.title}</SectionPill>
          <h1 className="page-heading mt-3 text-[2.35rem] leading-[0.88] text-[var(--kanna-ink)] md:text-[3.8rem]">
            {content.title}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-stone-600">
            {content.lead}
          </p>

          <div className="mt-8 space-y-8 text-sm leading-6 text-stone-700">
            {content.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-semibold text-[var(--kanna-ink)]">
                  {section.title}
                </h2>
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="mt-3">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </div>
      </PageContainer>
    </PageShell>
  );
}
