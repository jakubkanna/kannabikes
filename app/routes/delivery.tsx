import type { Route } from "./+types/delivery";
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

const DELIVERY_CONTENT: Record<
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
      "This page outlines the default delivery terms for completed Kanna Bikes orders. The exact delivery method, date, and handover details may still be confirmed individually in writing for each project.",
    sections: [
      {
        title: "1. Delivery timing",
        body: [
          "Delivery can take place once the bicycle is finished, the final payment is settled, and the bike has passed final inspection.",
          "Any production or delivery timing shared earlier is an estimate unless we confirm a final handover date separately.",
        ],
      },
      {
        title: "2. Delivery methods",
        body: [
          "Completed bicycles may be handed over by courier shipment or by personal pickup from the Kanna Bikes showroom, depending on what was agreed for the order.",
          "Pickup takes place by appointment only.",
        ],
      },
      {
        title: "3. Shipping address and costs",
        body: [
          "The customer is responsible for providing a complete and correct delivery address and for informing us promptly if it changes.",
          "Shipping costs, if applicable, are quoted individually unless they were already included in the confirmed order.",
        ],
      },
      {
        title: "4. Inspection on receipt",
        body: [
          "Please inspect the package and bicycle as soon as possible after receipt.",
          "If there is visible transport damage or missing items, report it promptly and include photos so the issue can be handled with the carrier if needed.",
        ],
      },
      {
        title: "5. International shipments",
        body: [
          "For deliveries outside your local customs area, import duties, local taxes, and customs handling charges may apply.",
          "Unless agreed otherwise in writing, such charges are the responsibility of the customer.",
        ],
      },
      {
        title: "6. Delays outside our control",
        body: [
          "We are not responsible for delays caused by shipping carriers, customs procedures, severe weather, supply-chain disruptions, or other circumstances outside our reasonable control.",
          "If such a delay affects your order, we will communicate the updated status as soon as reasonably possible.",
        ],
      },
    ],
    title: "Delivery",
  },
  pl: {
    lead:
      "Ta strona opisuje domyślne warunki dostawy dla zrealizowanych zamówień Kanna Bikes. Dokładna metoda dostawy, termin i sposób przekazania roweru mogą być jeszcze potwierdzane indywidualnie na piśmie dla każdego projektu.",
    sections: [
      {
        title: "1. Termin dostawy",
        body: [
          "Dostawa może nastąpić po ukończeniu roweru, zaksięgowaniu płatności końcowej i przejściu końcowej kontroli.",
          "Każdy wcześniej podany termin produkcji lub dostawy ma charakter orientacyjny, dopóki osobno nie potwierdzimy finalnej daty przekazania.",
        ],
      },
      {
        title: "2. Formy dostawy",
        body: [
          "Gotowe rowery mogą być przekazywane kurierem albo przez odbiór osobisty w showroomie Kanna Bikes, zależnie od ustaleń dla danego zamówienia.",
          "Odbiór osobisty odbywa się wyłącznie po wcześniejszym umówieniu terminu.",
        ],
      },
      {
        title: "3. Adres i koszty wysyłki",
        body: [
          "Klient odpowiada za podanie pełnego i poprawnego adresu dostawy oraz za niezwłoczne poinformowanie o jego zmianie.",
          "Koszty wysyłki, jeśli mają zastosowanie, są wyceniane indywidualnie, chyba że zostały już uwzględnione w potwierdzonym zamówieniu.",
        ],
      },
      {
        title: "4. Sprawdzenie przesyłki przy odbiorze",
        body: [
          "Prosimy o sprawdzenie paczki i roweru możliwie jak najszybciej po odbiorze.",
          "Jeśli wystąpi widoczne uszkodzenie transportowe albo braki w przesyłce, zgłoś to możliwie szybko i dołącz zdjęcia, aby można było obsłużyć sprawę również z przewoźnikiem.",
        ],
      },
      {
        title: "5. Wysyłki międzynarodowe",
        body: [
          "Przy dostawach poza Twoim lokalnym obszarem celnym mogą pojawić się cła, podatki lokalne i opłaty za obsługę celną.",
          "Jeśli nie ustalimy inaczej na piśmie, takie koszty pokrywa klient.",
        ],
      },
      {
        title: "6. Opóźnienia poza naszą kontrolą",
        body: [
          "Nie odpowiadamy za opóźnienia spowodowane przez przewoźników, procedury celne, skrajne warunki pogodowe, zakłócenia łańcucha dostaw lub inne okoliczności pozostające poza naszą rozsądną kontrolą.",
          "Jeśli takie opóźnienie wpłynie na Twoje zamówienie, przekażemy zaktualizowaną informację tak szybko, jak będzie to rozsądnie możliwe.",
        ],
      },
    ],
    title: "Dostawa",
  },
};

export function meta({ location }: Route.MetaArgs) {
  const locale = getLocaleFromPath(location.pathname);
  const messages = getMessages(locale);
  return buildLocalizedMeta({
    description: messages.meta.delivery.description,
    locale,
    pathname: location.pathname,
    title: formatPageTitle(messages.meta.delivery.title),
  });
}

export default function DeliveryPage() {
  const locale = useLocale();
  const content = DELIVERY_CONTENT[locale];

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
