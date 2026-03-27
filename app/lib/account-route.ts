import { redirect } from "react-router";
import {
  fetchCustomerSession,
  type CustomerSession,
} from "~/lib/customer-account";
import { getLocaleFromPath, type Locale } from "~/lib/i18n";

export type ProtectedAccountRouteContext = {
  locale: Locale;
  pathname: string;
  session: CustomerSession;
};

export async function requireAuthenticatedAccountRoute(requestUrl: string) {
  const pathname = new URL(requestUrl).pathname;
  const locale = getLocaleFromPath(pathname);
  const session = await fetchCustomerSession(locale);

  if (!session.authenticated) {
    throw redirect(
      `${session.account_paths.sign_in}?redirect=${encodeURIComponent(pathname)}`,
    );
  }

  return { locale, pathname, session } satisfies ProtectedAccountRouteContext;
}

export async function loadProtectedAccountRouteData<
  T extends Record<string, unknown>,
>(
  requestUrl: string,
  loadData: (context: ProtectedAccountRouteContext) => Promise<T>,
) {
  const context = await requireAuthenticatedAccountRoute(requestUrl);
  const data = await loadData(context);

  return {
    ...data,
    locale: context.locale,
    session: context.session,
  };
}
