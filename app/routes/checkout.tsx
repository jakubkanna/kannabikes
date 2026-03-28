import { useEffect, useMemo, useRef, useState } from "react";

import type { Route } from "./+types/checkout";
import { AccountRegistrationConsents } from "~/components/account-registration-consents";
import { Button } from "~/components/button";
import { DetailPanel } from "~/components/commerce/detail-panel";
import { CustomerSignInForm } from "~/components/customer-sign-in-form";
import {
  BankTransferIcon,
  PaymentOption,
  StripeCardIcon,
} from "~/components/commerce/payment-option";
import { LocalizedLink } from "~/components/localized-link";
import { AnimatedOrderSection } from "~/components/order-page/order-motion";
import { SectionStack } from "~/components/order-page/section-stack";
import {
  InputField,
  SelectField,
  TextareaField,
} from "~/components/form-field";
import { useLocale, useMessages } from "~/components/locale-provider";
import { PageShell } from "~/components/page-container";
import { PhoneNumberField } from "~/components/phone-number-field";
import { SectionPill } from "~/components/section-pill";
import { getGoogleAuthUrl } from "~/lib/auth";
import { buildLocalizedMeta, getLocaleFromPath, getMessages } from "~/lib/i18n";
import {
  fetchCustomerAccount,
  fetchCustomerSession,
  registerCustomerAccount,
  type CustomerSession,
} from "~/lib/customer-account";
import {
  fetchStoreCart,
  submitStoreCheckout,
  type StoreCart,
} from "~/lib/store-api";
import { formatPageTitle } from "~/root";
import { isPhoneNumberWithCountryCode } from "~/lib/phone";

type CheckoutPaymentMethod = "stripe" | "classic_transfer";

function fillIfEmpty(currentValue: string, nextValue: string | undefined) {
  if (currentValue.trim() !== "") {
    return currentValue;
  }

  return nextValue?.trim() ?? "";
}

export function meta({ location }: Route.MetaArgs) {
  const locale = getLocaleFromPath(location.pathname);
  const messages = getMessages(locale);
  return buildLocalizedMeta({
    description: messages.meta.checkout.description,
    locale,
    pathname: location.pathname,
    robots: "noindex,follow",
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
  const [paymentMethod, setPaymentMethod] =
    useState<CheckoutPaymentMethod>("stripe");
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(
    null,
  );
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [accountMode, setAccountMode] = useState<"sign-in" | "sign-up">(
    "sign-in",
  );
  const [accountPassword, setAccountPassword] = useState("");
  const [accountPasswordConfirm, setAccountPasswordConfirm] = useState("");
  const [accountMarketingAccepted, setAccountMarketingAccepted] =
    useState(false);
  const [accountPrivacyAccepted, setAccountPrivacyAccepted] = useState(false);
  const googleSignInUrl = useMemo(
    () =>
      getGoogleAuthUrl({
        intent: "sign-in",
        locale,
        redirectTo: locale === "pl" ? "/pl/checkout" : "/checkout",
      }),
    [locale],
  );
  const googleSignUpUrl = useMemo(
    () =>
      getGoogleAuthUrl({
        intent: "sign-up",
        locale,
        marketingAccepted: accountMarketingAccepted,
        privacyAccepted: accountPrivacyAccepted,
        redirectTo: locale === "pl" ? "/pl/checkout" : "/checkout",
      }),
    [accountMarketingAccepted, accountPrivacyAccepted, locale],
  );
  const prefetchedCustomerIdRef = useRef<number | null>(null);
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

    void fetchCustomerSession(locale)
      .then((session) => {
        if (cancelled) {
          return;
        }

        setCustomerSession(session);
        setIsLoadingSession(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setCustomerSession(null);
        setIsLoadingSession(false);
      });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    if (!customerSession?.authenticated || !customerSession.user) {
      prefetchedCustomerIdRef.current = null;
      return;
    }

    if (prefetchedCustomerIdRef.current === customerSession.user.id) {
      return;
    }

    let cancelled = false;

    void fetchCustomerAccount(locale)
      .then((account) => {
        if (cancelled) {
          return;
        }

        prefetchedCustomerIdRef.current = customerSession.user?.id ?? null;

        setFormValues((current) => ({
          ...current,
          address1: fillIfEmpty(
            current.address1,
            account.addresses.billing.address1,
          ),
          city: fillIfEmpty(current.city, account.addresses.billing.city),
          country: fillIfEmpty(current.country, account.addresses.billing.country),
          email: fillIfEmpty(
            current.email,
            account.addresses.billing.email || account.user.email,
          ),
          firstName: fillIfEmpty(
            current.firstName,
            account.addresses.billing.firstName || account.user.firstName,
          ),
          lastName: fillIfEmpty(
            current.lastName,
            account.addresses.billing.lastName || account.user.lastName,
          ),
          note: current.note,
          phone: fillIfEmpty(
            current.phone,
            account.addresses.billing.phone || account.user.phone,
          ),
          postcode: fillIfEmpty(
            current.postcode,
            account.addresses.billing.postcode,
          ),
        }));
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        prefetchedCustomerIdRef.current = customerSession.user?.id ?? null;
      });

    return () => {
      cancelled = true;
    };
  }, [customerSession, locale]);

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

    if (!isPhoneNumberWithCountryCode(formValues.phone)) {
      setSubmitError(messages.common.phoneNumberWithCountryCodeError);
      return;
    }

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
          payment_method:
            paymentMethod === "classic_transfer" ? "bacs" : "stripe",
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
            <p className="text-sm text-gray-600">{messages.checkout.loading}</p>
          </AnimatedOrderSection>
        ) : !cart || cart.items.length === 0 ? (
          <AnimatedOrderSection className="rounded-xl border border-dashed border-stone-300 bg-stone-100/80 p-6 shadow-sm">
            <p className="text-sm text-gray-600">{messages.checkout.empty}</p>
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
                <DetailPanel title={messages.account.title}>
                  <div className="mt-4 space-y-6">
                    {!customerSession?.authenticated ? (
                      <div>
                        {isLoadingSession ? (
                          <p className="text-sm leading-relaxed text-gray-600">
                            {messages.account.signInTitle}...
                          </p>
                        ) : accountMode === "sign-in" ? (
                          <CustomerSignInForm
                            description={messages.checkout.signInDescription}
                            locale={locale}
                            onRequestSignUp={() => {
                              setAccountMode("sign-up");
                              setSubmitError(null);
                            }}
                            onSuccess={(session) => {
                              setCustomerSession(session);
                              setSubmitError(null);
                            }}
                          />
                        ) : (
                          <>
                            <h2 className="text-lg font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                              {messages.account.signUpTitle}
                            </h2>
                            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-black/75">
                              Create your Kanna Bikes customer account with
                              email and password, or{" "}
                              <a
                                href={googleSignUpUrl ?? "#"}
                                className="font-semibold underline underline-offset-2 transition hover:text-black"
                                onClick={(event) => {
                                  if (accountPrivacyAccepted) {
                                    return;
                                  }

                                  event.preventDefault();
                                  setSubmitError(
                                    messages.account.registrationPrivacyRequired,
                                  );
                                }}
                              >
                                {messages.account.continueWithGoogle}
                              </a>{" "}
                              if you prefer.
                            </p>

                            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                              <label className="block">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                                  {messages.account.firstNameLabel}
                                </span>
                                <InputField
                                  autoComplete="given-name"
                                  value={formValues.firstName}
                                  onChange={(event) =>
                                    setFormValues((prev) => ({
                                      ...prev,
                                      firstName: event.currentTarget.value,
                                    }))
                                  }
                                />
                              </label>
                              <label className="block">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                                  {messages.account.lastNameLabel}
                                </span>
                                <InputField
                                  autoComplete="family-name"
                                  value={formValues.lastName}
                                  onChange={(event) =>
                                    setFormValues((prev) => ({
                                      ...prev,
                                      lastName: event.currentTarget.value,
                                    }))
                                  }
                                />
                              </label>
                              <label className="block sm:col-span-2">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                                  {messages.account.emailLabel}
                                </span>
                                <InputField
                                  autoComplete="email"
                                  type="email"
                                  value={formValues.email}
                                  onChange={(event) =>
                                    setFormValues((prev) => ({
                                      ...prev,
                                      email: event.currentTarget.value,
                                    }))
                                  }
                                />
                              </label>
                              <label className="block">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                                  {messages.account.passwordLabel}
                                </span>
                                <InputField
                                  autoComplete="new-password"
                                  minLength={8}
                                  type="password"
                                  value={accountPassword}
                                  onChange={(event) =>
                                    setAccountPassword(event.currentTarget.value)
                                  }
                                />
                              </label>
                              <label className="block">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                                  {messages.account.confirmPasswordLabel}
                                </span>
                                <InputField
                                  autoComplete="new-password"
                                  minLength={8}
                                  type="password"
                                  value={accountPasswordConfirm}
                                  onChange={(event) =>
                                    setAccountPasswordConfirm(
                                      event.currentTarget.value,
                                    )
                                  }
                                />
                              </label>
                            </div>

                            <div className="mt-6">
                              <AccountRegistrationConsents
                                errorMessage={
                                  submitError ===
                                  messages.account.registrationPrivacyRequired
                                    ? submitError
                                    : null
                                }
                                marketingAccepted={accountMarketingAccepted}
                                onMarketingAcceptedChange={
                                  setAccountMarketingAccepted
                                }
                                onPrivacyAcceptedChange={
                                  setAccountPrivacyAccepted
                                }
                                privacyAccepted={accountPrivacyAccepted}
                              />
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                              <Button
                                type="button"
                                size="sm"
                                onClick={async () => {
                                  setSubmitError(null);

                                  if (accountPassword.length < 8) {
                                    setSubmitError(messages.account.passwordMinLength);
                                    return;
                                  }

                                  if (accountPassword !== accountPasswordConfirm) {
                                    setSubmitError(messages.account.passwordMismatch);
                                    return;
                                  }

                                  if (!accountPrivacyAccepted) {
                                    setSubmitError(
                                      messages.account.registrationPrivacyRequired,
                                    );
                                    return;
                                  }

                                  try {
                                    await registerCustomerAccount({
                                      email: formValues.email,
                                      firstName: formValues.firstName,
                                      lastName: formValues.lastName,
                                      locale,
                                      marketingAccepted:
                                        accountMarketingAccepted,
                                      password: accountPassword,
                                      privacyAccepted: accountPrivacyAccepted,
                                    });
                                    const session = await fetchCustomerSession(locale);

                                    setCustomerSession(session);
                                    setAccountMode("sign-in");
                                    setAccountMarketingAccepted(false);
                                    setAccountPassword("");
                                    setAccountPasswordConfirm("");
                                    setAccountPrivacyAccepted(false);
                                  } catch (error) {
                                    setSubmitError(
                                      error instanceof Error
                                        ? error.message
                                        : messages.account.signUpError,
                                    );
                                  }
                                }}
                              >
                                {messages.account.createAccount}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setAccountMode("sign-in");
                                  setSubmitError(null);
                                }}
                              >
                                {messages.account.signInTitle}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm text-gray-700">
                        <p>
                          <span className="font-semibold text-[var(--kanna-ink)]">
                            {messages.checkout.accountSignedInAs}
                          </span>{" "}
                          {customerSession.user?.displayName ||
                            customerSession.user?.email}
                        </p>
                      </div>
                    )}
                  </div>
                </DetailPanel>

                <DetailPanel title="Shipping details">
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-gray-700">
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
                      <span className="mb-2 block text-sm font-semibold text-gray-700">
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
                      <span className="mb-2 block text-sm font-semibold text-gray-700">
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
                      <span className="mb-2 block text-sm font-semibold text-gray-700">
                        Phone number
                      </span>
                      <PhoneNumberField
                        inputClassName="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                        selectClassName="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                        value={formValues.phone}
                        onChange={(phone) =>
                          setFormValues((prev) => ({
                            ...prev,
                            phone,
                          }))
                        }
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="mb-2 block text-sm font-semibold text-gray-700">
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
                      <span className="mb-2 block text-sm font-semibold text-gray-700">
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
                      <span className="mb-2 block text-sm font-semibold text-gray-700">
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
                      <span className="mb-2 block text-sm font-semibold text-gray-700">
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
                      <span className="mb-2 block text-sm font-semibold text-gray-700">
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
                </DetailPanel>

                <DetailPanel title={messages.checkout.paymentOptions}>
                  <div className="mt-3 grid gap-2">
                    <PaymentOption
                      icon={<StripeCardIcon />}
                      isSelected={paymentMethod === "stripe"}
                      onSelect={() => setPaymentMethod("stripe")}
                      title={messages.checkout.stripe}
                    />
                    <PaymentOption
                      icon={<BankTransferIcon />}
                      isSelected={paymentMethod === "classic_transfer"}
                      onSelect={() => setPaymentMethod("classic_transfer")}
                      title={messages.checkout.classicTransfer}
                    />
                  </div>
                </DetailPanel>

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
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-500">
                      {messages.cart.items}
                    </p>
                    <div className="mt-3 space-y-3">
                      {cart.items.map((item) => (
                        <div
                          key={item.key}
                          className="flex items-start justify-between gap-4 border-b border-stone-200 pb-3 last:border-b-0 last:pb-0"
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-stone-200">
                              {item.imageSrc ? (
                                <img
                                  src={item.imageSrc}
                                  alt={item.imageAlt}
                                  className="h-full w-full object-cover"
                                />
                              ) : null}
                            </div>
                            <div className="min-w-0">
                              <LocalizedLink
                                to={item.path}
                                className="block text-sm font-semibold text-[var(--kanna-ink)]"
                              >
                                {item.name}
                              </LocalizedLink>
                              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-gray-500">
                                {messages.cart.quantity}: {item.quantity}
                              </p>
                            </div>
                          </div>
                          <p className="shrink-0 text-sm font-semibold text-[var(--kanna-ink)]">
                            {item.total}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-stone-200 pt-4">
                    <div className="flex items-center justify-between gap-4 text-sm text-gray-700">
                      <span>{messages.cart.subtotal}</span>
                      <span className="font-semibold text-[var(--kanna-ink)]">
                        {cart.subtotal}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-4 text-sm text-gray-700">
                      <span>{messages.cart.shipping}</span>
                      <div className="text-right">
                        <div className="font-semibold text-[var(--kanna-ink)]">
                          {cart.shippingCalculated
                            ? cart.shipping
                            : messages.cart.shippingPending}
                        </div>
                        {cart.shippingMethod ? (
                          <div className="mt-1 text-xs text-gray-500">
                            {cart.shippingMethod}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-sm text-gray-700">
                      <span>{messages.checkout.paymentMethod}</span>
                      <span className="font-semibold text-[var(--kanna-ink)]">
                        {paymentMethod === "classic_transfer"
                          ? messages.checkout.classicTransfer
                          : messages.checkout.stripe}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-sm text-gray-700">
                      <span>{messages.cart.vat}</span>
                      <span className="font-semibold text-[var(--kanna-ink)]">
                        {cart.vat}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-stone-200 pt-4">
                    <span className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-500">
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
