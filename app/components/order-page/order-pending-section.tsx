import { useEffect, useState } from "react";
import {
  MOCK_DELIVERED_ON,
  MOCK_ESTIMATED_DELIVERY_TIME,
  MOCK_FINAL_PRICE_EXCLUDING_DEPOSIT,
  type OrderStage,
} from "~/lib/mock-order";

const FINAL_PAYMENT_AMOUNT = 3200;
const DEPOSIT_AMOUNT_VALUE = 500;
const PRODUCTION_SUCCESS_HIGHLIGHT_DELAY_MS = 4000;

function validateShippingDetails(
  shippingAddress: {
    fullName: string;
    street: string;
    postalCode: string;
    city: string;
    country: string;
  },
  shippingOption: "courier" | "pickup",
) {
  const errors: Partial<Record<keyof typeof shippingAddress, string>> = {};

  if (shippingAddress.fullName.trim().length < 2) {
    errors.fullName = "Enter recipient name.";
  }

  if (shippingOption === "courier") {
    if (shippingAddress.street.trim().length < 4) {
      errors.street = "Enter street and house number.";
    }
    if (shippingAddress.postalCode.trim().length < 3) {
      errors.postalCode = "Enter postal code.";
    }
    if (shippingAddress.city.trim().length < 2) {
      errors.city = "Enter city.";
    }
    if (shippingAddress.country.trim().length < 2) {
      errors.country = "Enter country.";
    }
  }

  return errors;
}

export function OrderPendingSection({
  description,
  eyebrow,
  title,
  titleStyle = "default",
}: {
  description: string;
  eyebrow?: string;
  title: string;
  titleStyle?: "default" | "eyebrow";
}) {
  const isEyebrowTitle = titleStyle === "eyebrow";

  return (
    <section className="rounded-xl border border-dashed border-slate-300 bg-slate-100/70 p-6 shadow-sm">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={
          isEyebrowTitle
            ? "text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
            : "mt-2 text-xl font-semibold text-slate-900"
        }
      >
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        {description}
      </p>
    </section>
  );
}

export function OrderBikeDesignPreviewSection() {
  return (
    <OrderPendingSection
      title="Next: bike design"
      titleStyle="eyebrow"
      description="Once your measurements are submitted and the deposit is received, your project will be ready to start and assigned to our designer for the next stage of the build."
    />
  );
}

export function OrderProductionPreviewSection({
  currentStage,
  isSubmittingFinalPayment,
  onPayFinalAmount,
}: {
  currentStage: OrderStage;
  isSubmittingFinalPayment: boolean;
  onPayFinalAmount: () => void;
}) {
  const [shippingOption, setShippingOption] = useState<"courier" | "pickup">(
    "courier",
  );
  const [hasCalculatedShipping, setHasCalculatedShipping] = useState(false);
  const [showShippingValidation, setShowShippingValidation] = useState(false);
  const [hasProductionHighlight, setHasProductionHighlight] = useState(
    currentStage === "in_production" || currentStage === "delivered",
  );
  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    street: "",
    postalCode: "",
    city: "",
    country: "",
  });
  const shippingErrors = validateShippingDetails(
    shippingAddress,
    shippingOption,
  );
  const hasShippingErrors = Object.keys(shippingErrors).length > 0;

  const normalizedCountry = shippingAddress.country.trim().toLowerCase();
  const shippingCost =
    shippingOption === "pickup"
      ? 0
      : normalizedCountry === "poland"
        ? 80
        : normalizedCountry.length > 0
          ? 180
          : 0;
  const totalAmountBeforeDeposit = FINAL_PAYMENT_AMOUNT + DEPOSIT_AMOUNT_VALUE;
  const totalWithShipping = FINAL_PAYMENT_AMOUNT + shippingCost;

  useEffect(() => {
    if (currentStage !== "in_production" && currentStage !== "delivered") {
      setHasProductionHighlight(false);
      return;
    }

    setHasProductionHighlight(true);
    const timeoutId = window.setTimeout(() => {
      setHasProductionHighlight(false);
    }, PRODUCTION_SUCCESS_HIGHLIGHT_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [currentStage]);

  if (currentStage === "waiting_for_final_payment") {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Production
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">
          Waiting for final payment
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Final payment will cover the cost of materials, specified parts, and
          production of your custom bicycle. Once we receive it, your bike will
          move directly into production and we will provide an estimated
          delivery time. (Usually 4-6 weeks)
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)] md:items-start">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Shipping details
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Delivery to
                </span>
                <input
                  type="text"
                  value={shippingAddress.fullName}
                  onChange={(event) =>
                    setShippingAddress((prev) => ({
                      ...prev,
                      fullName: event.target.value,
                    }))
                  }
                  onFocus={() => {
                    setHasCalculatedShipping(false);
                    setShowShippingValidation(false);
                  }}
                  placeholder="Full name"
                  className={`w-full rounded-md bg-white px-3 py-2 text-slate-900 outline-none transition focus:ring-2 ${
                    showShippingValidation && shippingErrors.fullName
                      ? "border border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border border-slate-300 focus:border-yellow-400 focus:ring-yellow-200"
                  }`}
                />
                {showShippingValidation && shippingErrors.fullName ? (
                  <p className="mt-2 text-sm text-red-600">
                    {shippingErrors.fullName}
                  </p>
                ) : null}
              </label>
              <label className="block sm:col-span-2">
                <input
                  type="text"
                  value={shippingAddress.street}
                  onChange={(event) =>
                    setShippingAddress((prev) => ({
                      ...prev,
                      street: event.target.value,
                    }))
                  }
                  onFocus={() => {
                    setHasCalculatedShipping(false);
                    setShowShippingValidation(false);
                  }}
                  placeholder="Street and house number"
                  className={`w-full rounded-md bg-white px-3 py-2 text-slate-900 outline-none transition focus:ring-2 ${
                    showShippingValidation && shippingErrors.street
                      ? "border border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border border-slate-300 focus:border-yellow-400 focus:ring-yellow-200"
                  }`}
                />
                {showShippingValidation && shippingErrors.street ? (
                  <p className="mt-2 text-sm text-red-600">
                    {shippingErrors.street}
                  </p>
                ) : null}
              </label>
              <label className="block">
                <input
                  type="text"
                  value={shippingAddress.postalCode}
                  onChange={(event) =>
                    setShippingAddress((prev) => ({
                      ...prev,
                      postalCode: event.target.value,
                    }))
                  }
                  onFocus={() => {
                    setHasCalculatedShipping(false);
                    setShowShippingValidation(false);
                  }}
                  placeholder="Postal code"
                  className={`w-full rounded-md bg-white px-3 py-2 text-slate-900 outline-none transition focus:ring-2 ${
                    showShippingValidation && shippingErrors.postalCode
                      ? "border border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border border-slate-300 focus:border-yellow-400 focus:ring-yellow-200"
                  }`}
                />
                {showShippingValidation && shippingErrors.postalCode ? (
                  <p className="mt-2 text-sm text-red-600">
                    {shippingErrors.postalCode}
                  </p>
                ) : null}
              </label>
              <label className="block">
                <input
                  type="text"
                  value={shippingAddress.city}
                  onChange={(event) =>
                    setShippingAddress((prev) => ({
                      ...prev,
                      city: event.target.value,
                    }))
                  }
                  onFocus={() => {
                    setHasCalculatedShipping(false);
                    setShowShippingValidation(false);
                  }}
                  placeholder="City"
                  className={`w-full rounded-md bg-white px-3 py-2 text-slate-900 outline-none transition focus:ring-2 ${
                    showShippingValidation && shippingErrors.city
                      ? "border border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border border-slate-300 focus:border-yellow-400 focus:ring-yellow-200"
                  }`}
                />
                {showShippingValidation && shippingErrors.city ? (
                  <p className="mt-2 text-sm text-red-600">
                    {shippingErrors.city}
                  </p>
                ) : null}
              </label>
              <label className="block sm:col-span-2">
                <input
                  type="text"
                  value={shippingAddress.country}
                  onChange={(event) =>
                    setShippingAddress((prev) => ({
                      ...prev,
                      country: event.target.value,
                    }))
                  }
                  onFocus={() => {
                    setHasCalculatedShipping(false);
                    setShowShippingValidation(false);
                  }}
                  placeholder="Country"
                  className={`w-full rounded-md bg-white px-3 py-2 text-slate-900 outline-none transition focus:ring-2 ${
                    showShippingValidation && shippingErrors.country
                      ? "border border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border border-slate-300 focus:border-yellow-400 focus:ring-yellow-200"
                  }`}
                />
                {showShippingValidation && shippingErrors.country ? (
                  <p className="mt-2 text-sm text-red-600">
                    {shippingErrors.country}
                  </p>
                ) : null}
              </label>
            </div>

            <fieldset className="mt-5">
              <legend className="mb-2 text-sm font-semibold text-slate-700">
                Shipping option
              </legend>
              <div className="grid gap-2">
                <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
                  <input
                    type="radio"
                    name="shipping-option"
                    checked={shippingOption === "courier"}
                    onChange={() => {
                      setShippingOption("courier");
                      setHasCalculatedShipping(false);
                      setShowShippingValidation(false);
                    }}
                  />
                  <span>Courier delivery</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
                  <input
                    type="radio"
                    name="shipping-option"
                    checked={shippingOption === "pickup"}
                    onChange={() => {
                      setShippingOption("pickup");
                      setHasCalculatedShipping(false);
                      setShowShippingValidation(false);
                    }}
                  />
                  <span>Studio pickup</span>
                </label>
              </div>
            </fieldset>
          </div>

          <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Summary</h3>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-700">Total amount</span>
                <span className="font-semibold text-slate-900">
                  {`${totalAmountBeforeDeposit.toLocaleString("en-US").replace(/,/g, " ")} EUR`}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-4">
                <span className="text-slate-700">Deposit</span>
                <span className="font-semibold text-slate-900">
                  -{DEPOSIT_AMOUNT_VALUE} EUR
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-4">
                <span className="text-slate-700">Shipping</span>
                <span className="font-semibold text-slate-900">
                  {shippingCost === 0 ? "0 EUR" : `${shippingCost} EUR`}
                </span>
              </div>
              <div className="mt-3 border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-slate-900">
                    Total
                  </span>
                  <span className="text-lg font-semibold text-slate-900">
                    {`${totalWithShipping.toLocaleString("en-US").replace(/,/g, " ")} EUR`}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowShippingValidation(true);

                if (hasShippingErrors) {
                  setHasCalculatedShipping(false);
                  return;
                }

                setHasCalculatedShipping(true);
              }}
              className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-100"
            >
              Calculate shipping
            </button>
            <button
              type="button"
              disabled={!hasCalculatedShipping}
              onClick={onPayFinalAmount}
              className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmittingFinalPayment
                ? "Submitting payment..."
                : "Pay final amount"}
            </button>
          </aside>
        </div>
      </section>
    );
  }

  if (currentStage === "final_payment_in_review") {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Production
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">In review</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          We are reviewing the final payment. Once it is confirmed, the order
          will move into production manually.
        </p>
      </section>
    );
  }

  if (
    currentStage === "in_production" ||
    currentStage === "waiting_for_delivery" ||
    currentStage === "delivered"
  ) {
    return (
      <section
        className={`rounded-xl p-6 shadow-sm ${
          (currentStage === "in_production" || currentStage === "delivered") &&
          hasProductionHighlight
            ? "border border-emerald-200 bg-emerald-50"
            : "border border-slate-200 bg-white"
        }`}
      >
        <p
          className={`text-xs font-semibold uppercase tracking-[0.14em] ${
            (currentStage === "in_production" ||
              currentStage === "delivered") &&
            hasProductionHighlight
              ? "text-emerald-700"
              : "text-slate-500"
          }`}
        >
          Production
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">
          {currentStage === "in_production"
            ? "In production"
            : currentStage === "waiting_for_delivery"
              ? "Ready for delivery"
              : "Delivered"}
        </h2>
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            {currentStage === "delivered"
              ? "Delivered on"
              : "Estimated delivery time"}
          </span>
          <p className="text-sm text-slate-900">
            {currentStage === "delivered"
              ? MOCK_DELIVERED_ON
              : MOCK_ESTIMATED_DELIVERY_TIME}
          </p>
        </div>
      </section>
    );
  }

  return (
    <OrderPendingSection
      title="Next: production"
      titleStyle="eyebrow"
      description="Once the bike design is finalized and approved, the project will move into production."
    />
  );
}
