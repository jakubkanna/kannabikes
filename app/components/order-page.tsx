import { useEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useLocale } from "~/components/locale-provider";
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
import {
  approveDesign,
  claimOrderPortal,
  clearStoredPortalSession,
  fetchOrderPortalBuild,
  getStoredPortalSession,
  loginOrderPortal,
  OrderPortalApiError,
  requestOrderPortalPasswordReset,
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
import { localizePath } from "~/lib/i18n";
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

function validatePortalPasswordSetup(password: string, repeatPassword: string) {
  const errors: {
    password?: string;
    repeatPassword?: string;
  } = {};

  if (password.trim().length < 8) {
    errors.password = "Enter a password with at least 8 characters.";
  }

  if (repeatPassword.trim().length === 0) {
    errors.repeatPassword = "Repeat your password.";
  } else if (password !== repeatPassword) {
    errors.repeatPassword = "Passwords do not match.";
  }

  return errors;
}

function getSessionStoragePaymentKey(orderNumber: string) {
  return `kanna-last-deposit-payment:${orderNumber}`;
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

export function OrderPage({
  claimToken,
  orderNumber,
}: {
  claimToken?: string;
  orderNumber: string;
}) {
  const locale = useLocale();
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
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [measurementArrowsSvgMarkup, setMeasurementArrowsSvgMarkup] =
    useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginPassword, setLoginPassword] = useState("");
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
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
  const [isClaimingAccess, setIsClaimingAccess] = useState(false);
  const [depositPayment, setDepositPayment] =
    useState<StoredDepositPayment | null>(() =>
      getStoredLastDepositPayment(orderNumber),
    );
  const [passwordResetNotice, setPasswordResetNotice] = useState<string | null>(
    null,
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
  const [claimPassword, setClaimPassword] = useState("");
  const [claimRepeatPassword, setClaimRepeatPassword] = useState("");
  const [claimPasswordTouched, setClaimPasswordTouched] = useState(false);
  const [claimRepeatPasswordTouched, setClaimRepeatPasswordTouched] =
    useState(false);
  const [showClaimPasswordValidation, setShowClaimPasswordValidation] =
    useState(false);

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
  const requiresPasswordReset =
    portalBuild?.accessState === "claim_required" && portalBuild.portalClaimed;
  const claimPasswordErrors = validatePortalPasswordSetup(
    claimPassword,
    claimRepeatPassword,
  );
  const claimPasswordFieldError =
    (showClaimPasswordValidation || claimPasswordTouched
      ? claimPasswordErrors.password
      : undefined) ??
    depositClaimError ??
    undefined;
  const claimRepeatPasswordFieldError =
    showClaimPasswordValidation || claimRepeatPasswordTouched
      ? claimPasswordErrors.repeatPassword
      : undefined;

  useEffect(() => {
    document.title = `${SITE_NAME} – Order ${orderNumber}`;
  }, [orderNumber]);

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
          setLoginError(null);
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
              : "We could not load this order right now.",
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
    password,
    paymentMethod,
  }: {
    password: string;
    paymentMethod: DepositPaymentMethod;
  }) => {
    if (!portalBuild) {
      return;
    }

    setDepositClaimError(null);
    setIsProcessingPayment(true);
    setOrderError(null);

    let activeSessionToken = sessionToken;
    let currentBuild = portalBuild;

    if (portalBuild.accessState === "claim_required") {
      try {
        const claimed = await claimPortalAccess(password);
        activeSessionToken = claimed.sessionToken;
        currentBuild = claimed.build;
      } catch (error) {
        setDepositClaimError(
          error instanceof Error
            ? error.message
            : "We could not verify your password.",
        );
        setIsProcessingPayment(false);
        return;
      }
    }

    try {
      if (!activeSessionToken) {
        throw new Error("A valid bike configurator session is required.");
      }

      const response = await requestPaymentLink({
        paymentKind: "deposit",
        paymentMethod,
        publicOrderNumber: orderNumber,
        sessionToken: activeSessionToken,
      });

      const nextPayment: StoredDepositPayment = {
        amount: currentBuild.deposit.amount,
        paidAt: new Date().toISOString(),
        paymentMethod,
      };

      setPortalBuild(response.build);
      setDepositPayment(nextPayment);
      setStoredLastDepositPayment(orderNumber, nextPayment);
      window.location.assign(response.paymentUrl);
    } catch (error) {
      setOrderError(
        error instanceof Error
          ? error.message
          : "We could not prepare the deposit payment.",
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const claimPortalAccess = async (password: string) => {
    if (!claimToken) {
      throw new Error("The claim token is missing.");
    }

    const claimed = await claimOrderPortal({
      claimToken,
      password,
      publicOrderNumber: orderNumber,
    });

    setSessionToken(claimed.sessionToken);
    setStoredPortalSession(orderNumber, claimed.sessionToken);
    setPortalBuild(claimed.build);
    setRequiresLogin(false);
    setDepositClaimError(null);
    window.history.replaceState(
      {},
      document.title,
      localizePath(`/order/${orderNumber}`, locale),
    );

    return claimed;
  };

  const handleSubmitMeasurements = async () => {
    if (!sessionToken) {
      setOrderError("A valid bike configurator session is required.");
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
          : "We could not submit the measurements.",
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
      setOrderError("A valid bike configurator session is required.");
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
          : "We could not submit the bike specification.",
      );
    } finally {
      setIsSubmittingSpecification(false);
    }
  };

  const handleApproveDesign = async () => {
    if (!sessionToken) {
      setOrderError("A valid bike configurator session is required.");
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
          : "We could not approve the design.",
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
      throw new Error("A valid bike configurator session is required.");
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
      setOrderError("A valid bike configurator session is required.");
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
          : "We could not prepare the final payment.",
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

  const handlePortalLogin = async () => {
    if (loginPassword.trim().length < 8) {
      setLoginError("Enter the password you created for this order.");
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);
    setOrderError(null);

    try {
      const loggedIn = await loginOrderPortal({
        password: loginPassword,
        publicOrderNumber: orderNumber,
      });

      setSessionToken(loggedIn.sessionToken);
      setStoredPortalSession(orderNumber, loggedIn.sessionToken);
      setPortalBuild(loggedIn.build);
      setRequiresLogin(false);
      setLoginPassword("");
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : "We could not unlock this order right now.",
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForgotPassword = async () => {
    setIsSendingPasswordReset(true);
    setLoginError(null);
    setPasswordResetNotice(null);

    try {
      const response = await requestOrderPortalPasswordReset({
        publicOrderNumber: orderNumber,
      });
      setPasswordResetNotice(response.message);
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : "We could not send a password reset link right now.",
      );
    } finally {
      setIsSendingPasswordReset(false);
    }
  };

  const handleClaimAccess = async () => {
    setShowClaimPasswordValidation(true);

    if (Object.keys(claimPasswordErrors).length > 0) {
      return;
    }

    setIsClaimingAccess(true);
    setDepositClaimError(null);
    setOrderError(null);

    try {
      await claimPortalAccess(claimPassword);
      setClaimPassword("");
      setClaimRepeatPassword("");
      setClaimPasswordTouched(false);
      setClaimRepeatPasswordTouched(false);
      setShowClaimPasswordValidation(false);
    } catch (error) {
      setDepositClaimError(
        error instanceof Error
          ? error.message
          : "We could not reset your password right now.",
      );
    } finally {
      setIsClaimingAccess(false);
    }
  };

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
                <SectionPill>Order</SectionPill>
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
                <p className="text-sm text-slate-600">
                  Loading your bike configurator...
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
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Protected order
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">
                  Enter your order password
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  This order page is protected with the password created during
                  the deposit step.
                </p>
                <div className="mt-5 max-w-md">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Password
                    </span>
                    <InputField
                      type="password"
                      value={loginPassword}
                      onChange={(event) => setLoginPassword(event.target.value)}
                      placeholder="Enter your order password"
                      hasError={Boolean(loginError)}
                      className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                    />
                  </label>
                  {loginError ? (
                    <p className="mt-3 text-sm text-red-600">{loginError}</p>
                  ) : null}
                  {passwordResetNotice ? (
                    <p className="mt-3 text-sm text-emerald-700">
                      {passwordResetNotice}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={handlePortalLogin}
                    disabled={isLoggingIn}
                    className="mt-4 inline-flex items-center justify-center rounded-md bg-[var(--kanna-ink)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-stone-300"
                  >
                    {isLoggingIn ? "Unlocking..." : "Access"}
                  </button>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={isSendingPasswordReset}
                    className="mt-4 ml-4 inline-flex items-center justify-center text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    {isSendingPasswordReset
                      ? "Sending reset link..."
                      : "Forgot password?"}
                  </button>
                </div>
              </AnimatedOrderSection>
            ) : null}
          </AnimatePresence>

          <AnimatePresence initial={false} mode="popLayout">
            {!isLoadingBuild && requiresPasswordReset ? (
              <AnimatedOrderSection
                key="order-password-reset"
                className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Reset password
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">
                  Create a new order password
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  Use this secure link to set a new password and access your
                  order page again.
                </p>
                <div className="mt-5 max-w-md space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      New password
                    </span>
                    <InputField
                      type="password"
                      value={claimPassword}
                      onBlur={() => setClaimPasswordTouched(true)}
                      onChange={(event) => setClaimPassword(event.target.value)}
                      placeholder="Enter a new password"
                      hasError={Boolean(claimPasswordFieldError)}
                      className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                    />
                    {claimPasswordFieldError ? (
                      <p className="mt-2 text-sm text-red-600">
                        {claimPasswordFieldError}
                      </p>
                    ) : null}
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Repeat new password
                    </span>
                    <InputField
                      type="password"
                      value={claimRepeatPassword}
                      onBlur={() => setClaimRepeatPasswordTouched(true)}
                      onChange={(event) =>
                        setClaimRepeatPassword(event.target.value)
                      }
                      placeholder="Repeat your new password"
                      hasError={Boolean(claimRepeatPasswordFieldError)}
                      className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                    />
                    {claimRepeatPasswordFieldError ? (
                      <p className="mt-2 text-sm text-red-600">
                        {claimRepeatPasswordFieldError}
                      </p>
                    ) : null}
                  </label>
                  <button
                    type="button"
                    onClick={handleClaimAccess}
                    disabled={isClaimingAccess}
                    className="inline-flex items-center justify-center rounded-md bg-[var(--kanna-ink)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-stone-300"
                  >
                    {isClaimingAccess
                      ? "Saving..."
                      : "Save password and access"}
                  </button>
                </div>
              </AnimatedOrderSection>
            ) : null}
          </AnimatePresence>

          {portalBuild && !requiresPasswordReset ? (
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
                onClaimErrorChange={setDepositClaimError}
                orderNumber={orderNumber}
                onPayDeposit={handlePayDeposit}
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
                    title="Next: measurements"
                    titleStyle="eyebrow"
                    description="We will ask you to provide the necessary measurements to start the design process."
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
                      finalPaymentMethod={portalBuild.finalPayment.paymentMethod}
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
