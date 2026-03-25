import { AccountShell } from "~/components/account-shell";
import { buildLocalizedMeta, getLocaleFromPath, getMessages } from "~/lib/i18n";
import { formatPageTitle } from "~/root";
import {
  fetchCustomerOrders,
  fetchCustomerSession,
} from "~/lib/customer-account";
import { redirect } from "react-router";
import { useMessages } from "~/components/locale-provider";
import type { Route } from "./+types/account.orders";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const pathname = new URL(request.url).pathname;
  const locale = getLocaleFromPath(pathname);
  const session = await fetchCustomerSession(locale);

  if (!session.authenticated) {
    throw redirect(
      `${session.account_paths.sign_in}?redirect=${encodeURIComponent(pathname)}`,
    );
  }

  const { orders } = await fetchCustomerOrders(locale);

  return { orders, session };
}

export function meta({ location }: Route.MetaArgs) {
  const locale = getLocaleFromPath(location.pathname);
  const messages = getMessages(locale);

  return buildLocalizedMeta({
    description: messages.account.ordersBody,
    locale,
    pathname: location.pathname,
    title: formatPageTitle(messages.account.ordersTitle),
  });
}

export default function AccountOrdersPage({
  loaderData,
}: Route.ComponentProps) {
  const { orders, session } = loaderData;
  const messages = useMessages();

  return (
    <AccountShell session={session} title={messages.account.ordersTitle}>
      {orders.length === 0 ? (
        <p className="text-sm text-slate-600">{messages.account.noOrders}</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="border border-black/15 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                    #{order.number}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{order.status}</p>
                </div>
                <p className="text-sm font-semibold text-[var(--kanna-ink)]">
                  {order.total}
                </p>
              </div>
              <div className="mt-4 space-y-2 text-sm text-[var(--kanna-ink)]">
                {order.items.map((item) => (
                  <p key={`${order.id}-${item.name}`}>
                    {item.name} x {item.quantity}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
