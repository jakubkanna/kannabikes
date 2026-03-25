import { useState } from "react";
import type { Route } from "./+types/contact";
import { ArchivoInkBleed } from "~/components/archivo-ink-bleed";
import { PageContainer, PageShell } from "~/components/page-container";
import {
  InputField,
  SelectField,
  TextareaField,
} from "~/components/form-field";
import { LocalizedLink } from "~/components/localized-link";
import { useLocale, useMessages } from "~/components/locale-provider";
import { SectionPill } from "~/components/section-pill";
import { formatPageTitle } from "~/root";
import { buildLocalizedMeta, getLocaleFromPath, getMessages } from "~/lib/i18n";

const DEFAULT_WORDPRESS_API_BASE =
  import.meta.env.VITE_WORDPRESS_API_BASE_URL ??
  "http://localhost/wp-json/kanna/v1";
const DEFAULT_CONTACT_ENDPOINT = `${
  import.meta.env.DEV
    ? "/wp-json/kanna/v1"
    : DEFAULT_WORDPRESS_API_BASE.replace(/\/$/, "")
}/contact`;

function validateContactForm(
  values: {
    email: string;
    fullName: string;
    message: string;
    phoneNumber: string;
    privacyAccepted: boolean;
  },
  routeMessages: ReturnType<typeof useMessages>,
) {
  const errors: Partial<Record<keyof typeof values, string>> = {};

  if (values.fullName.trim().length < 2) {
    errors.fullName = routeMessages.contact.errors.fullName;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = routeMessages.contact.errors.email;
  }

  if (values.phoneNumber.replace(/[^\d+]/g, "").length < 7) {
    errors.phoneNumber = routeMessages.contact.errors.phoneNumber;
  }

  if (values.message.trim().length < 20) {
    errors.message = routeMessages.contact.errors.message;
  }

  if (!values.privacyAccepted) {
    errors.privacyAccepted = routeMessages.contact.errors.privacyAccepted;
  }

  return errors;
}

export function meta({ location }: Route.MetaArgs) {
  const locale = getLocaleFromPath(location.pathname);
  const messages = getMessages(locale);
  return buildLocalizedMeta({
    description: messages.meta.contact.description,
    locale,
    pathname: location.pathname,
    title: formatPageTitle(messages.meta.contact.title),
  });
}

export default function ContactPage() {
  const locale = useLocale();
  const messages = useMessages();
  const [formValues, setFormValues] = useState<{
    email: string;
    fullName: string;
    marketingAccepted: boolean;
    message: string;
    phoneNumber: string;
    privacyAccepted: boolean;
    topic: string;
    website: string;
  }>({
    fullName: "",
    email: "",
    phoneNumber: "",
    topic: messages.contact.topicOptions.quote,
    message: "",
    privacyAccepted: false,
    marketingAccepted: false,
    website: "",
  });
  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errors = validateContactForm(formValues, messages);
  const hasErrors = Object.keys(errors).length > 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowValidation(true);
    setSubmitError(null);

    if (hasErrors) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(DEFAULT_CONTACT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: formValues.fullName,
          email: formValues.email,
          locale,
          phone_number: formValues.phoneNumber,
          topic: formValues.topic,
          message: formValues.message,
          privacy_accepted: formValues.privacyAccepted,
          marketing_accepted: formValues.marketingAccepted,
          website: formValues.website,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        setSubmitError(payload?.message ?? messages.contact.errors.submit);
        return;
      }

      setIsSubmitted(true);
    } catch {
      setSubmitError(messages.contact.errors.reachService);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell>
      <PageContainer>
        <section>
          <SectionPill>{messages.contact.pill}</SectionPill>
          <h1 className="mt-4 max-w-4xl">
            <ArchivoInkBleed
              className="block w-full"
              color="var(--kanna-ink)"
              fontSize={160}
              lines={[...messages.contact.headingLines]}
            />
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
            {messages.contact.description}
          </p>

          {isSubmitted ? (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-900">
                {messages.contact.successTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {messages.contact.successBody}
              </p>
              <LocalizedLink
                to="/"
                className="mt-4 inline-flex text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-900"
              >
                {messages.contact.backHome}
              </LocalizedLink>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="hidden" aria-hidden="true">
                  <span>Website</span>
                  <InputField
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={formValues.website}
                    onChange={(event) =>
                      setFormValues((prev) => ({
                        ...prev,
                        website: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    {messages.contact.fullName}
                  </span>
                  <InputField
                    type="text"
                    value={formValues.fullName}
                    onChange={(event) =>
                      setFormValues((prev) => ({
                        ...prev,
                        fullName: event.target.value,
                      }))
                    }
                    onFocus={() => setShowValidation(false)}
                    hasError={showValidation && Boolean(errors.fullName)}
                  />
                  {showValidation && errors.fullName ? (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.fullName}
                    </p>
                  ) : null}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    {messages.contact.email}
                  </span>
                  <InputField
                    type="email"
                    value={formValues.email}
                    onChange={(event) =>
                      setFormValues((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    onFocus={() => setShowValidation(false)}
                    hasError={showValidation && Boolean(errors.email)}
                  />
                  {showValidation && errors.email ? (
                    <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                  ) : null}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    {messages.contact.phoneNumber}
                  </span>
                  <InputField
                    type="tel"
                    value={formValues.phoneNumber}
                    onChange={(event) =>
                      setFormValues((prev) => ({
                        ...prev,
                        phoneNumber: event.target.value,
                      }))
                    }
                    onFocus={() => setShowValidation(false)}
                    hasError={showValidation && Boolean(errors.phoneNumber)}
                  />
                  {showValidation && errors.phoneNumber ? (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.phoneNumber}
                    </p>
                  ) : null}
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    {messages.contact.topic}
                  </span>
                  <div className="relative">
                    <SelectField
                      value={formValues.topic}
                      onChange={(event) =>
                        setFormValues((prev) => ({
                          ...prev,
                          topic: event.target.value,
                        }))
                      }
                      className="appearance-none pr-12"
                    >
                      <option value={messages.contact.topicOptions.quote}>
                        {messages.contact.topicOptions.quote}
                      </option>
                      <option value={messages.contact.topicOptions.general}>
                        {messages.contact.topicOptions.general}
                      </option>
                    </SelectField>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-slate-500"
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    {messages.contact.message}
                  </span>
                  <TextareaField
                    value={formValues.message}
                    onChange={(event) =>
                      setFormValues((prev) => ({
                        ...prev,
                        message: event.target.value,
                      }))
                    }
                    onFocus={() => setShowValidation(false)}
                    rows={7}
                    hasError={showValidation && Boolean(errors.message)}
                  />
                  {showValidation && errors.message ? (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.message}
                    </p>
                  ) : null}
                </label>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={formValues.privacyAccepted}
                    onChange={(event) =>
                      setFormValues((prev) => ({
                        ...prev,
                        privacyAccepted: event.target.checked,
                      }))
                    }
                    onFocus={() => setShowValidation(false)}
                    className="mt-0.5"
                  />
                  <span>
                    {
                      messages.contact.privacyConsent.split(
                        messages.contact.privacyLink,
                      )[0]
                    }
                    <LocalizedLink
                      to="/privacy-terms"
                      className="font-medium text-slate-900 underline underline-offset-2"
                    >
                      {messages.contact.privacyLink}
                    </LocalizedLink>
                    {
                      messages.contact.privacyConsent.split(
                        messages.contact.privacyLink,
                      )[1]
                    }
                  </span>
                </label>
                {showValidation && errors.privacyAccepted ? (
                  <p className="text-sm text-red-600">
                    {errors.privacyAccepted}
                  </p>
                ) : null}

                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={formValues.marketingAccepted}
                    onChange={(event) =>
                      setFormValues((prev) => ({
                        ...prev,
                        marketingAccepted: event.target.checked,
                      }))
                    }
                    className="mt-0.5"
                  />
                  <span>{messages.contact.marketingConsent}</span>
                </label>
              </div>

              {submitError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {submitError}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-xl bg-[var(--kanna-ink)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-black"
              >
                {isSubmitting
                  ? messages.contact.sending
                  : messages.contact.send}
              </button>
            </form>
          )}
        </section>
      </PageContainer>
    </PageShell>
  );
}
