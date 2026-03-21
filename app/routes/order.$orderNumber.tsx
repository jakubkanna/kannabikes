import type { Route } from "./+types/order.$orderNumber";
import { useParams } from "react-router";
import { OrderPage, buildOrderNumber } from "~/components/order-page";
import { SITE_NAME } from "~/root";

export function meta({}: Route.MetaArgs) {
  return [{ title: `Order | ${SITE_NAME}` }];
}

export default function OrderNumberPage() {
  const { orderNumber } = useParams();
  return <OrderPage orderNumber={orderNumber ?? buildOrderNumber(new Date())} />;
}
