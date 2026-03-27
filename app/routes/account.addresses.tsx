import { useState } from "react";
import { redirect } from "react-router";
import { AccountShell } from "~/components/account-shell";
import { Button } from "~/components/button";
import { InputField } from "~/components/form-field";
import { AccountHydrateFallback } from "~/components/hydrate-fallbacks";
import { useMessages } from "~/components/locale-provider";
import {
  fetchCustomerAddresses,
  fetchCustomerSession,
  updateCustomerAddresses,
  type CustomerAddressBook,
} from "~/lib/customer-account";
import { buildLocalizedMeta, getLocaleFromPath, getMessages } from "~/lib/i18n";
import { formatPageTitle } from "~/root";
import type { Route } from "./+types/account.addresses";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const pathname = new URL(request.url).pathname;
  const locale = getLocaleFromPath(pathname);
  const session = await fetchCustomerSession(locale);

  if (!session.authenticated) {
    throw redirect(
      `${session.account_paths.sign_in}?redirect=${encodeURIComponent(pathname)}`,
    );
  }

  const { addresses } = await fetchCustomerAddresses(locale);

  return { addresses, locale, session };
}

export function meta({ location }: Route.MetaArgs) {
  const locale = getLocaleFromPath(location.pathname);
  const messages = getMessages(locale);

  return buildLocalizedMeta({
    description: messages.account.addressesTitle,
    locale,
    pathname: location.pathname,
    robots: "noindex,follow",
    title: formatPageTitle(messages.account.addressesTitle),
  });
}

export function HydrateFallback() {
  return <AccountHydrateFallback variant="form" />;
}

function AddressSection({
  fields,
  labels,
  onChange,
  title,
}: {
  fields: CustomerAddressBook["billing"];
  labels: {
    address1: string;
    address2: string;
    city: string;
    company: string;
    country: string;
    firstName: string;
    lastName: string;
    postcode: string;
    state: string;
  };
  onChange: (
    field: keyof CustomerAddressBook["billing"],
    value: string,
  ) => void;
  title: string;
}) {
  const items: Array<[keyof CustomerAddressBook["billing"], string]> = [
    ["firstName", labels.firstName],
    ["lastName", labels.lastName],
    ["company", labels.company],
    ["address1", labels.address1],
    ["address2", labels.address2],
    ["city", labels.city],
    ["postcode", labels.postcode],
    ["state", labels.state],
    ["country", labels.country],
  ];

  return (
    <section className="border border-black/15 bg-white p-6">
      <h2 className="text-lg font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
        {title}
      </h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {items.map(([field, label]) => (
          <label key={field} className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
              {label}
            </span>
            <InputField
              value={fields[field] ?? ""}
              onChange={(event) => onChange(field, event.currentTarget.value)}
            />
          </label>
        ))}
      </div>
    </section>
  );
}

export default function AccountAddressesPage({
  loaderData,
}: Route.ComponentProps) {
  const messages = useMessages();
  const [addresses, setAddresses] = useState(loaderData.addresses);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  return (
    <AccountShell
      session={loaderData.session}
      title={messages.account.addressesTitle}
    >
      <form
        className="space-y-6"
        onSubmit={async (event) => {
          event.preventDefault();
          setIsSaving(true);
          setStatus(null);

          try {
            await updateCustomerAddresses({
              csrfToken: loaderData.session.csrfToken,
              locale: loaderData.locale,
              payload: addresses,
            });
            setStatus(messages.account.addressesSaved);
          } catch {
            setStatus(messages.account.saveError);
          } finally {
            setIsSaving(false);
          }
        }}
      >
        <AddressSection
          fields={addresses.billing}
          labels={{
            address1: messages.account.address1Label,
            address2: messages.account.address2Label,
            city: messages.account.cityLabel,
            company: messages.account.companyLabel,
            country: messages.account.countryLabel,
            firstName: messages.account.firstNameLabel,
            lastName: messages.account.lastNameLabel,
            postcode: messages.account.postcodeLabel,
            state: messages.account.stateLabel,
          }}
          title={messages.account.billingAddress}
          onChange={(field, value) =>
            setAddresses((current) => ({
              ...current,
              billing: { ...current.billing, [field]: value },
            }))
          }
        />
        <AddressSection
          fields={addresses.shipping}
          labels={{
            address1: messages.account.address1Label,
            address2: messages.account.address2Label,
            city: messages.account.cityLabel,
            company: messages.account.companyLabel,
            country: messages.account.countryLabel,
            firstName: messages.account.firstNameLabel,
            lastName: messages.account.lastNameLabel,
            postcode: messages.account.postcodeLabel,
            state: messages.account.stateLabel,
          }}
          title={messages.account.shippingAddress}
          onChange={(field, value) =>
            setAddresses((current) => ({
              ...current,
              shipping: { ...current.shipping, [field]: value },
            }))
          }
        />
        <Button
          type="submit"
          disabled={isSaving}
          className="uppercase tracking-[0.08em]"
        >
          {messages.account.addressesSave}
        </Button>
        {status ? <p className="text-sm text-gray-600">{status}</p> : null}
      </form>
    </AccountShell>
  );
}
