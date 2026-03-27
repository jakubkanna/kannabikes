import { useState } from "react";
import { redirect } from "react-router";
import { AccountShell } from "~/components/account-shell";
import { Button } from "~/components/button";
import { InputField, LockedField } from "~/components/form-field";
import { AccountHydrateFallback } from "~/components/hydrate-fallbacks";
import { useMessages } from "~/components/locale-provider";
import { PhoneNumberField } from "~/components/phone-number-field";
import {
  fetchCustomerAccount,
  fetchCustomerSession,
  updateCustomerProfile,
  type CustomerUser,
} from "~/lib/customer-account";
import { buildLocalizedMeta, getLocaleFromPath, getMessages } from "~/lib/i18n";
import { isPhoneNumberWithCountryCode } from "~/lib/phone";
import { formatPageTitle } from "~/root";
import type { Route } from "./+types/account.profile";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const pathname = new URL(request.url).pathname;
  const locale = getLocaleFromPath(pathname);
  const session = await fetchCustomerSession(locale);

  if (!session.authenticated) {
    throw redirect(
      `${session.account_paths.sign_in}?redirect=${encodeURIComponent(pathname)}`,
    );
  }

  const account = await fetchCustomerAccount(locale);

  return { account, locale, session };
}

export function meta({ location }: Route.MetaArgs) {
  const locale = getLocaleFromPath(location.pathname);
  const messages = getMessages(locale);

  return buildLocalizedMeta({
    description: messages.account.profileBody,
    locale,
    pathname: location.pathname,
    robots: "noindex,follow",
    title: formatPageTitle(messages.account.profileTitle),
  });
}

export function HydrateFallback() {
  return <AccountHydrateFallback variant="form" />;
}

export default function AccountProfilePage({
  loaderData,
}: Route.ComponentProps) {
  const messages = useMessages();
  const [user, setUser] = useState<CustomerUser>(loaderData.account.user);
  const [displayName, setDisplayName] = useState(
    loaderData.account.user.displayName,
  );
  const [firstName, setFirstName] = useState(loaderData.account.user.firstName);
  const [lastName, setLastName] = useState(loaderData.account.user.lastName);
  const [phone, setPhone] = useState(loaderData.account.user.phone);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  return (
    <AccountShell
      session={loaderData.session}
      title={messages.account.profileTitle}
      user={user}
    >
      <form
        className="max-w-3xl space-y-5 border border-black/15 bg-white p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!isPhoneNumberWithCountryCode(phone)) {
            setStatus(messages.common.phoneNumberWithCountryCodeError);
            return;
          }
          setIsSaving(true);
          setStatus(null);

          try {
            const response = await updateCustomerProfile({
              csrfToken: loaderData.session.csrfToken,
              locale: loaderData.locale,
              payload: { displayName, firstName, lastName, phone },
            });
            setUser(response.user);
            setStatus(messages.account.profileSaved);
          } catch {
            setStatus(messages.account.saveError);
          } finally {
            setIsSaving(false);
          }
        }}
      >
        <label className="block">
          <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
            {messages.account.displayNameLabel}
          </span>
          <InputField
            value={displayName}
            onChange={(event) => setDisplayName(event.currentTarget.value)}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
            {messages.account.firstNameLabel}
          </span>
          <InputField
            value={firstName}
            onChange={(event) => setFirstName(event.currentTarget.value)}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
            {messages.account.lastNameLabel}
          </span>
          <InputField
            value={lastName}
            onChange={(event) => setLastName(event.currentTarget.value)}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
            {messages.account.emailLabel}
          </span>
          <LockedField value={loaderData.account.user.email} />
          <span className="mt-2 block text-xs text-gray-500">
            {messages.account.emailReadOnly}
          </span>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
            {messages.account.phoneLabel}
          </span>
          <PhoneNumberField value={phone} onChange={setPhone} />
        </label>
        <Button
          type="submit"
          disabled={isSaving}
          className="uppercase tracking-[0.08em]"
        >
          {messages.account.profileSave}
        </Button>
        {status ? <p className="text-sm text-gray-600">{status}</p> : null}
      </form>
    </AccountShell>
  );
}
