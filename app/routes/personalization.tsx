import type { Route } from "./+types/personalization";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { SITE_NAME } from "~/root";
import { buildOrderNumber } from "~/components/order-page";

export function meta({}: Route.MetaArgs) {
  return [{ title: `${SITE_NAME} | Order` }];
}

export default function PersonalizationPage() {
  const [orderNumber] = useState(() => buildOrderNumber(new Date()));
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`/order/${orderNumber}`, { replace: true });
  }, [navigate, orderNumber]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="text-sm text-slate-600">Redirecting to order {orderNumber}...</div>
    </main>
  );
}
