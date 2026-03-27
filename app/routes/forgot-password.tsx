import { useMemo, useState, type FormEvent } from "react";
import { useLocation } from "react-router";
import { ArchivoInkBleed } from "~/components/archivo-ink-bleed";
import { Button } from "~/components/button";
import { InputField } from "~/components/form-field";
import { LocalizedLink } from "~/components/localized-link";
import { PageContainer, PageShell } from "~/components/page-container";
import { SectionPill } from "~/components/section-pill";
import { useLocale, useMessages } from "~/components/locale-provider";
import { requestCustomerPasswordReset } from "~/lib/customer-account";
import { buildLocalizedMeta, getLocaleFromPath, getMessages } from "~/lib/i18n";
import { formatPageTitle } from "~/root";
import type { Route } from "./+types/forgot-password";

export function meta({ location }: Route.MetaArgs) {
  const locale = getLocaleFromPath(location.pathname);
  const messages = getMessages(locale);

  return buildLocalizedMeta({
    description: messages.account.forgotPasswordDescription,
    locale,
    pathname: location.pathname,
    robots: "noindex,follow",
    title: formatPageTitle(messages.account.forgotPasswordTitle),
  });
}

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const location = useLocation();
  const messages = useMessages();
  const redirectTo = new URLSearchParams(location.search).get("redirect");
  const signInPath = useMemo(() => {
    if (!redirectTo) {
      return "/sign-in";
    }

    return `/sign-in?redirect=${encodeURIComponent(redirectTo)}`;
  }, [redirectTo]);
  const [loginValue, setLoginValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);
    setError(null);

    try {
      await requestCustomerPasswordReset({
        locale,
        login: loginValue,
      });
      setStatus(messages.account.forgotPasswordSuccess);
    } catch (nextError) {
      setError(
        nextError instanceof Error && nextError.message
          ? nextError.message
          : messages.account.forgotPasswordError,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell>
      <PageContainer>
        <SectionPill>{messages.account.pill}</SectionPill>
        <h1 className="mt-4 max-w-3xl">
          <ArchivoInkBleed
            className="block w-full"
            color="var(--kanna-ink)"
            fontSize={150}
            lines={[messages.account.forgotPasswordTitle]}
          />
        </h1>

        <div className="mx-auto mt-10 max-w-3xl border border-black/90 bg-white p-6 md:p-8">
          <p className="max-w-2xl text-base leading-relaxed text-[var(--kanna-ink)]">
            {messages.account.forgotPasswordDescription}
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                {messages.account.emailLabel}
              </span>
              <InputField
                autoComplete="email"
                className="text-base"
                name="login"
                type="text"
                value={loginValue}
                onChange={(event) => setLoginValue(event.currentTarget.value)}
              />
            </label>

            {status ? (
              <p className="text-sm font-medium text-[var(--kanna-ink)]">{status}</p>
            ) : null}

            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <LocalizedLink
                to={signInPath}
                className="text-sm font-semibold text-[var(--kanna-ink)] transition hover:text-black"
              >
                {messages.account.signInTitle}
              </LocalizedLink>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex min-h-14 w-full items-center justify-center rounded-none text-base sm:w-auto sm:min-w-[15rem]"
              >
                {messages.account.forgotPasswordSubmit}
              </Button>
            </div>
          </form>
        </div>
      </PageContainer>
    </PageShell>
  );
}
