import type { OrderStage } from "~/lib/mock-order";
import {
  getWooDisplayStatus,
  WOO_DISPLAY_STATUS_DEFINITIONS,
} from "~/lib/mock-order";

export function OrderStatusBadge({ stage }: { stage: OrderStage }) {
  const definition = WOO_DISPLAY_STATUS_DEFINITIONS[getWooDisplayStatus(stage)];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${definition.badgeClassName}`}
    >
      {definition.label}
    </span>
  );
}
