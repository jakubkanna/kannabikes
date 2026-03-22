import type { Route } from "./+types/order.$orderNumber";
import { useParams, useSearchParams } from "react-router";
import { OrderPage, buildOrderNumber } from "~/components/order-page";
import { SITE_NAME } from "~/root";

export function meta({}: Route.MetaArgs) {
  return [{ title: `${SITE_NAME} | Order` }];
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
