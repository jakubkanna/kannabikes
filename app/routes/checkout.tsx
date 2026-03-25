import { useEffect, useState } from "react";

import type { Route } from "./+types/checkout";
import { LocalizedLink } from "~/components/localized-link";
import {
  AnimatedOrderSection,
} from "~/components/order-page/order-motion";
import { SectionStack } from "~/components/order-page/section-stack";
import {
  InputField,
  SelectField,
  TextareaField,
} from "~/components/form-field";
import { useLocale, useMessages } from "~/components/locale-provider";
import { PageShell } from "~/components/page-container";
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
    <PageShell>
      <SectionStack>
        <AnimatedOrderSection className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <SectionPill>{messages.commerce.shopPill}</SectionPill>
          <h1 className="page-heading mt-4 text-[2.35rem] leading-[0.88] text-[var(--kanna-ink)] md:text-[3.8rem]">
            {messages.checkout.heading}
          </h1>
        </AnimatedOrderSection>

        {isLoadingCart ? (
          <AnimatedOrderSection className="rounded-xl border border-dashed border-stone-300 bg-stone-100/80 p-6 shadow-sm">
            <p className="text-sm text-slate-600">{messages.checkout.loading}</p>
          </AnimatedOrderSection>
        ) : !cart || cart.items.length === 0 ? (
          <AnimatedOrderSection className="rounded-xl border border-dashed border-stone-300 bg-stone-100/80 p-6 shadow-sm">
            <p className="text-sm text-slate-600">{messages.checkout.empty}</p>
            <LocalizedLink
              to="/shop"
              className="mt-6 inline-flex rounded-full bg-[var(--kanna-ink)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-black"
            >
              {messages.cart.emptyCta}
            </LocalizedLink>
          </AnimatedOrderSection>
        ) : (
          <AnimatedOrderSection className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
              <form
                id="store-checkout-form"
                className="space-y-6"
                onSubmit={handleSubmit}
              >
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Shipping details
                  </h3>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">
                        Name
                      </span>
                      <InputField
                        type="text"
                        value={formValues.firstName}
                        onChange={(event) =>
                          setFormValues((prev) => ({
                            ...prev,
                            firstName: event.target.value,
                          }))
                        }
                        placeholder="Name"
                        className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">
                        Lastname
                      </span>
                      <InputField
                        type="text"
                        value={formValues.lastName}
                        onChange={(event) =>
                          setFormValues((prev) => ({
                            ...prev,
                            lastName: event.target.value,
                          }))
                        }
                        placeholder="Lastname"
                        className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">
                        Email
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
                        placeholder="Email"
                        className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">
                        Phone number
                      </span>
                      <InputField
                        type="tel"
                        value={formValues.phone}
                        onChange={(event) =>
                          setFormValues((prev) => ({
                            ...prev,
                            phone: event.target.value,
                          }))
                        }
                        placeholder="Phone number"
                        className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">
                        Country
                      </span>
                      <SelectField
                        value={formValues.country}
                        onChange={(event) =>
                          setFormValues((prev) => ({
                            ...prev,
                            country: event.target.value,
                          }))
                        }
                        className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                      >
                        <option value="PL">Poland</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                        <option value="GB">United Kingdom</option>
                      </SelectField>
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">
                        Postal code
                      </span>
                      <InputField
                        type="text"
                        value={formValues.postcode}
                        onChange={(event) =>
                          setFormValues((prev) => ({
                            ...prev,
                            postcode: event.target.value,
                          }))
                        }
                        placeholder="Postal code"
                        className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">
                        City
                      </span>
                      <InputField
                        type="text"
                        value={formValues.city}
                        onChange={(event) =>
                          setFormValues((prev) => ({
                            ...prev,
                            city: event.target.value,
                          }))
                        }
                        placeholder="City"
                        className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">
                        Street and house number
                      </span>
                      <InputField
                        type="text"
                        value={formValues.address1}
                        onChange={(event) =>
                          setFormValues((prev) => ({
                            ...prev,
                            address1: event.target.value,
                          }))
                        }
                        placeholder="Street and house number"
                        className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">
                        Order note
                      </span>
                      <TextareaField
                        rows={5}
                        value={formValues.note}
                        onChange={(event) =>
                          setFormValues((prev) => ({
                            ...prev,
                            note: event.target.value,
                          }))
                        }
                        placeholder="Order note"
                        className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                      />
                    </label>
                  </div>
                </div>

                {submitError ? (
                  <p className="text-sm text-red-700">{submitError}</p>
                ) : null}
                {submitMessage ? (
                  <p className="text-sm text-emerald-700">{submitMessage}</p>
                ) : null}
              </form>

              <aside className="h-fit rounded-xl border border-stone-200 bg-stone-50/50 p-5 lg:sticky lg:top-[calc(var(--site-header-height)+2rem)]">
                <SectionPill>{messages.cart.title}</SectionPill>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {messages.cart.items}
                    </p>
                    <div className="mt-3 space-y-3">
                      {cart.items.map((item) => (
                        <div
                          key={item.key}
                          className="flex items-start justify-between gap-4 border-b border-stone-200 pb-3 last:border-b-0 last:pb-0"
                        >
                          <div className="min-w-0">
                            <LocalizedLink
                              to={item.path}
                              className="block text-sm font-semibold text-[var(--kanna-ink)]"
                            >
                              {item.name}
                            </LocalizedLink>
                            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">
                              {messages.cart.quantity}: {item.quantity}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold text-[var(--kanna-ink)]">
                            {item.total}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-stone-200 pt-4">
                    <div className="flex items-center justify-between gap-4 text-sm text-slate-700">
                      <span>{messages.cart.subtotal}</span>
                      <span className="font-semibold text-[var(--kanna-ink)]">
                        {cart.subtotal}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-4 text-sm text-slate-700">
                      <span>{messages.cart.shipping}</span>
                      <div className="text-right">
                        <div className="font-semibold text-[var(--kanna-ink)]">
                          {cart.shippingCalculated
                            ? cart.shipping
                            : messages.cart.shippingPending}
                        </div>
                        {cart.shippingMethod ? (
                          <div className="mt-1 text-xs text-slate-500">
                            {cart.shippingMethod}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-sm text-slate-700">
                      <span>{messages.cart.vat}</span>
                      <span className="font-semibold text-[var(--kanna-ink)]">
                        {cart.vat}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-stone-200 pt-4">
                    <span className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {messages.cart.total}
                    </span>
                    <span className="text-2xl font-semibold text-[var(--kanna-ink)]">
                      {cart.total}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  form="store-checkout-form"
                  disabled={isSubmitting}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-[var(--kanna-ink)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-stone-300"
                >
                  {isSubmitting
                    ? `${messages.checkout.placeOrder}...`
                    : messages.checkout.placeOrder}
                </button>
              </aside>
            </div>
          </AnimatedOrderSection>
          )}
      </SectionStack>
    </PageShell>
  );
}
