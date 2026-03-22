import { Link } from "react-router";
import { useState } from "react";
import { chevronDownOutline } from "ionicons/icons";
import type { Route } from "./+types/contact";
import { SITE_NAME } from "~/root";

const DEFAULT_TOPIC = "Quote request";
const DEFAULT_WORDPRESS_API_BASE =
  import.meta.env.VITE_WORDPRESS_API_BASE_URL ??
  "http://localhost/wp-json/kanna/v1";
const DEFAULT_CONTACT_ENDPOINT = `${DEFAULT_WORDPRESS_API_BASE.replace(/\/$/, "")}/contact`;

function validateContactForm(values: {
  email: string;
  fullName: string;
  message: string;
  phoneNumber: string;
  privacyAccepted: boolean;
}) {
  const errors: Partial<Record<keyof typeof values, string>> = {};

  if (values.fullName.trim().length < 2) {
    errors.fullName = "Enter full name.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (values.phoneNumber.replace(/[^\d+]/g, "").length < 7) {
    errors.phoneNumber = "Enter a valid phone number.";
  }

  if (values.message.trim().length < 20) {
    errors.message = "Enter at least 20 characters.";
  }

  if (!values.privacyAccepted) {
    errors.privacyAccepted = "You must confirm the privacy information.";
  }

  return errors;
}

export function meta({}: Route.MetaArgs) {
  return [{ title: `${SITE_NAME} | Contact` }];
}

export default function ContactPage() {
  const [formValues, setFormValues] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    topic: DEFAULT_TOPIC,
    message: "",
    privacyAccepted: false,
    marketingAccepted: false,
    website: "",
  });
  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errors = validateContactForm(formValues);
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
          phone_number: formValues.phoneNumber,
          topic: formValues.topic,
          message: formValues.message,
          privacy_accepted: formValues.privacyAccepted,
          marketing_accepted: formValues.marketingAccepted,
          website: formValues.website,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setSubmitError(
          payload?.message ??
            "We could not send your message right now. Please try again.",
        );
        return;
      }

      setIsSubmitted(true);
    } catch {
      setSubmitError(
        "We could not reach the contact service. Please try again in a moment.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-4xl">
        <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            Contact
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Request a quote
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
            Send the details of your project and we will get back to you about a
            custom quote and the next steps for your build.
          </p>

          {isSubmitted ? (
            <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Message received
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Your inquiry has been sent successfully. We&apos;ve sent a
                confirmation email to your address. We will reply as quickly as
                possible, usually within 48 hours. Thank you for your interest.
              </p>
              <Link
                to="/"
                className="mt-4 inline-flex text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-900"
              >
                Back to homepage
              </Link>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="hidden" aria-hidden="true">
                  <span>Website</span>
                  <input
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
                    Full name
                  </span>
                  <input
                    type="text"
                    value={formValues.fullName}
                    onChange={(event) =>
                      setFormValues((prev) => ({
                        ...prev,
                        fullName: event.target.value,
                      }))
                    }
                    onFocus={() => setShowValidation(false)}
                    className={`w-full rounded-xl bg-white px-4 py-3 text-slate-900 outline-none transition focus:ring-2 ${
                      showValidation && errors.fullName
                        ? "border border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border border-slate-300 focus:border-yellow-400 focus:ring-yellow-200"
                    }`}
                  />
                  {showValidation && errors.fullName ? (
                    <p className="mt-2 text-sm text-red-600">{errors.fullName}</p>
                  ) : null}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Email
                  </span>
                  <input
                    type="email"
                    value={formValues.email}
                    onChange={(event) =>
                      setFormValues((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    onFocus={() => setShowValidation(false)}
                    className={`w-full rounded-xl bg-white px-4 py-3 text-slate-900 outline-none transition focus:ring-2 ${
                      showValidation && errors.email
                        ? "border border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border border-slate-300 focus:border-yellow-400 focus:ring-yellow-200"
                    }`}
                  />
                  {showValidation && errors.email ? (
                    <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                  ) : null}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Phone number
                  </span>
                  <input
                    type="tel"
                    value={formValues.phoneNumber}
                    onChange={(event) =>
                      setFormValues((prev) => ({
                        ...prev,
                        phoneNumber: event.target.value,
                      }))
                    }
                    onFocus={() => setShowValidation(false)}
                    className={`w-full rounded-xl bg-white px-4 py-3 text-slate-900 outline-none transition focus:ring-2 ${
                      showValidation && errors.phoneNumber
                        ? "border border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border border-slate-300 focus:border-yellow-400 focus:ring-yellow-200"
                    }`}
                  />
                  {showValidation && errors.phoneNumber ? (
                    <p className="mt-2 text-sm text-red-600">{errors.phoneNumber}</p>
                  ) : null}
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Topic
                  </span>
                  <div className="relative">
                    <select
                      value={formValues.topic}
                      onChange={(event) =>
                        setFormValues((prev) => ({
                          ...prev,
                          topic: event.target.value,
                        }))
                      }
                      className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                    >
                      <option value="Quote request">Quote request</option>
                      <option value="General question">General question</option>
                    </select>
                    <ion-icon
                      icon={chevronDownOutline}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-500"
                      aria-hidden="true"
                    />
                  </div>
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Message
                  </span>
                  <textarea
                    value={formValues.message}
                    onChange={(event) =>
                      setFormValues((prev) => ({
                        ...prev,
                        message: event.target.value,
                      }))
                    }
                    onFocus={() => setShowValidation(false)}
                    rows={7}
                    className={`w-full rounded-xl bg-white px-4 py-3 text-slate-900 outline-none transition focus:ring-2 ${
                      showValidation && errors.message
                        ? "border border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border border-slate-300 focus:border-yellow-400 focus:ring-yellow-200"
                    }`}
                  />
                  {showValidation && errors.message ? (
                    <p className="mt-2 text-sm text-red-600">{errors.message}</p>
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
                    I confirm that I have read the{" "}
                    <Link
                      to="/privacy-terms"
                      className="font-medium text-slate-900 underline underline-offset-2"
                    >
                      privacy information and terms
                    </Link>{" "}
                    and want Kanna Bikes to contact me regarding my quote
                    request. My data will be processed for pre-contract
                    communication and preparation of an offer.
                  </span>
                </label>
                {showValidation && errors.privacyAccepted ? (
                  <p className="text-sm text-red-600">{errors.privacyAccepted}</p>
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
                  <span>
                    I agree to receive future marketing updates by email. This
                    consent is optional and can be withdrawn at any time.
                  </span>
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
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {isSubmitting ? "Sending..." : "Send request"}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
