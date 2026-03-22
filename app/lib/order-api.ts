import type {
  DepositPaymentMethod,
  OrderStage,
  WooDisplayStatus,
} from "~/lib/mock-order";

export type PortalAccessState = "authenticated" | "claim_required";

export type OrderPortalPayload = {
  accessState: PortalAccessState;
  availablePaymentMethods: DepositPaymentMethod[];
  customer: {
    email: string;
    fullName: string;
    orderTitle: string;
    phoneNumber: string;
  };
  deposit: {
    amount: string;
    amountValue: number;
    currency: string;
    isConfirmed: boolean;
    orderId: number;
    orderStatus: string;
  };
  designState: {
    approvedAt: string | null;
    artistNote: string;
    imageUrl: string;
    isApproved: boolean;
    isReady: boolean;
    values: Record<string, string>;
  };
  displayStatus: WooDisplayStatus;
  finalPayment: {
    amount: string;
    amountValue: number;
    currency: string;
    isConfirmed: boolean;
    orderId: number;
    orderStatus: string;
  };
  measurementState: {
    bodyType: "male" | "female";
    bodyWeight: string;
    isSubmitted: boolean;
    values: Record<string, string>;
  };
  portalClaimed: boolean;
  publicOrderNumber: string;
  shippingState: {
    address: {
      city: string;
      country: string;
      fullName: string;
      postalCode: string;
      street: string;
    };
    option: "courier" | "pickup";
    shippingCost: number;
    trackingUrl: string;
  };
  specificationState: {
    isSubmitted: boolean;
    specificationMode:
      | "guided_by_designer"
      | "self_specified"
      | "frame_only"
      | null;
    values: Record<string, string>;
  };
  stage: OrderStage;
  stageLabel: string;
};

type ClaimPortalResponse = {
  build: OrderPortalPayload;
  sessionToken: string;
};

type ForgotPasswordResponse = {
  message: string;
  success: boolean;
};

export class OrderPortalApiError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message);
    this.name = "OrderPortalApiError";
    this.code = options?.code;
    this.status = options?.status;
  }
}

type PaymentLinkResponse = {
  build: OrderPortalPayload;
  orderId: number;
  paymentMethod: DepositPaymentMethod;
  paymentUrl: string;
};

const DEFAULT_WORDPRESS_API_BASE =
  import.meta.env.VITE_WORDPRESS_API_BASE_URL ??
  "http://localhost/wp-json/kanna/v1";

function getApiBase() {
  return DEFAULT_WORDPRESS_API_BASE.replace(/\/$/, "");
}

function getSessionStorageKey(publicOrderNumber: string) {
  return `kanna-portal-session:${publicOrderNumber}`;
}

export function getStoredPortalSession(publicOrderNumber: string) {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(getSessionStorageKey(publicOrderNumber)) ?? "";
}

export function setStoredPortalSession(
  publicOrderNumber: string,
  sessionToken: string,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getSessionStorageKey(publicOrderNumber),
    sessionToken,
  );
}

export function clearStoredPortalSession(publicOrderNumber: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getSessionStorageKey(publicOrderNumber));
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | (T & { code?: string; data?: { status?: number }; message?: string })
    | null;

  if (!response.ok) {
    const message =
      payload && typeof payload.message === "string"
        ? payload.message
        : "The order portal request failed.";
    throw new OrderPortalApiError(message, {
      code: payload && typeof payload.code === "string" ? payload.code : undefined,
      status:
        payload &&
        payload.data &&
        typeof payload.data.status === "number"
          ? payload.data.status
          : response.status,
    });
  }

  return payload as T;
}

export async function fetchOrderPortalBuild({
  claimToken,
  publicOrderNumber,
  sessionToken,
}: {
  claimToken?: string;
  publicOrderNumber: string;
  sessionToken?: string;
}) {
  const search = claimToken
    ? `?claim_token=${encodeURIComponent(claimToken)}`
    : "";
  const response = await fetch(
    `${getApiBase()}/portal/builds/${encodeURIComponent(publicOrderNumber)}${search}`,
    {
      headers: sessionToken
        ? {
            Authorization: `Bearer ${sessionToken}`,
          }
        : undefined,
    },
  );

  return parseResponse<OrderPortalPayload>(response);
}

export async function claimOrderPortal({
  claimToken,
  password,
  publicOrderNumber,
}: {
  claimToken: string;
  password: string;
  publicOrderNumber: string;
}) {
  const response = await fetch(`${getApiBase()}/portal/claim`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      claim_token: claimToken,
      password,
      public_order_number: publicOrderNumber,
    }),
  });

  return parseResponse<ClaimPortalResponse>(response);
}

export async function loginOrderPortal({
  password,
  publicOrderNumber,
}: {
  password: string;
  publicOrderNumber: string;
}) {
  const response = await fetch(`${getApiBase()}/portal/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      password,
      public_order_number: publicOrderNumber,
    }),
  });

  return parseResponse<ClaimPortalResponse>(response);
}

export async function requestOrderPortalPasswordReset({
  publicOrderNumber,
}: {
  publicOrderNumber: string;
}) {
  const response = await fetch(`${getApiBase()}/portal/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      public_order_number: publicOrderNumber,
    }),
  });

  return parseResponse<ForgotPasswordResponse>(response);
}

async function authenticatedPortalRequest<T>({
  body,
  method = "POST",
  path,
  publicOrderNumber,
  sessionToken,
}: {
  body?: Record<string, unknown>;
  method?: "GET" | "POST";
  path: string;
  publicOrderNumber: string;
  sessionToken: string;
}) {
  const response = await fetch(
    `${getApiBase()}/portal/builds/${encodeURIComponent(publicOrderNumber)}/${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    },
  );

  return parseResponse<T>(response);
}

export async function submitMeasurements({
  bodyType,
  bodyWeight,
  publicOrderNumber,
  sessionToken,
  values,
}: {
  bodyType: "male" | "female";
  bodyWeight: string;
  publicOrderNumber: string;
  sessionToken: string;
  values: Record<string, string>;
}) {
  return authenticatedPortalRequest<OrderPortalPayload>({
    body: {
      bodyType,
      bodyWeight,
      values,
    },
    path: "measurements",
    publicOrderNumber,
    sessionToken,
  });
}

export async function submitSpecification({
  publicOrderNumber,
  sessionToken,
  specificationMode,
  values,
}: {
  publicOrderNumber: string;
  sessionToken: string;
  specificationMode: "guided_by_designer" | "self_specified" | "frame_only";
  values: Record<string, string>;
}) {
  return authenticatedPortalRequest<OrderPortalPayload>({
    body: {
      specificationMode,
      values,
    },
    path: "specification",
    publicOrderNumber,
    sessionToken,
  });
}

export async function approveDesign({
  publicOrderNumber,
  sessionToken,
}: {
  publicOrderNumber: string;
  sessionToken: string;
}) {
  return authenticatedPortalRequest<OrderPortalPayload>({
    path: "approve-design",
    publicOrderNumber,
    sessionToken,
  });
}

export async function requestPaymentLink({
  paymentKind,
  paymentMethod,
  publicOrderNumber,
  sessionToken,
  shipping,
}: {
  paymentKind: "deposit" | "final";
  paymentMethod: DepositPaymentMethod;
  publicOrderNumber: string;
  sessionToken: string;
  shipping?: {
    address: {
      city: string;
      country: string;
      fullName: string;
      postalCode: string;
      street: string;
    };
    option: "courier" | "pickup";
  };
}) {
  return authenticatedPortalRequest<PaymentLinkResponse>({
    body: {
      paymentKind,
      paymentMethod,
      shipping,
    },
    path: "payment-link",
    publicOrderNumber,
    sessionToken,
  });
}
