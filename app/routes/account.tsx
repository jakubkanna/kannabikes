import { redirect } from "react-router";
import { AccountHydrateFallback } from "~/components/hydrate-fallbacks";
import {
  buildLocalizedMeta,
  getLocaleFromPath,
  getMessages,
} from "~/lib/i18n";
import { fetchCustomerSession } from "~/lib/customer-account";
import { formatPageTitle } from "~/root";
import type { Route } from "./+types/account";

export function meta({ location }: Route.MetaArgs) {
  const locale = getLocaleFromPath(location.pathname);
  const messages = getMessages(locale);

  return buildLocalizedMeta({
    description: messages.account.accountOverviewBody,
    locale,
    pathname: location.pathname,
    robots: "noindex,follow",
    title: formatPageTitle(messages.account.overviewTitle),
  });
}

export function HydrateFallback() {
  return <AccountHydrateFallback variant="list" />;
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const pathname = new URL(request.url).pathname;
  const locale = getLocaleFromPath(pathname);
  const session = await fetchCustomerSession(locale);

  if (!session.authenticated) {
    throw redirect(
      `${session.account_paths.sign_in}?redirect=${encodeURIComponent(pathname)}`,
    );
  }

  throw redirect(session.account_paths.orders);
}

export default function AccountPage() {
  return null;
}
