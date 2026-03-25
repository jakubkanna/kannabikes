import type { Route } from "./+types/privacy-terms";
import { PageContainer, PageShell } from "~/components/page-container";
import { SectionPill } from "~/components/section-pill";
import { useLocale, useMessages } from "~/components/locale-provider";
import {
  ANALYTICS_CONSENT_COOKIE_NAME,
  COOKIE_PREFERENCES_EVENT,
} from "~/lib/analytics";
import {
  buildLocalizedMeta,
  getLocaleFromPath,
  getMessages,
  type Locale,
} from "~/lib/i18n";
import { SITE_NAME, formatPageTitle } from "~/root";

const BUSINESS = {
  address: "[add registered address]",
  email: "[add privacy/contact email]",
  legalName: "Kanna Bikes Sp. z o.o.",
  phone: "[add phone number]",
};

type PolicySection = {
  actionLabel?: string;
  bullets?: string[];
  paragraphs?: string[];
  title: string;
};

const POLICY_CONTENT: Record<
  Locale,
  {
    updatedAt: string;
    privacyHeading: string;
    privacyLead: string;
    termsHeading: string;
    termsLead: string;
    productionNote: string;
    sections: PolicySection[];
    termsSections: PolicySection[];
  }
> = {
  en: {
    updatedAt: "Last updated: 25 March 2026",
    privacyHeading: "Privacy notice",
    privacyLead:
      "This page explains how we process personal data when you contact Kanna Bikes, place an order, use the customer portal, or accept analytics cookies on the website.",
    productionNote:
      "Before using this text in production, replace the controller placeholders above with your real registered address, contact email, and phone number.",
    sections: [
      {
        paragraphs: [
          `The controller of your personal data is ${BUSINESS.legalName}, operating under the ${SITE_NAME} brand.`,
          `Registered address: ${BUSINESS.address}. Contact email: ${BUSINESS.email}. Contact phone: ${BUSINESS.phone}.`,
        ],
        title: "1. Controller details",
      },
      {
        bullets: [
          "Contact data you provide directly, such as your full name, email address, phone number, inquiry topic, and message.",
          "Order and fulfilment data when you continue with a project or purchase, such as billing details, shipping details, order items, payment status, and delivery information.",
          "Consent records, including whether you accepted or rejected analytics cookies and when that choice was stored in your browser.",
          "Technical and usage data collected through Google Analytics 4 only after consent, such as pages viewed, approximate location derived from network data, browser and device information, and important on-site interactions such as link and button clicks.",
        ],
        paragraphs: [
          "We only ask for data that is needed for the relevant stage of the relationship with you.",
        ],
        title: "2. Categories of personal data",
      },
      {
        bullets: [
          "To answer your inquiry and take steps at your request before entering into a contract: Article 6(1)(b) GDPR.",
          "To create, manage, and fulfil an order, arrange payment, delivery, warranty, and after-sales communication: Article 6(1)(b) and Article 6(1)(c) GDPR where legal obligations apply.",
          "To secure the website, keep records of consent choices, and defend or pursue legal claims where necessary: Article 6(1)(f) GDPR.",
          "To send optional marketing updates where you separately opt in: Article 6(1)(a) GDPR.",
          "To measure website traffic and interaction through Google Analytics 4: Article 6(1)(a) GDPR together with the cookie consent requirement under the ePrivacy rules.",
        ],
        title: "3. Purposes and legal bases",
      },
      {
        actionLabel: "Review cookie settings",
        bullets: [
          `We store one strictly necessary first-party cookie named ${ANALYTICS_CONSENT_COOKIE_NAME} for 180 days to remember whether you accepted or rejected analytics cookies.`,
          "If you accept analytics, the website loads Google Analytics 4 and Google may place cookies such as _ga and _ga_* on your device.",
          "Analytics is used only for aggregated measurement of traffic and key on-site interactions. This implementation does not enable advertising features or personalization signals.",
          "If you reject analytics, Google Analytics does not load on first visit and no analytics cookies are placed before consent.",
          "You can change your choice later through the cookie settings control in the footer or via the button below.",
        ],
        paragraphs: [
          "The consent banner uses a basic consent approach: analytics tags stay blocked until you actively allow them.",
        ],
        title: "4. Cookies and Google Analytics",
      },
      {
        bullets: [
          "Website hosting, infrastructure, security, and WordPress or ecommerce service providers used to operate the website.",
          "Email, payment, accounting, and shipping providers where needed to answer an inquiry or complete an order.",
          "Google Ireland Limited and Google LLC when analytics is enabled by consent.",
        ],
        paragraphs: [
          "Some service providers may process data outside the European Economic Area, including in the United States. When Google Analytics is enabled, Google may process personal data outside the EEA. Google states that Google LLC participates in the EU-U.S. Data Privacy Framework and also offers contractual transfer safeguards where applicable. You should verify your active processor list and contractual setup before production use.",
        ],
        title: "5. Recipients and transfers outside the EEA",
      },
      {
        bullets: [
          "Contact or quote data: for the time needed to answer the request, continue pre-contract discussions, and afterwards for the period necessary to protect against potential claims.",
          "Order, payment, invoice, and shipping data: for the period needed to perform the contract and for as long as accounting, tax, consumer, and limitation-period obligations require.",
          "Analytics data: for the retention period configured in the Google Analytics property by the controller.",
          `Your cookie preference record stored in ${ANALYTICS_CONSENT_COOKIE_NAME}: 180 days, unless you change it earlier.`,
        ],
        paragraphs: [
          "We keep personal data no longer than necessary for the purpose for which it was collected.",
        ],
        title: "6. Retention",
      },
      {
        bullets: [
          "Access your personal data and obtain a copy.",
          "Request rectification, erasure, or restriction of processing where the law allows it.",
          "Receive data portability where the processing is based on consent or contract and carried out by automated means.",
          "Object to processing based on legitimate interests.",
          "Withdraw consent at any time for analytics cookies or optional marketing without affecting processing carried out before withdrawal.",
          "Lodge a complaint with the competent supervisory authority, including the President of the Personal Data Protection Office (Prezes UODO) in Poland.",
        ],
        paragraphs: [
          "To exercise your rights, contact us using the controller details listed above.",
        ],
        title: "7. Your rights",
      },
    ],
    termsHeading: "Commercial terms",
    termsLead:
      "The points below describe the commercial framework for custom-bike enquiries and orders placed through the website.",
    termsSections: [
      {
        paragraphs: [
          "Sending a contact form or quote request does not create a binding purchase agreement and does not reserve a production slot unless we confirm that separately in writing.",
          "Quotes, lead times, availability statements, and configuration proposals are informational until they are confirmed in the relevant order stage.",
        ],
        title: "8. Enquiries and quotes",
      },
      {
        paragraphs: [
          "If your project proceeds, we may request a deposit before design or production work starts.",
          "Once production has started, the deposit becomes non-refundable.",
          "If you withdraw after work has already started, we may charge for the actual time already spent on your project at a rate of 35 EUR per hour.",
        ],
        title: "9. Deposit and build stage",
      },
      {
        paragraphs: [
          "If your order moves forward, we may process the data necessary for delivery, shipment, invoicing, and after-sales communication.",
          `Any personal order link or portal link sent by ${SITE_NAME} is intended only for the recipient and should not be shared publicly.`,
        ],
        title: "10. Delivery and customer portal",
      },
    ],
  },
  pl: {
    updatedAt: "Ostatnia aktualizacja: 25 marca 2026",
    privacyHeading: "Polityka prywatności",
    privacyLead:
      "Ta strona wyjaśnia, jak przetwarzamy dane osobowe, gdy kontaktujesz się z Kanna Bikes, składasz zamówienie, korzystasz z portalu klienta albo wyrażasz zgodę na analityczne cookies na stronie.",
    productionNote:
      "Przed użyciem tego tekstu produkcyjnie uzupełnij powyższe placeholdery prawdziwym adresem rejestrowym, adresem e-mail i numerem telefonu administratora.",
    sections: [
      {
        paragraphs: [
          `Administratorem Twoich danych osobowych jest ${BUSINESS.legalName}, działająca pod marką ${SITE_NAME}.`,
          `Adres rejestrowy: ${BUSINESS.address}. E-mail kontaktowy: ${BUSINESS.email}. Telefon kontaktowy: ${BUSINESS.phone}.`,
        ],
        title: "1. Dane administratora",
      },
      {
        bullets: [
          "Dane kontaktowe podane bezpośrednio przez Ciebie, takie jak imię i nazwisko, adres e-mail, numer telefonu, temat zapytania i treść wiadomości.",
          "Dane zamówienia i realizacji, gdy kontynuujesz projekt lub zakup, takie jak dane rozliczeniowe, dane wysyłkowe, pozycje zamówienia, status płatności i informacje o dostawie.",
          "Rejestr zgód, w tym informacja, czy zaakceptowałeś(-aś) lub odrzuciłeś(-aś) cookies analityczne oraz kiedy ten wybór został zapisany w przeglądarce.",
          "Dane techniczne i statystyczne zbierane przez Google Analytics 4 wyłącznie po wyrażeniu zgody, takie jak odsłony, przybliżona lokalizacja wynikająca z danych sieciowych, informacje o przeglądarce i urządzeniu oraz ważne interakcje w serwisie, w tym kliknięcia linków i przycisków.",
        ],
        paragraphs: [
          "Prosimy tylko o dane potrzebne na danym etapie relacji z Tobą.",
        ],
        title: "2. Kategorie danych osobowych",
      },
      {
        bullets: [
          "Aby odpowiedzieć na Twoje zapytanie i podjąć działania przed zawarciem umowy na Twoje żądanie: art. 6 ust. 1 lit. b RODO.",
          "Aby utworzyć, prowadzić i zrealizować zamówienie oraz obsłużyć płatność, dostawę, gwarancję i komunikację posprzedażową: art. 6 ust. 1 lit. b oraz art. 6 ust. 1 lit. c RODO, gdy mają zastosowanie obowiązki prawne.",
          "Aby zabezpieczać stronę, przechowywać informację o wyborze cookies i dochodzić lub bronić roszczeń, gdy jest to konieczne: art. 6 ust. 1 lit. f RODO.",
          "Aby wysyłać opcjonalne aktualizacje marketingowe, jeśli wyrazisz odrębną zgodę: art. 6 ust. 1 lit. a RODO.",
          "Aby mierzyć ruch i interakcje w serwisie za pomocą Google Analytics 4: art. 6 ust. 1 lit. a RODO w związku z wymogiem zgody na cookies wynikającym z zasad ePrivacy.",
        ],
        title: "3. Cele i podstawy prawne",
      },
      {
        actionLabel: "Sprawdź ustawienia cookies",
        bullets: [
          `Przechowujemy jeden niezbędny cookie first-party o nazwie ${ANALYTICS_CONSENT_COOKIE_NAME} przez 180 dni, aby zapamiętać, czy zaakceptowałeś(-aś), czy odrzuciłeś(-aś) cookies analityczne.`,
          "Jeśli zaakceptujesz analitykę, strona załaduje Google Analytics 4, a Google może zapisać na Twoim urządzeniu cookies takie jak _ga i _ga_*.",
          "Analityka służy wyłącznie do zagregowanego pomiaru ruchu i ważnych interakcji w serwisie. W tej integracji nie włączamy funkcji reklamowych ani sygnałów personalizacji.",
          "Jeśli odrzucisz analitykę, Google Analytics nie załaduje się przy pierwszej wizycie i przed zgodą nie zostaną zapisane cookies analityczne.",
          "Swoją decyzję możesz później zmienić w ustawieniach cookies w stopce albo przyciskiem poniżej.",
        ],
        paragraphs: [
          "Baner działa w modelu basic consent: tagi analityczne pozostają zablokowane, dopóki aktywnie ich nie zaakceptujesz.",
        ],
        title: "4. Cookies i Google Analytics",
      },
      {
        bullets: [
          "Dostawcy hostingu, infrastruktury, bezpieczeństwa oraz usług WordPress lub ecommerce potrzebnych do działania serwisu.",
          "Dostawcy poczty e-mail, płatności, księgowości i dostawy, jeśli jest to potrzebne do odpowiedzi na zapytanie lub realizacji zamówienia.",
          "Google Ireland Limited oraz Google LLC, gdy analityka zostanie włączona na podstawie zgody.",
        ],
        paragraphs: [
          "Część dostawców może przetwarzać dane poza Europejskim Obszarem Gospodarczym, w tym w Stanach Zjednoczonych. Gdy analityka jest włączona, Google może przetwarzać dane osobowe poza EOG. Google deklaruje, że Google LLC uczestniczy w EU-U.S. Data Privacy Framework i stosuje także odpowiednie zabezpieczenia umowne tam, gdzie jest to wymagane. Przed użyciem produkcyjnym zweryfikuj aktualną listę procesorów i konfigurację umowną.",
        ],
        title: "5. Odbiorcy danych i transfery poza EOG",
      },
      {
        bullets: [
          "Dane kontaktowe lub ofertowe: przez czas potrzebny do odpowiedzi na zapytanie, prowadzenia rozmów przedumownych, a następnie przez okres niezbędny do ochrony przed ewentualnymi roszczeniami.",
          "Dane zamówienia, płatności, faktury i wysyłki: przez okres potrzebny do wykonania umowy oraz tak długo, jak wymagają tego obowiązki księgowe, podatkowe, konsumenckie i terminy przedawnienia.",
          "Dane analityczne: przez okres retencji ustawiony przez administratora we właściwościach Google Analytics.",
          `Informacja o Twoim wyborze cookies zapisana w ${ANALYTICS_CONSENT_COOKIE_NAME}: 180 dni, chyba że zmienisz ustawienie wcześniej.`,
        ],
        paragraphs: [
          "Nie przechowujemy danych osobowych dłużej, niż jest to potrzebne do celu, dla którego zostały zebrane.",
        ],
        title: "6. Okres przechowywania",
      },
      {
        bullets: [
          "Uzyskać dostęp do swoich danych osobowych i kopię tych danych.",
          "Żądać sprostowania, usunięcia lub ograniczenia przetwarzania tam, gdzie pozwala na to prawo.",
          "Skorzystać z prawa do przenoszenia danych, gdy przetwarzanie opiera się na zgodzie lub umowie i odbywa się w sposób zautomatyzowany.",
          "Wnieść sprzeciw wobec przetwarzania opartego na prawnie uzasadnionym interesie.",
          "W każdej chwili wycofać zgodę na analityczne cookies lub opcjonalny marketing bez wpływu na zgodność z prawem wcześniejszego przetwarzania.",
          "Złożyć skargę do właściwego organu nadzorczego, w tym do Prezesa Urzędu Ochrony Danych Osobowych.",
        ],
        paragraphs: [
          "Aby skorzystać ze swoich praw, skontaktuj się z nami, używając danych administratora wskazanych powyżej.",
        ],
        title: "7. Twoje prawa",
      },
    ],
    termsHeading: "Warunki handlowe",
    termsLead:
      "Poniższe punkty opisują handlowe zasady dotyczące zapytań i zamówień custom-bike składanych przez stronę.",
    termsSections: [
      {
        paragraphs: [
          "Wysłanie formularza kontaktowego lub zapytania ofertowego nie tworzy wiążącej umowy sprzedaży i nie rezerwuje slotu produkcyjnego, chyba że potwierdzimy to później osobno na piśmie.",
          "Wyceny, terminy, informacje o dostępności i propozycje konfiguracji mają charakter informacyjny, dopóki nie zostaną potwierdzone na odpowiednim etapie zamówienia.",
        ],
        title: "8. Zapytania i wyceny",
      },
      {
        paragraphs: [
          "Jeśli projekt będzie kontynuowany, możemy poprosić o wpłatę depozytu przed rozpoczęciem prac projektowych lub produkcyjnych.",
          "Po rozpoczęciu produkcji depozyt staje się bezzwrotny.",
          "Jeśli zrezygnujesz po rozpoczęciu prac, możemy obciążyć Cię kosztem rzeczywiście poświęconego czasu na projekt w stawce 35 EUR za godzinę.",
        ],
        title: "9. Depozyt i etap budowy",
      },
      {
        paragraphs: [
          "Jeśli zamówienie przejdzie dalej, możemy przetwarzać dane potrzebne do dostawy, wysyłki, fakturowania i komunikacji posprzedażowej.",
          `Każdy indywidualny link do zamówienia lub portalu wysłany przez ${SITE_NAME} jest przeznaczony wyłącznie dla odbiorcy i nie powinien być udostępniany publicznie.`,
        ],
        title: "10. Dostawa i portal klienta",
      },
    ],
  },
};

export function meta({ location }: Route.MetaArgs) {
  const locale = getLocaleFromPath(location.pathname);
  const messages = getMessages(locale);
  return buildLocalizedMeta({
    description: messages.meta.legal.description,
    locale,
    pathname: location.pathname,
    title: formatPageTitle(messages.meta.legal.title),
  });
}

function PolicySectionBlock({
  section,
}: {
  section: PolicySection;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-[var(--kanna-ink)]">{section.title}</h2>
      {section.paragraphs?.map((paragraph) => (
        <p key={paragraph} className="mt-3">
          {paragraph}
        </p>
      ))}
      {section.bullets ? (
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {section.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      ) : null}
      {section.actionLabel ? (
        <button
          type="button"
          data-analytics-ignore="true"
          onClick={() => window.dispatchEvent(new Event(COOKIE_PREFERENCES_EVENT))}
          className="mt-4 inline-flex items-center justify-center rounded-xl border border-stone-300 px-4 py-3 text-sm font-semibold text-[var(--kanna-ink)] transition hover:border-black/70"
        >
          {section.actionLabel}
        </button>
      ) : null}
    </section>
  );
}

export default function PrivacyTermsPage() {
  const locale = useLocale();
  const messages = useMessages();
  const content = POLICY_CONTENT[locale];

  return (
    <PageShell>
      <PageContainer>
        <div className="max-w-4xl rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm md:p-8">
          <SectionPill>{messages.legal.pill}</SectionPill>
          <h1 className="page-heading mt-3 text-[2.35rem] leading-[0.88] text-[var(--kanna-ink)] md:text-[3.8rem]">
            {messages.legal.title}
          </h1>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            {content.updatedAt}
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-stone-600">
            {content.privacyLead}
          </p>

          <div className="mt-8 space-y-8 text-sm leading-6 text-stone-700">
            <section>
              <h2 className="text-xl font-semibold text-[var(--kanna-ink)]">
                {content.privacyHeading}
              </h2>
            </section>

            {content.sections.map((section) => (
              <PolicySectionBlock key={section.title} section={section} />
            ))}

            <section>
              <h2 className="text-xl font-semibold text-[var(--kanna-ink)]">
                {content.termsHeading}
              </h2>
              <p className="mt-3">{content.termsLead}</p>
            </section>

            {content.termsSections.map((section) => (
              <PolicySectionBlock key={section.title} section={section} />
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            {content.productionNote}
          </div>
        </div>
      </PageContainer>
    </PageShell>
  );
}
