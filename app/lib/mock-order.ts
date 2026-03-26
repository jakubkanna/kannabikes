export type OrderStage =
  | "waiting_for_deposit"
  | "in_review"
  | "confirmed"
  | "waiting_for_measurements"
  | "waiting_for_specification"
  | "waiting_for_design"
  | "waiting_for_design_approval"
  | "waiting_for_final_payment"
  | "final_payment_in_review"
  | "in_production"
  | "waiting_for_delivery"
  | "delivered";

export type WooDisplayStatus =
  | "pending_payment"
  | "on_hold"
  | "processing"
  | "completed";

type OrderStageDefinition = {
  label: string;
  description: string;
  badgeClassName: string;
};

type WooDisplayStatusDefinition = {
  label: string;
  badgeClassName: string;
};

const STORAGE_PREFIX = "kanna-order-stage";
const DEPOSIT_CONFIRMED_PREFIX = "kanna-order-deposit-confirmed";
const DEPOSIT_PAYMENT_PREFIX = "kanna-order-deposit-payment";
const BIKE_SPECIFICATION_PREFIX = "kanna-order-bike-specification";

export const MOCK_DEPOSIT_AMOUNT = "590 EUR";
export const MOCK_FINAL_PRICE_EXCLUDING_DEPOSIT = "3 200 EUR";
export const MOCK_ESTIMATED_DELIVERY_TIME = "6-8 weeks";
export const MOCK_DELIVERED_ON = "21 Mar 2026";

export type StoredBikeSpecificationDraft = {
  specificationMode:
    | "guided_by_designer"
    | "self_specified"
    | "frame_only"
    | null;
  values: Record<string, string>;
};

export type DepositPaymentMethod = "stripe" | "classic_transfer";

export type StoredDepositPayment = {
  amount: string;
  paidAt: string | null;
  paymentMethod: DepositPaymentMethod;
};

export const ORDER_STAGES: OrderStage[] = [
  "waiting_for_deposit",
  "in_review",
  "confirmed",
  "waiting_for_measurements",
  "waiting_for_specification",
  "waiting_for_design",
  "waiting_for_design_approval",
  "waiting_for_final_payment",
  "final_payment_in_review",
  "in_production",
  "waiting_for_delivery",
  "delivered",
];

export const ORDER_STAGE_DEFINITIONS: Record<OrderStage, OrderStageDefinition> =
  {
    waiting_for_deposit: {
      label: "Waiting for deposit",
      description:
        "We are waiting for the initial deposit before we can open the order for review.",
      badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
    },
    in_review: {
      label: "In review",
      description:
        "The payment is being verified manually before the order moves to the measurement step.",
      badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
    },
    confirmed: {
      label: "Confirmed",
      description:
        "Your deposit has been received. Complete your measurements and specification to move the project into design.",
      badgeClassName: "border-cyan-200 bg-cyan-50 text-cyan-700",
    },
    waiting_for_measurements: {
      label: "Waiting for measurements",
      description:
        "The deposit is confirmed. We are waiting for your body measurements before moving the project into specification.",
      badgeClassName: "border-cyan-200 bg-cyan-50 text-cyan-700",
    },
    waiting_for_specification: {
      label: "Waiting for specification",
      description:
        "Measurements are received and the project is waiting for the bike specification to move into design.",
      badgeClassName: "border-cyan-200 bg-cyan-50 text-cyan-700",
    },
    waiting_for_design: {
      label: "Design in progress",
      description:
        "Review is complete and the order is queued for the design phase.",
      badgeClassName: "border-violet-200 bg-violet-50 text-violet-700",
    },
    waiting_for_design_approval: {
      label: "Design waiting for approval",
      description:
        "The design is prepared and waiting for your approval before production starts.",
      badgeClassName: "border-indigo-200 bg-indigo-50 text-indigo-700",
    },
    waiting_for_final_payment: {
      label: "Waiting for final payment",
      description:
        "The design is approved and we are waiting for the remaining payment before production starts.",
      badgeClassName: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
    },
    final_payment_in_review: {
      label: "In review",
      description:
        "The final payment is being reviewed and production will begin after confirmation.",
      badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
    },
    in_production: {
      label: "In production",
      description: "Your frame and configuration are now in production.",
      badgeClassName: "border-orange-200 bg-orange-50 text-orange-700",
    },
    waiting_for_delivery: {
      label: "Ready",
      description: "Your bicycle is ready for delivery or pickup.",
      badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    delivered: {
      label: "Delivered",
      description: "The order has been delivered.",
      badgeClassName: "border-gray-300 bg-gray-100 text-gray-700",
    },
  };

export const WOO_DISPLAY_STATUS_DEFINITIONS: Record<
  WooDisplayStatus,
  WooDisplayStatusDefinition
> = {
  pending_payment: {
    label: "Pending payment",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
  },
  on_hold: {
    label: "On hold",
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
  },
  processing: {
    label: "Processing",
    badgeClassName: "border-violet-200 bg-violet-50 text-violet-700",
  },
  completed: {
    label: "Completed",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
};

export function getWooDisplayStatus(stage: OrderStage): WooDisplayStatus {
  switch (stage) {
    case "waiting_for_deposit":
    case "waiting_for_final_payment":
      return "pending_payment";
    case "in_review":
    case "waiting_for_measurements":
    case "waiting_for_specification":
    case "waiting_for_design_approval":
    case "final_payment_in_review":
      return "on_hold";
    case "confirmed":
    case "waiting_for_design":
    case "in_production":
    case "waiting_for_delivery":
      return "processing";
    case "delivered":
      return "completed";
  }
}

function getStorageKey(orderNumber: string) {
  return `${STORAGE_PREFIX}:${orderNumber}`;
}

function getDepositConfirmedStorageKey(orderNumber: string) {
  return `${DEPOSIT_CONFIRMED_PREFIX}:${orderNumber}`;
}

function getBikeSpecificationStorageKey(orderNumber: string) {
  return `${BIKE_SPECIFICATION_PREFIX}:${orderNumber}`;
}

function getDepositPaymentStorageKey(orderNumber: string) {
  return `${DEPOSIT_PAYMENT_PREFIX}:${orderNumber}`;
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

  return (
    window.localStorage.getItem(getDepositConfirmedStorageKey(orderNumber)) ===
    "true"
  );
}

export function setStoredDepositConfirmed(
  orderNumber: string,
  confirmed: boolean,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getDepositConfirmedStorageKey(orderNumber),
    String(confirmed),
  );
}

export function getStoredDepositPayment(
  orderNumber: string,
): StoredDepositPayment | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(
    getDepositPaymentStorageKey(orderNumber),
  );

  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<StoredDepositPayment>;

    const paymentMethod =
      parsed.paymentMethod === "stripe" ||
      parsed.paymentMethod === "classic_transfer"
        ? parsed.paymentMethod
        : null;

    if (
      typeof parsed.amount !== "string" ||
      (parsed.paidAt !== null && typeof parsed.paidAt !== "string") ||
      paymentMethod === null
    ) {
      return null;
    }

    return {
      amount: parsed.amount,
      paidAt: parsed.paidAt,
      paymentMethod,
    };
  } catch {
    return null;
  }
}

export function setStoredDepositPayment(
  orderNumber: string,
  payment: StoredDepositPayment,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getDepositPaymentStorageKey(orderNumber),
    JSON.stringify(payment),
  );
}

export function getStoredBikeSpecificationDraft(
  orderNumber: string,
): StoredBikeSpecificationDraft {
  if (typeof window === "undefined") {
    return { specificationMode: null, values: {} };
  }

  const stored = window.localStorage.getItem(
    getBikeSpecificationStorageKey(orderNumber),
  );

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
      parsed.values &&
      typeof parsed.values === "object" &&
      !Array.isArray(parsed.values)
        ? Object.fromEntries(
            Object.entries(parsed.values).filter(
              (entry): entry is [string, string] =>
                typeof entry[1] === "string",
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

  window.localStorage.setItem(
    getBikeSpecificationStorageKey(orderNumber),
    JSON.stringify(draft),
  );
}

export function resetStoredOrderStage(orderNumber: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getStorageKey(orderNumber));
  window.localStorage.removeItem(getDepositConfirmedStorageKey(orderNumber));
  window.localStorage.removeItem(getDepositPaymentStorageKey(orderNumber));
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
  setStoredOrderStage(orderNumber, "waiting_for_measurements");
  return "waiting_for_measurements" as const;
}
