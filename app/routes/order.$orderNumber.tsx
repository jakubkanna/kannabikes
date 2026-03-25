import type { Route } from "./+types/order.$orderNumber";
import { useParams, useSearchParams } from "react-router";
import { OrderPage, buildOrderNumber } from "~/components/order-page";
import { formatPageTitle } from "~/root";
import {
  buildLocalizedMeta,
  getLocaleFromPath,
  getMessages,
} from "~/lib/i18n";

export function meta({ location }: Route.MetaArgs) {
  const locale = getLocaleFromPath(location.pathname);
  const messages = getMessages(locale);
  return buildLocalizedMeta({
    description: messages.meta.order.description,
    locale,
    pathname: location.pathname,
    title: formatPageTitle(messages.meta.order.title),
  });
}

export default function OrderNumberPage() {
  const { orderNumber } = useParams();
  const [searchParams] = useSearchParams();

  return (
    <OrderPage
      claimToken={searchParams.get("claim_token") ?? undefined}
      orderNumber={orderNumber ?? buildOrderNumber(new Date())}
    />
  );
}
