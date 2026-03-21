import { useEffect, useState } from "react";
import measurementArrowsSvgMarkup from "../bodies/measurement-arrows.svg?raw";
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
  getStoredBikeSpecificationDraft,
  getStoredDepositConfirmed,
  getStoredDepositPayment,
  MOCK_DEPOSIT_AMOUNT,
  getStoredOrderStage,
  mockProcessDeposit,
  ORDER_STAGE_DEFINITIONS,
  type OrderStage,
  setStoredBikeSpecificationDraft,
  setStoredDepositConfirmed,
  setStoredDepositPayment,
  setStoredOrderStage,
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

export function OrderPage({ orderNumber }: { orderNumber: string }) {
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
  const [isSpecificationSubmitted, setIsSpecificationSubmitted] = useState(false);
  const [isDepositConfirmed, setIsDepositConfirmed] = useState(false);
  const [depositPayment, setDepositPayment] = useState<{ amount: string; paidAt: string } | null>(
    null,
  );
  const [hydratedBikeSpecificationOrderNumber, setHydratedBikeSpecificationOrderNumber] =
    useState<string | null>(null);
  const [orderStage, setOrderStage] = useState<OrderStage>("waiting_for_deposit");
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
  const measurementsUnlocked = orderStage !== "waiting_for_deposit";
  const measurementsSubmitted =
    orderStage === "waiting_for_specification" ||
    orderStage === "waiting_for_design" ||
    orderStage === "waiting_for_design_approval" ||
    orderStage === "waiting_for_final_payment" ||
    orderStage === "final_payment_in_review" ||
    orderStage === "in_production" ||
    orderStage === "waiting_for_delivery" ||
    orderStage === "delivered";
  const visibleOrderStage =
    orderStage === "waiting_for_specification" && !isDepositConfirmed
      ? "in_review"
      : orderStage;
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
    isSpecificationSubmitted ||
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
    setOrderStage(getStoredOrderStage(orderNumber));
    setIsDepositConfirmed(getStoredDepositConfirmed(orderNumber));
    setDepositPayment(getStoredDepositPayment(orderNumber));
    const storedBikeSpecificationDraft = getStoredBikeSpecificationDraft(orderNumber);
    setBikeSpecification(storedBikeSpecificationDraft.values);
    setSpecificationMode(storedBikeSpecificationDraft.specificationMode);
    setHydratedBikeSpecificationOrderNumber(orderNumber);
  }, [orderNumber]);

  useEffect(() => {
    if (hydratedBikeSpecificationOrderNumber !== orderNumber) {
      return;
    }

    setStoredBikeSpecificationDraft(orderNumber, {
      specificationMode,
      values: bikeSpecification,
    });
  }, [bikeSpecification, hydratedBikeSpecificationOrderNumber, orderNumber, specificationMode]);

  const handleMeasurementChange = (key: string, value: string) => {
    activateMeasurement(key as MeasurementKey);
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleGuidelines = (key: string) => {
    setExpandedGuidelineKey((prev) => (prev === key ? null : (key as MeasurementKey)));
  };

  const handleMockDepositPayment = async () => {
    setIsProcessingPayment(true);
    const nextStage = await mockProcessDeposit(orderNumber);
    const payment = {
      amount: MOCK_DEPOSIT_AMOUNT,
      paidAt: new Date().toISOString(),
    };
    setStoredDepositConfirmed(orderNumber, true);
    setStoredDepositPayment(orderNumber, payment);
    setIsDepositConfirmed(true);
    setDepositPayment(payment);
    setOrderStage(nextStage);
    setIsProcessingPayment(false);
  };

  const handleSubmitMeasurements = async () => {
    setIsSubmittingMeasurements(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    setStoredOrderStage(orderNumber, "waiting_for_specification");
    setOrderStage("waiting_for_specification");
    setIsSubmittingMeasurements(false);
  };

  const handleBikeSpecificationChange = (key: string, value: string) => {
    setBikeSpecification((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmitSpecification = async () => {
    setIsSubmittingSpecification(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    setStoredOrderStage(orderNumber, "waiting_for_design");
    setOrderStage("waiting_for_design");
    setIsSpecificationSubmitted(true);
    setIsSubmittingSpecification(false);
  };

  const handleApproveDesign = async () => {
    setIsApprovingDesign(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    setStoredOrderStage(orderNumber, "waiting_for_final_payment");
    setOrderStage("waiting_for_final_payment");
    setIsApprovingDesign(false);
  };

  const handleSubmitFinalPayment = async () => {
    setIsSubmittingFinalPayment(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    setStoredOrderStage(orderNumber, "final_payment_in_review");
    setOrderStage("final_payment_in_review");
    setIsSubmittingFinalPayment(false);
  };

  const handleSpecificationModeChange = (
    mode: "guided_by_designer" | "self_specified" | "frame_only",
  ) => {
    setSpecificationMode(mode);
    setIsSpecificationSubmitted(false);
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
              <OrderStatusBadge stage={visibleOrderStage} />
            </div>
          </div>
        </header>

        <OrderDepositSection
          agreementAccepted={agreementAccepted}
          currentStage={orderStage}
          depositPayment={depositPayment}
          isDepositConfirmed={isDepositConfirmed}
          isProcessingPayment={isProcessingPayment}
          onAgreementChange={setAgreementAccepted}
          onPayDeposit={handleMockDepositPayment}
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
            description="Measurement fields will appear here after the deposit is paid."
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
              isSubmittingFinalPayment={isSubmittingFinalPayment}
              onPayFinalAmount={handleSubmitFinalPayment}
            />
          </>
        ) : null}
      </SectionStack>
    </main>
  );
}
