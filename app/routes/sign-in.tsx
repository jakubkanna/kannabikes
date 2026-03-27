import { useMemo } from "react";
import { useLocation } from "react-router";
import { ArchivoInkBleed } from "~/components/archivo-ink-bleed";
import { CustomerSignInForm } from "~/components/customer-sign-in-form";
import { PageContainer, PageShell } from "~/components/page-container";
import { SectionPill } from "~/components/section-pill";
import { useLocale, useMessages } from "~/components/locale-provider";
import { getFrontendAccountRedirect } from "~/lib/auth";
import { buildLocalizedMeta, getLocaleFromPath, getMessages } from "~/lib/i18n";
import { formatPageTitle } from "~/root";
import type { Route } from "./+types/sign-in";

export function meta({ location }: Route.MetaArgs) {
  const locale = getLocaleFromPath(location.pathname);
  const messages = getMessages(locale);

  return buildLocalizedMeta({
    description: messages.account.signInDescription,
    locale,
    pathname: location.pathname,
    robots: "noindex,follow",
    title: formatPageTitle(messages.account.signInTitle),
  });
}

export default function SignInPage() {
  const locale = useLocale();
  const location = useLocation();
  const messages = useMessages();
  const redirectTo = new URLSearchParams(location.search).get("redirect");
  const finalRedirectUrl = useMemo(
    () =>
      getFrontendAccountRedirect({
        locale,
        redirectTo,
      }),
    [locale, redirectTo],
  );

  return (
    <PageShell>
      <PageContainer>
        <SectionPill>{messages.account.pill}</SectionPill>
        <h1 className="mt-4 max-w-3xl">
          <ArchivoInkBleed
            className="block w-full"
            color="var(--kanna-ink)"
            fontSize={150}
            lines={[messages.account.signInTitle]}
          />
        </h1>

        <div className="mx-auto mt-10 max-w-3xl border border-black/90 bg-white p-6 md:p-8">
          <CustomerSignInForm
            locale={locale}
            redirectTo={redirectTo}
            variant="page"
            onSuccess={() => {
              window.location.assign(finalRedirectUrl);
            }}
          />
        </div>
      </PageContainer>
    </PageShell>
  );
}
