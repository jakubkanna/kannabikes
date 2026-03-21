export type OrderStage =
  | "waiting_for_deposit"
  | "in_review"
  | "waiting_for_specification"
  | "waiting_for_design"
  | "waiting_for_design_approval"
  | "in_production"
  | "waiting_for_delivery"
  | "delivered";

type OrderStageDefinition = {
  label: string;
  description: string;
  badgeClassName: string;
};

const STORAGE_PREFIX = "kanna-order-stage";
const DEPOSIT_CONFIRMED_PREFIX = "kanna-order-deposit-confirmed";
const BIKE_SPECIFICATION_PREFIX = "kanna-order-bike-specification";

export type StoredBikeSpecificationDraft = {
  specificationMode: "guided_by_designer" | "self_specified" | "frame_only" | null;
  values: Record<string, string>;
};

export const ORDER_STAGES: OrderStage[] = [
  "waiting_for_deposit",
  "in_review",
  "waiting_for_specification",
  "waiting_for_design",
  "waiting_for_design_approval",
  "in_production",
  "waiting_for_delivery",
  "delivered",
];

export const ORDER_STAGE_DEFINITIONS: Record<OrderStage, OrderStageDefinition> = {
  waiting_for_deposit: {
    label: "Waiting for deposit",
    description: "We are waiting for the initial deposit before we can open the order for review.",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
  },
  in_review: {
    label: "In review",
    description: "The deposit is being verified and we are reviewing your measurements and order details.",
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
  },
  waiting_for_specification: {
    label: "Waiting for specification",
    description: "Measurements are received and the project is waiting for the bike specification to move into design.",
    badgeClassName: "border-cyan-200 bg-cyan-50 text-cyan-700",
  },
  waiting_for_design: {
    label: "Design in progress",
    description: "Review is complete and the order is queued for the design phase.",
    badgeClassName: "border-violet-200 bg-violet-50 text-violet-700",
  },
  waiting_for_design_approval: {
    label: "Design waiting for approval",
    description: "The design is prepared and waiting for your approval before production starts.",
    badgeClassName: "border-indigo-200 bg-indigo-50 text-indigo-700",
  },
  in_production: {
    label: "In production",
    description: "Your frame and configuration are now in production.",
    badgeClassName: "border-orange-200 bg-orange-50 text-orange-700",
  },
  waiting_for_delivery: {
    label: "Waiting for delivery",
    description: "Production is complete and we are preparing shipment or handoff.",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  delivered: {
    label: "Delivered",
    description: "The order has been delivered.",
    badgeClassName: "border-slate-300 bg-slate-100 text-slate-700",
  },
};

function getStorageKey(orderNumber: string) {
  return `${STORAGE_PREFIX}:${orderNumber}`;
}

function getDepositConfirmedStorageKey(orderNumber: string) {
  return `${DEPOSIT_CONFIRMED_PREFIX}:${orderNumber}`;
}

function getBikeSpecificationStorageKey(orderNumber: string) {
  return `${BIKE_SPECIFICATION_PREFIX}:${orderNumber}`;
}

export function getStoredOrderStage(orderNumber: string): OrderStage {
  if (typeof window === "undefined") {
    return "waiting_for_deposit";
  }

  const stored = window.localStorage.getItem(getStorageKey(orderNumber));
  if (stored && ORDER_STAGES.includes(stored as OrderStage)) {
    return stored as OrderStage;
  }

  return "waiting_for_deposit";
}

export function setStoredOrderStage(orderNumber: string, stage: OrderStage) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getStorageKey(orderNumber), stage);
}

export function getStoredDepositConfirmed(orderNumber: string) {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(getDepositConfirmedStorageKey(orderNumber)) === "true";
}

export function setStoredDepositConfirmed(orderNumber: string, confirmed: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getDepositConfirmedStorageKey(orderNumber), String(confirmed));
}

export function getStoredBikeSpecificationDraft(
  orderNumber: string,
): StoredBikeSpecificationDraft {
  if (typeof window === "undefined") {
    return { specificationMode: null, values: {} };
  }

  const stored = window.localStorage.getItem(getBikeSpecificationStorageKey(orderNumber));

  if (!stored) {
    return { specificationMode: null, values: {} };
  }

  try {
    const parsed = JSON.parse(stored) as Partial<StoredBikeSpecificationDraft>;
    const specificationMode =
      parsed.specificationMode === "guided_by_designer" ||
      parsed.specificationMode === "self_specified" ||
      parsed.specificationMode === "frame_only"
        ? parsed.specificationMode
        : null;

    const values =
      parsed.values && typeof parsed.values === "object" && !Array.isArray(parsed.values)
        ? Object.fromEntries(
            Object.entries(parsed.values).filter(
              (entry): entry is [string, string] => typeof entry[1] === "string",
            ),
          )
        : {};

    return { specificationMode, values };
  } catch {
    return { specificationMode: null, values: {} };
  }
}

export function setStoredBikeSpecificationDraft(
  orderNumber: string,
  draft: StoredBikeSpecificationDraft,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getBikeSpecificationStorageKey(orderNumber), JSON.stringify(draft));
}

export function resetStoredOrderStage(orderNumber: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getStorageKey(orderNumber));
  window.localStorage.removeItem(getBikeSpecificationStorageKey(orderNumber));
}

export function getNextOrderStage(stage: OrderStage): OrderStage {
  const currentIndex = ORDER_STAGES.indexOf(stage);
  if (currentIndex === -1 || currentIndex === ORDER_STAGES.length - 1) {
    return stage;
  }

  return ORDER_STAGES[currentIndex + 1];
}

export async function mockProcessDeposit(orderNumber: string) {
  await new Promise((resolve) => window.setTimeout(resolve, 1200));
  setStoredOrderStage(orderNumber, "in_review");
  return "in_review" as const;
}
