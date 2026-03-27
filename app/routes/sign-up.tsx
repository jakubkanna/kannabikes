import { useMemo, useState, type FormEvent } from "react";
import { useLocation } from "react-router";
import { AccountRegistrationConsents } from "~/components/account-registration-consents";
import { ArchivoInkBleed } from "~/components/archivo-ink-bleed";
import { Button } from "~/components/button";
import { InputField } from "~/components/form-field";
import { LocalizedLink } from "~/components/localized-link";
import { GoogleAuthButton } from "~/components/google-auth-button";
import { PageContainer, PageShell } from "~/components/page-container";
import { SectionPill } from "~/components/section-pill";
import { useLocale, useMessages } from "~/components/locale-provider";
import {
  getFrontendAccountRedirect,
  getGoogleAuthUrl,
  normalizeFrontendRedirectPath,
} from "~/lib/auth";
import { registerCustomerAccount } from "~/lib/customer-account";
import { buildLocalizedMeta, getLocaleFromPath, getMessages } from "~/lib/i18n";
import { formatPageTitle } from "~/root";
import type { Route } from "./+types/sign-up";

export function meta({ location }: Route.MetaArgs) {
  const locale = getLocaleFromPath(location.pathname);
  const messages = getMessages(locale);

  return buildLocalizedMeta({
    description: messages.account.signUpDescription,
    locale,
    pathname: location.pathname,
    robots: "noindex,follow",
    title: formatPageTitle(messages.account.signUpTitle),
  });
}

type FormState = {
  confirmPassword: string;
  email: string;
  firstName: string;
  lastName: string;
  marketingAccepted: boolean;
  password: string;
  privacyAccepted: boolean;
};

const INITIAL_FORM_STATE: FormState = {
  confirmPassword: "",
  email: "",
  firstName: "",
  lastName: "",
  marketingAccepted: false,
  password: "",
  privacyAccepted: false,
};

export default function SignUpPage() {
  const locale = useLocale();
  const location = useLocation();
  const messages = useMessages();
  const redirectTo = new URLSearchParams(location.search).get("redirect");
  const normalizedRedirectTo = useMemo(
    () => normalizeFrontendRedirectPath(redirectTo),
    [redirectTo],
  );
  const finalRedirectUrl = useMemo(
    () =>
      getFrontendAccountRedirect({
        locale,
        redirectTo,
      }),
    [locale, redirectTo],
  );
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const googleAuthUrl = useMemo(
    () =>
      getGoogleAuthUrl({
        intent: "sign-up",
        locale,
        marketingAccepted: formState.marketingAccepted,
        privacyAccepted: formState.privacyAccepted,
        redirectTo,
      }),
    [formState.marketingAccepted, formState.privacyAccepted, locale, redirectTo],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (formState.password.length < 8) {
      setErrorMessage(messages.account.passwordMinLength);
      return;
    }

    if (formState.password !== formState.confirmPassword) {
      setErrorMessage(messages.account.passwordMismatch);
      return;
    }

    if (!formState.privacyAccepted) {
      setErrorMessage(messages.account.registrationPrivacyRequired);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await registerCustomerAccount({
        email: formState.email,
        firstName: formState.firstName,
        lastName: formState.lastName,
        locale,
        marketingAccepted: formState.marketingAccepted,
        password: formState.password,
        privacyAccepted: formState.privacyAccepted,
      });

      setSuccessMessage(messages.account.registrationSuccess);
      window.location.assign(finalRedirectUrl);
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : messages.account.signUpError,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField<Key extends keyof FormState>(
    key: Key,
    value: FormState[Key],
  ) {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
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
            lines={[messages.account.signUpTitle]}
          />
        </h1>

        <div className="mx-auto mt-10 max-w-3xl border border-black/90 bg-white p-6 md:p-8">
          <p className="max-w-2xl text-base leading-relaxed text-[var(--kanna-ink)]">
            {messages.account.signUpDescription}
          </p>

          <form className="mt-8" onSubmit={handleSubmit}>
            <div className="grid gap-6 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                  {messages.account.firstNameLabel}
                </span>
                <InputField
                  required
                  autoComplete="given-name"
                  className="text-base"
                  name="firstName"
                  value={formState.firstName}
                  onChange={(event) =>
                    updateField("firstName", event.currentTarget.value)
                  }
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                  {messages.account.lastNameLabel}
                </span>
                <InputField
                  required
                  autoComplete="family-name"
                  className="text-base"
                  name="lastName"
                  value={formState.lastName}
                  onChange={(event) =>
                    updateField("lastName", event.currentTarget.value)
                  }
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                  {messages.account.emailLabel}
                </span>
                <InputField
                  required
                  autoComplete="email"
                  className="text-base"
                  name="email"
                  type="email"
                  value={formState.email}
                  onChange={(event) =>
                    updateField("email", event.currentTarget.value)
                  }
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                  {messages.account.passwordLabel}
                </span>
                <InputField
                  required
                  autoComplete="new-password"
                  className="text-base"
                  minLength={8}
                  name="password"
                  type="password"
                  value={formState.password}
                  onChange={(event) =>
                    updateField("password", event.currentTarget.value)
                  }
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                  {messages.account.confirmPasswordLabel}
                </span>
                <InputField
                  required
                  autoComplete="new-password"
                  className="text-base"
                  minLength={8}
                  name="confirmPassword"
                  type="password"
                  value={formState.confirmPassword}
                  onChange={(event) =>
                    updateField("confirmPassword", event.currentTarget.value)
                  }
                />
              </label>
            </div>

            <div className="mt-6">
              <AccountRegistrationConsents
                errorMessage={
                  errorMessage === messages.account.registrationPrivacyRequired
                    ? errorMessage
                    : null
                }
                marketingAccepted={formState.marketingAccepted}
                onMarketingAcceptedChange={(accepted) =>
                  updateField("marketingAccepted", accepted)
                }
                onPrivacyAcceptedChange={(accepted) =>
                  updateField("privacyAccepted", accepted)
                }
                privacyAccepted={formState.privacyAccepted}
              />
            </div>

            {errorMessage ? (
              errorMessage !== messages.account.registrationPrivacyRequired ? (
              <p className="mt-5 text-sm font-medium text-red-600">
                {errorMessage}
              </p>
              ) : null
            ) : null}

            {successMessage ? (
              <p className="mt-5 text-sm font-medium text-[var(--kanna-ink)]">
                {successMessage}
              </p>
            ) : null}

            <div className="mt-10">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex min-h-14 w-full items-center justify-center rounded-none text-base"
              >
                {messages.account.createAccount}
              </Button>
            </div>
          </form>

          <div className="mt-10 flex items-center gap-6">
            <div className="h-px flex-1 bg-black/15" />
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--kanna-ink)]">
              {messages.account.or}
            </span>
            <div className="h-px flex-1 bg-black/15" />
          </div>

          <div className="mt-10">
            <GoogleAuthButton
              href={googleAuthUrl}
              className="flex min-h-14 w-full justify-center text-base"
              onClick={(event) => {
                if (formState.privacyAccepted) {
                  return;
                }

                event.preventDefault();
                setErrorMessage(messages.account.registrationPrivacyRequired);
              }}
            >
              {messages.account.continueWithGoogle}
            </GoogleAuthButton>
          </div>

          <p className="mt-10 text-sm text-[var(--kanna-ink)]">
            {messages.account.alreadyHaveAccount}{" "}
            <LocalizedLink
              to={
                normalizedRedirectTo
                  ? `/sign-in?redirect=${encodeURIComponent(normalizedRedirectTo)}`
                  : "/sign-in"
              }
              className="font-semibold underline underline-offset-2 transition hover:text-black"
            >
              {messages.account.signInTitle}
            </LocalizedLink>
          </p>
        </div>
      </PageContainer>
    </PageShell>
  );
}
