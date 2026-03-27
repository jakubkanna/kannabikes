import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { Button } from "~/components/button";
import { CustomerSignInForm } from "~/components/customer-sign-in-form";
import { useLocale, useMessages } from "~/components/locale-provider";
import { InputField } from "~/components/form-field";
import { PageShell } from "~/components/page-container";
import { SectionPill } from "~/components/section-pill";
import {
  OrderBikeDesignSection,
  OrderBikeDesignPreviewSection,
  OrderDepositSection,
  OrderMeasurementsSection,
  OrderPendingSection,
  OrderProductionPreviewSection,
  OrderStatusBadge,
  SectionStack,
} from "~/components/order-page/index";
import {
  AnimatedOrderSection,
  ORDER_LAYOUT_TRANSITION,
} from "~/components/order-page/order-motion";
import { getGoogleAuthUrl } from "~/lib/auth";
import {
  fetchCustomerSession,
  type CustomerSession,
} from "~/lib/customer-account";
import {
  approveDesign,
  claimOrderPortal,
  claimOrderPortalFromAccount,
  createOrderPortalSessionFromAccount,
  clearStoredPortalSession,
  fetchOrderPortalBuild,
  getStoredPortalSession,
  OrderPortalApiError,
  requestPaymentLink,
  requestShippingQuote,
  setStoredPortalSession,
  submitMeasurements,
  submitSpecification,
  type OrderPortalPayload,
  type OrderShippingAddress,
} from "~/lib/order-api";
import {
  getWooDisplayStatus,
  type DepositPaymentMethod,
  type OrderStage,
  type StoredDepositPayment,
} from "~/lib/mock-order";
import { localizePath, type Locale } from "~/lib/i18n";
import { formatOrderMoney } from "~/lib/order-tax";
import { SITE_NAME } from "~/root";

type MeasurementKey = "A" | "B" | "C" | "D" | "E" | "F";
type BodyType = "male" | "female";

type MeasurementValues = Record<MeasurementKey, string>;

const MEASUREMENT_KEYS: MeasurementKey[] = ["A", "B", "C", "D", "E", "F"];

export function buildOrderNumber(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}01`;
}

function normalizeMeasurementValues(
  values: Record<string, string>,
): MeasurementValues {
  return {
    A: values.A ?? "",
    B: values.B ?? "",
    C: values.C ?? "",
    D: values.D ?? "",
    E: values.E ?? "",
    F: values.F ?? "",
  };
}

function getSessionStoragePaymentKey(orderNumber: string) {
  return `kanna-last-deposit-payment:${orderNumber}`;
}

function getPendingDepositPaymentKey(orderNumber: string) {
  return `kanna-pending-deposit-payment:${orderNumber}`;
}

function getStoredLastDepositPayment(
  orderNumber: string,
): StoredDepositPayment | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.sessionStorage.getItem(
    getSessionStoragePaymentKey(orderNumber),
  );

  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as StoredDepositPayment;

    if (
      typeof parsed.amount === "string" &&
      typeof parsed.paidAt === "string" &&
      (parsed.paymentMethod === "stripe" ||
        parsed.paymentMethod === "classic_transfer")
    ) {
      return parsed;
    }
  } catch {}

  return null;
}

function setStoredLastDepositPayment(
  orderNumber: string,
  payment: StoredDepositPayment,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    getSessionStoragePaymentKey(orderNumber),
    JSON.stringify(payment),
  );
}

function getPendingDepositPaymentMethod(orderNumber: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.sessionStorage.getItem(
    getPendingDepositPaymentKey(orderNumber),
  );

  return stored === "stripe" || stored === "classic_transfer" ? stored : null;
}

function setPendingDepositPaymentMethod(
  orderNumber: string,
  paymentMethod: DepositPaymentMethod,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    getPendingDepositPaymentKey(orderNumber),
    paymentMethod,
  );
}

function clearPendingDepositPaymentMethod(orderNumber: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(getPendingDepositPaymentKey(orderNumber));
}

type OrderAccountAccessProps = {
  customer: OrderPortalPayload["customer"] | null;
  errorMessage: string | null;
  isLoadingSession: boolean;
  isSubmittingActivation: boolean;
  locale: Locale;
  onSignInSuccess: (session: CustomerSession) => void | Promise<void>;
  onActivate: (payload: { password: string; confirmPassword: string }) => void;
  password: string;
  passwordConfirm: string;
  redirectTo: string;
  setPassword: (value: string) => void;
  setPasswordConfirm: (value: string) => void;
};

function OrderAccountAccess({
  customer,
  errorMessage,
  isLoadingSession,
  isSubmittingActivation,
  locale,
  onSignInSuccess,
  onActivate,
  password,
  passwordConfirm,
  redirectTo,
  setPassword,
  setPasswordConfirm,
}: OrderAccountAccessProps) {
  const messages = useMessages();
  const accountMessages = messages.account;
  const orderMessages = messages.orderPortal;
  const accountActivated = customer?.accountActivated ?? true;
  const googleAuthUrl = useMemo(
    () =>
      getGoogleAuthUrl({
        intent: accountActivated ? "sign-in" : "sign-up",
        locale,
        redirectTo,
      }),
    [accountActivated, locale, redirectTo],
  );
  const effectiveTitle = accountActivated
    ? orderMessages.continueWithAccount
    : orderMessages.activateAccount;

  return (
    <div>
      <h2 className="mt-2 text-xl font-semibold text-gray-900">
        {effectiveTitle}
      </h2>

      {isLoadingSession ? (
        <p className="mt-5 text-sm text-gray-600">
          {orderMessages.checkingAccount}
        </p>
      ) : accountActivated ? (
        <div className="mt-5 max-w-2xl">
          <CustomerSignInForm
            initialLoginValue={customer?.email ?? ""}
            locale={locale}
            showSignUpPrompt={false}
            onSuccess={onSignInSuccess}
            redirectTo={redirectTo}
          />
          {errorMessage ? (
            <p className="mt-4 text-sm text-red-600">{errorMessage}</p>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 max-w-2xl">
          <p className="text-sm leading-6 text-gray-600">
            {orderMessages.accountActivationHint}{" "}
            <a
              href={googleAuthUrl ?? "#"}
              className="font-semibold underline underline-offset-2 transition hover:text-black"
            >
              {accountMessages.continueWithGoogle}
            </a>
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                {accountMessages.passwordLabel}
              </span>
              <InputField
                autoComplete="new-password"
                minLength={8}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                {accountMessages.confirmPasswordLabel}
              </span>
              <InputField
                autoComplete="new-password"
                minLength={8}
                type="password"
                value={passwordConfirm}
                onChange={(event) =>
                  setPasswordConfirm(event.currentTarget.value)
                }
              />
            </label>
          </div>

          <p className="mt-3 text-xs leading-5 text-gray-600">
            {orderMessages.passwordActivationNotice}
          </p>

          {errorMessage ? (
            <p className="mt-4 text-sm text-red-600">{errorMessage}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              type="button"
              size="sm"
              disabled={isSubmittingActivation}
              onClick={() =>
                onActivate({
                  confirmPassword: passwordConfirm,
                  password,
                })
              }
            >
              {isSubmittingActivation
                ? orderMessages.activatingAccount
                : orderMessages.activateAccount}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function OrderPage({
  claimToken,
  orderNumber,
}: {
  claimToken?: string;
  orderNumber: string;
}) {
  const locale = useLocale();
  const messages = useMessages();
  const orderMessages = messages.orderPortal;
  const productionSectionRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollToProductionRef = useRef(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [activeMeasurement, setActiveMeasurement] =
    useState<MeasurementKey | null>(null);
  const [expandedGuidelineKey, setExpandedGuidelineKey] =
    useState<MeasurementKey | null>(null);
  const [bodyType, setBodyType] = useState<BodyType>("male");
  const [bodyWeight, setBodyWeight] = useState<string>("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isSubmittingMeasurements, setIsSubmittingMeasurements] =
    useState(false);
  const [isSubmittingSpecification, setIsSubmittingSpecification] =
    useState(false);
  const [isSubmittingFinalPayment, setIsSubmittingFinalPayment] =
    useState(false);
  const [isApprovingDesign, setIsApprovingDesign] = useState(false);
  const [isLoadingCustomerSession, setIsLoadingCustomerSession] =
    useState(true);
  const [isResolvingAccountAccess, setIsResolvingAccountAccess] =
    useState(false);
  const [isSubmittingAccountActivation, setIsSubmittingAccountActivation] =
    useState(false);
  const [measurementArrowsSvgMarkup, setMeasurementArrowsSvgMarkup] =
    useState("");
  const [accountAccessError, setAccountAccessError] = useState<string | null>(
    null,
  );
  const [accountPassword, setAccountPassword] = useState("");
  const [accountPasswordConfirm, setAccountPasswordConfirm] = useState("");
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(
    null,
  );
  const [orderError, setOrderError] = useState<string | null>(null);
  const [depositClaimError, setDepositClaimError] = useState<string | null>(
    null,
  );
  const [portalBuild, setPortalBuild] = useState<OrderPortalPayload | null>(
    null,
  );
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [sessionToken, setSessionToken] = useState(() =>
    getStoredPortalSession(orderNumber),
  );
  const [isLoadingBuild, setIsLoadingBuild] = useState(true);
  const [depositPayment, setDepositPayment] =
    useState<StoredDepositPayment | null>(() =>
      getStoredLastDepositPayment(orderNumber),
    );
  const [pendingDepositPaymentMethod, setPendingDepositPaymentMethodState] =
    useState<DepositPaymentMethod | null>(() =>
      getPendingDepositPaymentMethod(orderNumber),
    );
  const autoAccessAttemptedRef = useRef<Set<string>>(
    new Set<string>(),
  );
  const [bikeSpecification, setBikeSpecification] = useState<
    Record<string, string>
  >({});
  const [specificationAttachmentFile, setSpecificationAttachmentFile] =
    useState<File | null>(null);
  const [specificationMode, setSpecificationMode] = useState<
    "guided_by_designer" | "self_specified" | "frame_only" | null
  >(null);
  const [values, setValues] = useState<MeasurementValues>({
    A: "",
    B: "",
    C: "",
    D: "",
    E: "",
    F: "",
  });

  const activateMeasurement = (key: MeasurementKey) => {
    setActiveMeasurement(key);
    setExpandedGuidelineKey((prev) => (prev === key ? prev : null));
  };
  const deactivateMeasurement = () => {
    setActiveMeasurement(null);
  };
  const baseUrl = import.meta.env.BASE_URL;
  const selectedBodySrc =
    bodyType === "female"
      ? `${baseUrl}bodies/body-kannabikes-F.svg`
      : `${baseUrl}bodies/body-kannabikes-M.svg`;
  const bikeDrawingSrc = `${baseUrl}bike-drawing.png`;
  const designPreviewSrc = portalBuild?.designState.imageUrl || bikeDrawingSrc;
  const orderStage: OrderStage = portalBuild?.stage ?? "waiting_for_deposit";
  const isDepositConfirmed = portalBuild?.deposit.isConfirmed ?? false;
  const measurementsUnlocked =
    portalBuild?.accessState === "authenticated" &&
    orderStage !== "waiting_for_deposit";
  const measurementsSubmitted =
    portalBuild?.measurementState.isSubmitted ||
    orderStage === "waiting_for_specification" ||
    orderStage === "waiting_for_design" ||
    orderStage === "waiting_for_design_approval" ||
    orderStage === "waiting_for_final_payment" ||
    orderStage === "final_payment_in_review" ||
    orderStage === "in_production" ||
    orderStage === "waiting_for_delivery" ||
    orderStage === "delivered";
  const bikeDesignUnlocked = measurementsSubmitted;
  const bikeDesignSubmitted =
    portalBuild?.specificationState.isSubmitted ||
    orderStage === "waiting_for_design" ||
    orderStage === "waiting_for_design_approval" ||
    orderStage === "waiting_for_final_payment" ||
    orderStage === "final_payment_in_review" ||
    orderStage === "in_production" ||
    orderStage === "waiting_for_delivery" ||
    orderStage === "delivered";
  const headerDisplayStatus =
    portalBuild?.displayStatus ?? getWooDisplayStatus(orderStage);
  const showHeaderStatus = portalBuild?.accessState === "authenticated";
  const orderPath = localizePath(`/order/${orderNumber}`, locale);
  const orderRedirectPath = claimToken
    ? `${orderPath}?claim_token=${encodeURIComponent(claimToken)}`
    : orderPath;

  useEffect(() => {
    document.title = `${SITE_NAME} – ${messages.meta.order.title} ${orderNumber}`;
  }, [messages.meta.order.title, orderNumber]);

  useEffect(() => {
    autoAccessAttemptedRef.current = new Set<string>();
  }, [orderNumber]);

  useEffect(() => {
    let cancelled = false;

    const loadCustomerSession = async () => {
      setIsLoadingCustomerSession(true);

      try {
        const session = await fetchCustomerSession(locale);

        if (!cancelled) {
          setCustomerSession(session);
        }
      } catch {
        if (!cancelled) {
          setCustomerSession(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCustomerSession(false);
        }
      }
    };

    void loadCustomerSession();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    let cancelled = false;

    fetch(`${baseUrl}bodies/measurement-arrows.svg`)
      .then((response) => response.text())
      .then((markup) => {
        if (!cancelled) {
          setMeasurementArrowsSvgMarkup(markup);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMeasurementArrowsSvgMarkup("");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [baseUrl]);

  useEffect(() => {
    if (!portalBuild) {
      return;
    }

    setBodyType(portalBuild.measurementState.bodyType);
    setBodyWeight(portalBuild.measurementState.bodyWeight);
    setValues(normalizeMeasurementValues(portalBuild.measurementState.values));
    setBikeSpecification(portalBuild.specificationState.values);
    setSpecificationAttachmentFile(null);
    setSpecificationMode(portalBuild.specificationState.specificationMode);
  }, [portalBuild]);

  useEffect(() => {
    if (
      !shouldScrollToProductionRef.current ||
      orderStage !== "waiting_for_final_payment"
    ) {
      return;
    }

    shouldScrollToProductionRef.current = false;

    window.requestAnimationFrame(() => {
      productionSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [orderStage]);

  useEffect(() => {
    if (
      !portalBuild?.deposit.isConfirmed ||
      !portalBuild.deposit.paymentMethod
    ) {
      if (!portalBuild?.deposit.paymentMethod) {
        return;
      }
    }

    const nextPayment: StoredDepositPayment = {
      amount: portalBuild.deposit.amount,
      paidAt: portalBuild.deposit.paidAt,
      paymentMethod: portalBuild.deposit.paymentMethod,
    };

    setDepositPayment((currentPayment) => {
      if (
        currentPayment &&
        currentPayment.amount === nextPayment.amount &&
        currentPayment.paidAt === nextPayment.paidAt &&
        currentPayment.paymentMethod === nextPayment.paymentMethod
      ) {
        return currentPayment;
      }

      setStoredLastDepositPayment(orderNumber, nextPayment);
      return nextPayment;
    });
  }, [orderNumber, portalBuild]);

  useEffect(() => {
    let cancelled = false;

    const loadBuild = async (activeSessionToken?: string) => {
      setIsLoadingBuild(true);
      setOrderError(null);

      try {
        const build = await fetchOrderPortalBuild({
          claimToken,
          publicOrderNumber: orderNumber,
          sessionToken: activeSessionToken,
        });

        if (!cancelled) {
          setRequiresLogin(false);
          setAccountAccessError(null);
          setPortalBuild(build);
        }
      } catch (error) {
        if (activeSessionToken) {
          clearStoredPortalSession(orderNumber);
          setSessionToken("");

          if (!cancelled) {
            loadBuild("");
          }

          return;
        }

        if (!cancelled) {
          if (
            error instanceof OrderPortalApiError &&
            error.code === "unauthorized" &&
            !claimToken
          ) {
            setPortalBuild(null);
            setRequiresLogin(true);
            setOrderError(null);
            return;
          }

          setOrderError(
            error instanceof Error
              ? error.message
              : orderMessages.loadError,
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingBuild(false);
        }
      }
    };

    void loadBuild(sessionToken);

    return () => {
      cancelled = true;
    };
  }, [claimToken, orderNumber, sessionToken]);

  const applyPortalSession = (
    payload: { build: OrderPortalPayload; sessionToken: string },
    options?: { clearClaimToken?: boolean },
  ) => {
    setSessionToken(payload.sessionToken);
    setStoredPortalSession(orderNumber, payload.sessionToken);
    setPortalBuild(payload.build);
    setRequiresLogin(false);
    setDepositClaimError(null);
    setAccountAccessError(null);

    if (options?.clearClaimToken) {
      window.history.replaceState({}, document.title, orderPath);
    }
  };

  const clearPendingDepositIntent = () => {
    clearPendingDepositPaymentMethod(orderNumber);
    setPendingDepositPaymentMethodState(null);
  };

  const storePendingDepositIntent = (paymentMethod: DepositPaymentMethod) => {
    setPendingDepositPaymentMethod(orderNumber, paymentMethod);
    setPendingDepositPaymentMethodState(paymentMethod);
  };

  const continueDepositPayment = async ({
    build,
    paymentMethod,
    portalSessionToken,
  }: {
    build: OrderPortalPayload;
    paymentMethod: DepositPaymentMethod;
    portalSessionToken: string;
  }) => {
    const response = await requestPaymentLink({
      paymentKind: "deposit",
      paymentMethod,
      publicOrderNumber: orderNumber,
      sessionToken: portalSessionToken,
    });

    const nextPayment: StoredDepositPayment = {
      amount: build.deposit.amount,
      paidAt: new Date().toISOString(),
      paymentMethod,
    };

    setPortalBuild(response.build);
    setDepositPayment(nextPayment);
    setStoredLastDepositPayment(orderNumber, nextPayment);
    clearPendingDepositIntent();
    window.location.assign(response.paymentUrl);
  };

  const bridgeCustomerSessionToOrder = async ({
    clearClaimToken = false,
    mode,
    session,
  }: {
    clearClaimToken?: boolean;
    mode: "claim" | "session";
    session: CustomerSession;
  }) => {
    if (!session.authenticated || !session.csrfToken) {
      throw new Error(orderMessages.signInRequired);
    }

    setIsResolvingAccountAccess(true);

    try {
      const payload =
        mode === "claim" && claimToken
          ? await claimOrderPortalFromAccount({
              claimToken,
              csrfToken: session.csrfToken,
              publicOrderNumber: orderNumber,
            })
          : await createOrderPortalSessionFromAccount({
              csrfToken: session.csrfToken,
              publicOrderNumber: orderNumber,
            });

      applyPortalSession(payload, { clearClaimToken });

      if (
        pendingDepositPaymentMethod &&
        payload.build.stage === "waiting_for_deposit"
      ) {
        await continueDepositPayment({
          build: payload.build,
          paymentMethod: pendingDepositPaymentMethod,
          portalSessionToken: payload.sessionToken,
        });
      } else if (pendingDepositPaymentMethod) {
        clearPendingDepositIntent();
      }

      return payload;
    } finally {
      setIsResolvingAccountAccess(false);
    }
  };

  useEffect(() => {
    if (
      !customerSession?.authenticated ||
      !customerSession.csrfToken ||
      !portalBuild ||
      portalBuild.accessState !== "claim_required" ||
      !claimToken
    ) {
      return;
    }

    const attemptKey = `claim:${orderNumber}:${customerSession.user?.id ?? 0}:${claimToken}`;

    if (autoAccessAttemptedRef.current.has(attemptKey)) {
      return;
    }

    autoAccessAttemptedRef.current.add(attemptKey);

    void bridgeCustomerSessionToOrder({
      clearClaimToken: true,
      mode: "claim",
      session: customerSession,
    }).catch((error) => {
      setDepositClaimError(
        error instanceof Error
          ? error.message
          : orderMessages.connectAccountError,
      );
    });
  }, [claimToken, customerSession, orderMessages.connectAccountError, orderNumber, portalBuild]);

  useEffect(() => {
    if (
      !requiresLogin ||
      !customerSession?.authenticated ||
      !customerSession.csrfToken
    ) {
      return;
    }

    const attemptKey = `session:${orderNumber}:${customerSession.user?.id ?? 0}`;

    if (autoAccessAttemptedRef.current.has(attemptKey)) {
      return;
    }

    autoAccessAttemptedRef.current.add(attemptKey);

    void bridgeCustomerSessionToOrder({
      mode: "session",
      session: customerSession,
    }).catch((error) => {
      setAccountAccessError(
        error instanceof Error
          ? error.message
          : orderMessages.openSignedInAccountError,
      );
    });
  }, [customerSession, orderMessages.openSignedInAccountError, orderNumber, requiresLogin]);

  const handleMeasurementChange = (key: string, value: string) => {
    activateMeasurement(key as MeasurementKey);
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleGuidelines = (key: string) => {
    setExpandedGuidelineKey((prev) =>
      prev === key ? null : (key as MeasurementKey),
    );
  };

  const handlePayDeposit = async ({
    paymentMethod,
  }: {
    paymentMethod: DepositPaymentMethod;
  }) => {
    if (!portalBuild) {
      return;
    }

    setDepositClaimError(null);
    setIsProcessingPayment(true);
    setOrderError(null);

    try {
      if (portalBuild.accessState === "claim_required") {
        if (!agreementAccepted) {
          throw new Error(orderMessages.depositAgreementRequired);
        }

        storePendingDepositIntent(paymentMethod);

        if (!customerSession?.authenticated || !customerSession.csrfToken) {
          setDepositClaimError(
            orderMessages.depositSignInHint,
          );
          return;
        }

        const claimed = await bridgeCustomerSessionToOrder({
          clearClaimToken: true,
          mode: "claim",
          session: customerSession,
        });

        await continueDepositPayment({
          build: claimed.build,
          paymentMethod,
          portalSessionToken: claimed.sessionToken,
        });
        return;
      }

      if (!sessionToken) {
        throw new Error(orderMessages.missingSession);
      }

      await continueDepositPayment({
        build: portalBuild,
        paymentMethod,
        portalSessionToken: sessionToken,
      });
    } catch (error) {
      setOrderError(
        error instanceof Error
          ? error.message
          : orderMessages.prepareDepositError,
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSubmitMeasurements = async () => {
    if (!sessionToken) {
      setOrderError(orderMessages.missingSession);
      return;
    }

    setIsSubmittingMeasurements(true);
    setOrderError(null);

    try {
      const build = await submitMeasurements({
        bodyType,
        bodyWeight,
        publicOrderNumber: orderNumber,
        sessionToken,
        values,
      });
      setPortalBuild(build);
    } catch (error) {
      setOrderError(
        error instanceof Error
          ? error.message
          : orderMessages.submitMeasurementsError,
      );
    } finally {
      setIsSubmittingMeasurements(false);
    }
  };

  const handleBikeSpecificationChange = (key: string, value: string) => {
    setBikeSpecification((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmitSpecification = async () => {
    if (!sessionToken || !specificationMode) {
      setOrderError(orderMessages.missingSession);
      return;
    }

    setIsSubmittingSpecification(true);
    setOrderError(null);

    try {
      const build = await submitSpecification({
        attachment: specificationAttachmentFile ?? undefined,
        publicOrderNumber: orderNumber,
        sessionToken,
        specificationMode,
        values: bikeSpecification,
      });
      setPortalBuild(build);
      setSpecificationAttachmentFile(null);
    } catch (error) {
      setOrderError(
        error instanceof Error
          ? error.message
          : orderMessages.submitSpecificationError,
      );
    } finally {
      setIsSubmittingSpecification(false);
    }
  };

  const handleApproveDesign = async () => {
    if (!sessionToken) {
      setOrderError(orderMessages.missingSession);
      return;
    }

    setIsApprovingDesign(true);
    setOrderError(null);

    try {
      const build = await approveDesign({
        publicOrderNumber: orderNumber,
        sessionToken,
      });
      shouldScrollToProductionRef.current = true;
      setPortalBuild(build);
    } catch (error) {
      setOrderError(
        error instanceof Error
          ? error.message
          : orderMessages.approveDesignError,
      );
    } finally {
      setIsApprovingDesign(false);
    }
  };

  const handleRequestShippingQuote = async (shipping: {
    address: OrderShippingAddress;
    option: "courier" | "pickup";
  }) => {
    if (!sessionToken) {
      throw new Error(orderMessages.missingSession);
    }

    const response = await requestShippingQuote({
      publicOrderNumber: orderNumber,
      sessionToken,
      shipping,
    });

    setPortalBuild((prev) =>
      prev
        ? {
            ...prev,
            shippingState: response.shipping,
          }
        : prev,
    );

    return response.shipping;
  };

  const handleSubmitFinalPayment = async (shipping: {
    address: OrderShippingAddress;
    paymentMethod: DepositPaymentMethod;
    option: "courier" | "pickup";
  }) => {
    if (!sessionToken) {
      setOrderError(orderMessages.missingSession);
      return;
    }

    setIsSubmittingFinalPayment(true);
    setOrderError(null);

    try {
      const response = await requestPaymentLink({
        paymentKind: "final",
        paymentMethod: shipping.paymentMethod,
        publicOrderNumber: orderNumber,
        sessionToken,
        shipping,
      });
      setPortalBuild(response.build);
      window.location.assign(response.paymentUrl);
    } catch (error) {
      setOrderError(
        error instanceof Error
          ? error.message
          : orderMessages.prepareFinalPaymentError,
      );
    } finally {
      setIsSubmittingFinalPayment(false);
    }
  };

  const handleSpecificationModeChange = (
    mode: "guided_by_designer" | "self_specified" | "frame_only",
  ) => {
    setSpecificationMode(mode);
  };

  const handleOrderAccountSession = async (session: CustomerSession) => {
    setCustomerSession(session);
    setAccountAccessError(null);
    setDepositClaimError(null);
    setOrderError(null);

    try {
      if (portalBuild?.accessState === "claim_required" && claimToken) {
        await bridgeCustomerSessionToOrder({
          clearClaimToken: true,
          mode: "claim",
          session,
        });
        return;
      }

      if (requiresLogin) {
        await bridgeCustomerSessionToOrder({
          mode: "session",
          session,
        });
      }
    } catch (error) {
      setAccountAccessError(
        error instanceof Error
          ? error.message
          : orderMessages.connectAccountError,
      );
    }
  };

  const handleOrderAccountActivation = async ({
    confirmPassword,
    password,
  }: {
    confirmPassword: string;
    password: string;
  }) => {
    if (!portalBuild) {
      return;
    }

    setAccountAccessError(null);

    if (!claimToken) {
      setAccountAccessError(orderMessages.invalidActivationLink);
      return;
    }

    if (password.length < 8) {
      setAccountAccessError(messages.account.passwordMinLength);
      return;
    }

    if (password !== confirmPassword) {
      setAccountAccessError(messages.account.passwordMismatch);
      return;
    }

    setIsSubmittingAccountActivation(true);

    try {
      const claimed = await claimOrderPortal({
        claimToken,
        password,
        publicOrderNumber: orderNumber,
      });

      setAccountPassword("");
      setAccountPasswordConfirm("");
      applyPortalSession(claimed, { clearClaimToken: true });

      if (pendingDepositPaymentMethod) {
        await continueDepositPayment({
          build: claimed.build,
          paymentMethod: pendingDepositPaymentMethod,
          portalSessionToken: claimed.sessionToken,
        });
      }
    } catch (error) {
      setAccountAccessError(
        error instanceof Error
          ? error.message
          : messages.account.signUpError,
      );
    } finally {
      setIsSubmittingAccountActivation(false);
    }
  };

  const orderAccessContent = (
    <OrderAccountAccess
      customer={portalBuild?.customer ?? null}
      errorMessage={accountAccessError}
      isLoadingSession={isLoadingCustomerSession || isResolvingAccountAccess}
      isSubmittingActivation={isSubmittingAccountActivation}
      locale={locale}
      onSignInSuccess={handleOrderAccountSession}
      onActivate={handleOrderAccountActivation}
      password={accountPassword}
      passwordConfirm={accountPasswordConfirm}
      redirectTo={orderRedirectPath}
      setPassword={setAccountPassword}
      setPasswordConfirm={setAccountPasswordConfirm}
    />
  );

  return (
    <PageShell>
      <LayoutGroup id={`order-page-${orderNumber}`}>
        <SectionStack>
          <motion.header
            layout
            transition={{ layout: ORDER_LAYOUT_TRANSITION }}
            className="rounded-[28px] border border-stone-200 bg-white px-5 py-5 shadow-sm md:px-7 md:py-6"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <SectionPill>{messages.meta.order.title}</SectionPill>
                <h1 className="page-heading mt-4 text-[2.35rem] leading-[0.88] text-[var(--kanna-ink)] md:text-[3.8rem]">
                  {`${orderNumber}`}
                </h1>
              </div>
              {showHeaderStatus ? (
                <div className="flex items-center md:justify-end md:pt-1">
                  <OrderStatusBadge displayStatus={headerDisplayStatus} />
                </div>
              ) : null}
            </div>
          </motion.header>

          <AnimatePresence initial={false} mode="popLayout">
            {orderError ? (
              <AnimatedOrderSection
                key="order-error"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm"
              >
                {orderError}
              </AnimatedOrderSection>
            ) : null}
          </AnimatePresence>

          <AnimatePresence initial={false} mode="popLayout">
            {isLoadingBuild && !portalBuild ? (
              <AnimatedOrderSection
                key="order-loading"
                className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
              >
                <p className="text-sm text-gray-600">
                  {orderMessages.loadingConfigurator}
                </p>
              </AnimatedOrderSection>
            ) : null}
          </AnimatePresence>

          <AnimatePresence initial={false} mode="popLayout">
            {!isLoadingBuild && requiresLogin ? (
              <AnimatedOrderSection
                key="order-login"
                className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                  {orderMessages.protectedOrder}
                </p>
                {orderAccessContent}
              </AnimatedOrderSection>
            ) : null}
          </AnimatePresence>

          {portalBuild ? (
            <>
              <OrderDepositSection
                agreementAccepted={agreementAccepted}
                availablePaymentMethods={portalBuild.availablePaymentMethods}
                currentStage={orderStage}
                customerDetails={portalBuild.customer}
                depositAmountLabel={formatOrderMoney(
                  portalBuild.deposit.amountValue,
                  portalBuild.deposit.currency,
                  locale,
                )}
                depositAmountValue={portalBuild.deposit.amountValue}
                depositCurrency={portalBuild.deposit.currency}
                depositOrderStatus={portalBuild.deposit.orderStatus}
                depositPayment={depositPayment}
                claimError={depositClaimError}
                isDepositConfirmed={isDepositConfirmed}
                isProcessingPayment={isProcessingPayment}
                onAgreementChange={setAgreementAccepted}
                orderNumber={orderNumber}
                onPayDeposit={handlePayDeposit}
                orderAccessContent={orderAccessContent}
                requiresClaim={portalBuild.accessState === "claim_required"}
              />

              <AnimatePresence initial={false} mode="popLayout">
                {measurementsUnlocked ? (
                  <OrderMeasurementsSection
                    key="order-measurements-active"
                    activeMeasurement={activeMeasurement}
                    bodyType={bodyType}
                    bodyWeight={bodyWeight}
                    expandedGuidelineKey={expandedGuidelineKey}
                    isSubmitting={isSubmittingMeasurements}
                    isSubmitted={measurementsSubmitted}
                    measurementArrowsSvgMarkup={measurementArrowsSvgMarkup}
                    measurementKeys={MEASUREMENT_KEYS}
                    selectedBodySrc={selectedBodySrc}
                    values={values}
                    onActivateMeasurement={(key) =>
                      activateMeasurement(key as MeasurementKey)
                    }
                    onDeactivateMeasurement={deactivateMeasurement}
                    onBodyTypeChange={setBodyType}
                    onBodyWeightChange={setBodyWeight}
                    onMeasurementChange={handleMeasurementChange}
                    onSubmit={handleSubmitMeasurements}
                    onToggleGuidelines={handleToggleGuidelines}
                  />
                ) : (
                  <OrderPendingSection
                    key="order-measurements-pending"
                    title={orderMessages.measurementPreviewTitle}
                    titleStyle="eyebrow"
                    description={orderMessages.measurementPreviewDescription}
                  />
                )}
              </AnimatePresence>

              <AnimatePresence initial={false} mode="popLayout">
                {measurementsUnlocked && !bikeDesignUnlocked ? (
                  <OrderBikeDesignPreviewSection key="order-bike-preview" />
                ) : null}
              </AnimatePresence>

              {bikeDesignUnlocked ? (
                <>
                  <OrderBikeDesignSection
                    artistNote={portalBuild.designState.artistNote}
                    attachmentFile={specificationAttachmentFile}
                    isApproving={isApprovingDesign}
                    bikeDrawingSrc={bikeDrawingSrc}
                    designValues={portalBuild.designState.values}
                    designPreviewSrc={designPreviewSrc}
                    currentStage={orderStage}
                    depositOrderStatus={portalBuild.deposit.orderStatus}
                    finalAmountLabel={formatOrderMoney(
                      portalBuild.finalPayment.amountValue,
                      portalBuild.finalPayment.currency,
                      locale,
                    )}
                    isDepositConfirmed={isDepositConfirmed}
                    isSubmitting={isSubmittingSpecification}
                    isSubmitted={bikeDesignSubmitted}
                    specificationMode={specificationMode}
                    onAttachmentChange={setSpecificationAttachmentFile}
                    onApprove={handleApproveDesign}
                    values={bikeSpecification}
                    onModeChange={handleSpecificationModeChange}
                    onSubmit={handleSubmitSpecification}
                    onValueChange={handleBikeSpecificationChange}
                  />
                  <div ref={productionSectionRef}>
                    <OrderProductionPreviewSection
                      availablePaymentMethods={
                        portalBuild.availablePaymentMethods
                      }
                      currentStage={orderStage}
                      depositAmountValue={portalBuild.deposit.amountValue}
                      finalAmountValue={portalBuild.finalPayment.amountValue}
                      currency={portalBuild.finalPayment.currency}
                      finalPaymentMethod={
                        portalBuild.finalPayment.paymentMethod
                      }
                      finalPaymentOrderStatus={
                        portalBuild.finalPayment.orderStatus
                      }
                      finalPaymentPaidAt={portalBuild.finalPayment.paidAt}
                      initialShippingState={{
                        address: portalBuild.shippingState.address,
                        option: portalBuild.shippingState.option,
                        shippingCost: portalBuild.shippingState.shippingCost,
                        shippingRateLabel:
                          portalBuild.shippingState.shippingRateLabel,
                        trackingUrl: portalBuild.shippingState.trackingUrl,
                      }}
                      onCalculateShipping={handleRequestShippingQuote}
                      isSubmittingFinalPayment={isSubmittingFinalPayment}
                      orderNumber={orderNumber}
                      onPayFinalAmount={handleSubmitFinalPayment}
                    />
                  </div>
                </>
              ) : null}
            </>
          ) : null}
        </SectionStack>
      </LayoutGroup>
    </PageShell>
  );
}
