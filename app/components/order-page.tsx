import { useEffect, useState } from "react";
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
  approveDesign,
  claimOrderPortal,
  clearStoredPortalSession,
  fetchOrderPortalBuild,
  getStoredPortalSession,
  requestPaymentLink,
  setStoredPortalSession,
  submitMeasurements,
  submitSpecification,
  type OrderPortalPayload,
} from "~/lib/order-api";
import {
  type DepositPaymentMethod,
  type OrderStage,
  type StoredDepositPayment,
} from "~/lib/mock-order";

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

function normalizeMeasurementValues(values: Record<string, string>): MeasurementValues {
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

function getStoredLastDepositPayment(orderNumber: string): StoredDepositPayment | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.sessionStorage.getItem(getSessionStoragePaymentKey(orderNumber));

  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as StoredDepositPayment;

    if (
      typeof parsed.amount === "string" &&
      typeof parsed.paidAt === "string" &&
      (parsed.paymentMethod === "stripe" || parsed.paymentMethod === "classic_transfer")
    ) {
      return parsed;
    }
  } catch {}

  return null;
}

function setStoredLastDepositPayment(orderNumber: string, payment: StoredDepositPayment) {
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
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [activeMeasurement, setActiveMeasurement] =
    useState<MeasurementKey | null>(null);
  const [expandedGuidelineKey, setExpandedGuidelineKey] =
    useState<MeasurementKey | null>(null);
  const [bodyType, setBodyType] = useState<BodyType>("male");
  const [bodyWeight, setBodyWeight] = useState<string>("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isSubmittingMeasurements, setIsSubmittingMeasurements] = useState(false);
  const [isSubmittingSpecification, setIsSubmittingSpecification] = useState(false);
  const [isSubmittingFinalPayment, setIsSubmittingFinalPayment] = useState(false);
  const [isApprovingDesign, setIsApprovingDesign] = useState(false);
  const [measurementArrowsSvgMarkup, setMeasurementArrowsSvgMarkup] = useState("");
  const [orderError, setOrderError] = useState<string | null>(null);
  const [portalBuild, setPortalBuild] = useState<OrderPortalPayload | null>(null);
  const [sessionToken, setSessionToken] = useState(() =>
    getStoredPortalSession(orderNumber),
  );
  const [isLoadingBuild, setIsLoadingBuild] = useState(true);
  const [depositPayment, setDepositPayment] = useState<StoredDepositPayment | null>(() =>
    getStoredLastDepositPayment(orderNumber),
  );
  const [bikeSpecification, setBikeSpecification] = useState<Record<string, string>>({});
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
  const designPreviewSrc = bikeDrawingSrc;
  const orderStage: OrderStage = portalBuild?.stage ?? "waiting_for_deposit";
  const isDepositConfirmed = portalBuild?.deposit.isConfirmed ?? false;
  const measurementsUnlocked =
    portalBuild?.accessState === "authenticated" && orderStage !== "waiting_for_deposit";
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
  const bikeDesignUnlocked =
    isDepositConfirmed &&
    (orderStage === "waiting_for_specification" ||
      orderStage === "waiting_for_design" ||
      orderStage === "waiting_for_design_approval" ||
      orderStage === "waiting_for_final_payment" ||
      orderStage === "final_payment_in_review" ||
      orderStage === "in_production" ||
      orderStage === "waiting_for_delivery" ||
      orderStage === "delivered");
  const bikeDesignSubmitted =
    portalBuild?.specificationState.isSubmitted ||
    orderStage === "waiting_for_design" ||
    orderStage === "waiting_for_design_approval" ||
    orderStage === "waiting_for_final_payment" ||
    orderStage === "final_payment_in_review" ||
    orderStage === "in_production" ||
    orderStage === "waiting_for_delivery" ||
    orderStage === "delivered";

  useEffect(() => {
    document.title = `Order nb. ${orderNumber}`;
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
    setSpecificationMode(portalBuild.specificationState.specificationMode);
  }, [portalBuild]);

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
    setExpandedGuidelineKey((prev) => (prev === key ? null : (key as MeasurementKey)));
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

    setIsProcessingPayment(true);
    setOrderError(null);

    try {
      let activeSessionToken = sessionToken;
      let currentBuild = portalBuild;

      if (portalBuild.accessState === "claim_required") {
        if (!claimToken) {
          throw new Error("The claim token is missing.");
        }

        const claimed = await claimOrderPortal({
          claimToken,
          password,
          publicOrderNumber: orderNumber,
        });

        activeSessionToken = claimed.sessionToken;
        currentBuild = claimed.build;
        setSessionToken(claimed.sessionToken);
        setStoredPortalSession(orderNumber, claimed.sessionToken);
        setPortalBuild(claimed.build);
        window.history.replaceState({}, document.title, `/order/${orderNumber}`);
      }

      if (!activeSessionToken) {
        throw new Error("A valid portal session is required.");
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

  const handleSubmitMeasurements = async () => {
    if (!sessionToken) {
      setOrderError("A valid portal session is required.");
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
      setOrderError("A valid portal session is required.");
      return;
    }

    setIsSubmittingSpecification(true);
    setOrderError(null);

    try {
      const build = await submitSpecification({
        publicOrderNumber: orderNumber,
        sessionToken,
        specificationMode,
        values: bikeSpecification,
      });
      setPortalBuild(build);
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
      setOrderError("A valid portal session is required.");
      return;
    }

    setIsApprovingDesign(true);
    setOrderError(null);

    try {
      const build = await approveDesign({
        publicOrderNumber: orderNumber,
        sessionToken,
      });
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

  const handleSubmitFinalPayment = async (shipping: {
    address: {
      city: string;
      country: string;
      fullName: string;
      postalCode: string;
      street: string;
    };
    option: "courier" | "pickup";
  }) => {
    if (!sessionToken) {
      setOrderError("A valid portal session is required.");
      return;
    }

    setIsSubmittingFinalPayment(true);
    setOrderError(null);

    try {
      const response = await requestPaymentLink({
        paymentKind: "final",
        paymentMethod: "stripe",
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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-8 md:py-10">
      <SectionStack>
        <header className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm md:px-7 md:py-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
              {`Order nb. ${orderNumber}`}
            </h1>
            <div className="flex items-center md:justify-end">
              <OrderStatusBadge stage={orderStage} />
            </div>
          </div>
        </header>

        {orderError ? (
          <section className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            {orderError}
          </section>
        ) : null}

        {isLoadingBuild && !portalBuild ? (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">Loading your order portal...</p>
          </section>
        ) : null}

        {portalBuild ? (
          <>
            <OrderDepositSection
              agreementAccepted={agreementAccepted}
              availablePaymentMethods={portalBuild.availablePaymentMethods}
              currentStage={orderStage}
              customerDetails={portalBuild.customer}
              depositAmountLabel={portalBuild.deposit.amount}
              depositPayment={depositPayment}
              isDepositConfirmed={isDepositConfirmed}
              isProcessingPayment={isProcessingPayment}
              onAgreementChange={setAgreementAccepted}
              orderNumber={orderNumber}
              onPayDeposit={handlePayDeposit}
              requiresClaim={portalBuild.accessState === "claim_required"}
            />

            {measurementsUnlocked ? (
              <OrderMeasurementsSection
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
                onActivateMeasurement={(key) => activateMeasurement(key as MeasurementKey)}
                onDeactivateMeasurement={deactivateMeasurement}
                onBodyTypeChange={setBodyType}
                onBodyWeightChange={setBodyWeight}
                onMeasurementChange={handleMeasurementChange}
                onSubmit={handleSubmitMeasurements}
                onToggleGuidelines={handleToggleGuidelines}
              />
            ) : (
              <OrderPendingSection
                title="Next: measurements"
                titleStyle="eyebrow"
                description="We will ask you to provide the necessary measurements to start the design process."
              />
            )}

            {measurementsUnlocked && !bikeDesignUnlocked ? <OrderBikeDesignPreviewSection /> : null}

            {bikeDesignUnlocked ? (
              <>
                <OrderBikeDesignSection
                  isApproving={isApprovingDesign}
                  bikeDrawingSrc={bikeDrawingSrc}
                  designPreviewSrc={designPreviewSrc}
                  currentStage={orderStage}
                  finalAmountLabel={portalBuild.finalPayment.amount}
                  isSubmitting={isSubmittingSpecification}
                  isSubmitted={bikeDesignSubmitted}
                  specificationMode={specificationMode}
                  onApprove={handleApproveDesign}
                  values={bikeSpecification}
                  onModeChange={handleSpecificationModeChange}
                  onSubmit={handleSubmitSpecification}
                  onValueChange={handleBikeSpecificationChange}
                />
                <OrderProductionPreviewSection
                  currentStage={orderStage}
                  depositAmountValue={portalBuild.deposit.amountValue}
                  finalAmountValue={portalBuild.finalPayment.amountValue}
                  initialShippingState={{
                    address: portalBuild.shippingState.address,
                    option: portalBuild.shippingState.option,
                    trackingUrl: portalBuild.shippingState.trackingUrl,
                  }}
                  isSubmittingFinalPayment={isSubmittingFinalPayment}
                  onPayFinalAmount={handleSubmitFinalPayment}
                />
              </>
            ) : null}
          </>
        ) : null}
      </SectionStack>
    </main>
  );
}
