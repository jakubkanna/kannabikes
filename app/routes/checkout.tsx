import { useEffect, useState } from "react";

import type { Route } from "./+types/checkout";
import { LocalizedLink } from "~/components/localized-link";
import {
  InputField,
  SelectField,
  TextareaField,
} from "~/components/form-field";
import { useLocale, useMessages } from "~/components/locale-provider";
import { SectionPill } from "~/components/section-pill";
import {
  buildLocalizedMeta,
  getLocaleFromPath,
  getMessages,
} from "~/lib/i18n";
import {
  fetchStoreCart,
  submitStoreCheckout,
  type StoreCart,
} from "~/lib/store-api";
import { formatPageTitle } from "~/root";

export function meta({ location }: Route.MetaArgs) {
  const locale = getLocaleFromPath(location.pathname);
  const messages = getMessages(locale);
  return buildLocalizedMeta({
    description: messages.meta.checkout.description,
    locale,
    pathname: location.pathname,
    title: formatPageTitle(messages.meta.checkout.title),
  });
}

export default function CheckoutPage() {
  const locale = useLocale();
  const messages = useMessages();
  const [cart, setCart] = useState<StoreCart | null>(null);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({
    address1: "",
    city: "",
    country: "PL",
    email: "",
    firstName: "",
    lastName: "",
    note: "",
    phone: "",
    postcode: "",
  });

  useEffect(() => {
    let cancelled = false;

    const loadCart = async () => {
      setIsLoadingCart(true);
      try {
        const nextCart = await fetchStoreCart(locale);
        if (!cancelled) {
          setCart(nextCart);
        }
      } catch (error) {
        if (!cancelled) {
          setSubmitError(error instanceof Error ? error.message : null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCart(false);
        }
      }
    };

    void loadCart();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitMessage(null);
    setIsSubmitting(true);

    try {
      const payload = await submitStoreCheckout({
        locale,
        payload: {
          billing_address: {
            address_1: formValues.address1,
            city: formValues.city,
            country: formValues.country,
            email: formValues.email,
            first_name: formValues.firstName,
            last_name: formValues.lastName,
            phone: formValues.phone,
            postcode: formValues.postcode,
          },
          customer_note: formValues.note,
          payment_method: "cod",
          shipping_address: {
            address_1: formValues.address1,
            city: formValues.city,
            country: formValues.country,
            first_name: formValues.firstName,
            last_name: formValues.lastName,
            postcode: formValues.postcode,
          },
        },
      });

      setSubmitMessage(
        payload.payment_result?.redirect_url ?? messages.checkout.success,
      );
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : messages.checkout.submitError,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-5xl">
        <SectionPill>{messages.commerce.shopPill}</SectionPill>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-[var(--kanna-ink)]">
          {messages.checkout.heading}
        </h1>

        {isLoadingCart ? (
          <p className="mt-8 text-sm text-slate-600">{messages.checkout.loading}</p>
        ) : !cart || cart.items.length === 0 ? (
          <div className="mt-8 space-y-4">
            <p className="text-sm text-slate-600">{messages.checkout.empty}</p>
            <LocalizedLink
              to="/shop"
              className="inline-flex rounded-full bg-[var(--kanna-ink)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-black"
            >
              {messages.cart.emptyCta}
            </LocalizedLink>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  placeholder="First name"
                  value={formValues.firstName}
                  onChange={(event) =>
                    setFormValues((prev) => ({
                      ...prev,
                      firstName: event.target.value,
                    }))
                  }
                />
                <InputField
                  placeholder="Last name"
                  value={formValues.lastName}
                  onChange={(event) =>
                    setFormValues((prev) => ({
                      ...prev,
                      lastName: event.target.value,
                    }))
                  }
                />
                <InputField
                  placeholder="Email"
                  type="email"
                  value={formValues.email}
                  onChange={(event) =>
                    setFormValues((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                />
                <InputField
                  placeholder="Phone"
                  value={formValues.phone}
                  onChange={(event) =>
                    setFormValues((prev) => ({
                      ...prev,
                      phone: event.target.value,
                    }))
                  }
                />
                <InputField
                  className="md:col-span-2"
                  placeholder="Address"
                  value={formValues.address1}
                  onChange={(event) =>
                    setFormValues((prev) => ({
                      ...prev,
                      address1: event.target.value,
                    }))
                  }
                />
                <InputField
                  placeholder="City"
                  value={formValues.city}
                  onChange={(event) =>
                    setFormValues((prev) => ({
                      ...prev,
                      city: event.target.value,
                    }))
                  }
                />
                <InputField
                  placeholder="Postcode"
                  value={formValues.postcode}
                  onChange={(event) =>
                    setFormValues((prev) => ({
                      ...prev,
                      postcode: event.target.value,
                    }))
                  }
                />
                <SelectField
                  className="md:col-span-2"
                  value={formValues.country}
                  onChange={(event) =>
                    setFormValues((prev) => ({
                      ...prev,
                      country: event.target.value,
                    }))
                  }
                >
                  <option value="PL">Poland</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="GB">United Kingdom</option>
                </SelectField>
                <TextareaField
                  className="md:col-span-2"
                  placeholder="Order note"
                  rows={5}
                  value={formValues.note}
                  onChange={(event) =>
                    setFormValues((prev) => ({
                      ...prev,
                      note: event.target.value,
                    }))
                  }
                />
              </div>

              {submitError ? (
                <p className="text-sm text-red-700">{submitError}</p>
              ) : null}
              {submitMessage ? (
                <p className="text-sm text-emerald-700">{submitMessage}</p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex rounded-full bg-[var(--kanna-ink)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
              >
                {isSubmitting
                  ? `${messages.checkout.placeOrder}...`
                  : messages.checkout.placeOrder}
              </button>
            </form>

            <aside className="h-fit border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                {messages.cart.subtotal}
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--kanna-ink)]">
                {cart.total}
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
