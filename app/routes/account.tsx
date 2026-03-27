import { redirect } from "react-router";
import { AccountHydrateFallback } from "~/components/hydrate-fallbacks";
import { requireAuthenticatedAccountRoute } from "~/lib/account-route";
import {
  buildLocalizedMeta,
  getLocaleFromPath,
  getMessages,
} from "~/lib/i18n";
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
  const { session } = await requireAuthenticatedAccountRoute(request.url);

  throw redirect(session.account_paths.orders);
}

export default function AccountPage() {
  return null;
}
