import { City, Country } from "country-state-city";
import { useEffect, useId, useState, type ReactNode } from "react";
import { Link } from "react-router";
import validator from "validator";
import { Spinner } from "~/components/spinner";
import {
  MOCK_DELIVERED_ON,
  MOCK_ESTIMATED_DELIVERY_TIME,
  type DepositPaymentMethod,
  type OrderStage,
} from "~/lib/mock-order";
import type { OrderShippingAddress, OrderShippingState } from "~/lib/order-api";
import { formatOrderMoney, getInclusiveTaxBreakdown } from "~/lib/order-tax";

const PRODUCTION_SUCCESS_HIGHLIGHT_DELAY_MS = 4000;
const SHIPPING_QUOTE_DEBOUNCE_MS = 450;

const AVAILABLE_COUNTRIES = Country.getAllCountries().map((country) => ({
  code: country.isoCode,
  name: country.name,
}));

const { isPostalCode, isPostalCodeLocales } = validator;

const POSTAL_CODE_LOCALES = new Set(
  isPostalCodeLocales.map((locale) => locale.toUpperCase()),
);

function getCountryLabel(countryCode: string) {
  const match = AVAILABLE_COUNTRIES.find(
    (country) => country.code === countryCode.toUpperCase(),
  );

  return match?.name ?? "";
}

function getCountryCodeByName(countryName: string) {
  const normalizedCountryName = countryName.trim().toLowerCase();
  const match = AVAILABLE_COUNTRIES.find(
    (country) => country.name.toLowerCase() === normalizedCountryName,
  );

  return match?.code ?? "";
}

function getCityOptions(countryCode: string) {
  if (!countryCode) {
    return [];
  }

  return Array.from(
    new Set(
      (City.getCitiesOfCountry(countryCode) ?? [])
        .map((city) => city.name.trim())
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

function isValidCountry(countryCode: string) {
  return AVAILABLE_COUNTRIES.some(
    (country) => country.code === countryCode.toUpperCase(),
  );
}

function isValidPostalCodeForCountry(postalCode: string, countryCode: string) {
  const trimmedPostalCode = postalCode.trim();

  if (!trimmedPostalCode) {
    return false;
  }

  const locale = POSTAL_CODE_LOCALES.has(countryCode.toUpperCase())
    ? (countryCode.toUpperCase() as Parameters<typeof isPostalCode>[1])
    : "any";

  return isPostalCode(trimmedPostalCode, locale);
}

function validateShippingDetails(
  shippingAddress: OrderShippingAddress,
  cityOptions: string[],
  shippingOption: "courier" | "pickup",
) {
  const errors: Partial<Record<keyof typeof shippingAddress, string>> = {};
  const [firstName, ...lastNameParts] = shippingAddress.fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!firstName || firstName.length < 2) {
    errors.fullName = "Enter recipient name and lastname.";
  } else if (lastNameParts.join(" ").length < 2) {
    errors.fullName = "Enter recipient lastname.";
  }

  if (!shippingAddress.email.trim() || !validator.isEmail(shippingAddress.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (shippingAddress.phoneNumber.trim().length < 6) {
    errors.phoneNumber = "Enter a valid phone number.";
  }

  if (shippingOption === "courier") {
    if (shippingAddress.street.trim().length < 4) {
      errors.street = "Enter street and house number.";
    }
    if (!isValidPostalCodeForCountry(shippingAddress.postalCode, shippingAddress.countryCode)) {
      errors.postalCode = "Enter a valid postal code for the selected country.";
    }
    if (cityOptions.length > 0) {
      const cityMatch = cityOptions.some(
        (city) => city.toLowerCase() === shippingAddress.city.trim().toLowerCase(),
      );

      if (!cityMatch) {
        errors.city = "Select a city from the list.";
      }
    } else if (shippingAddress.city.trim().length < 2) {
      errors.city = "Enter city.";
    }
    if (!isValidCountry(shippingAddress.countryCode)) {
      errors.country = "Select a valid country.";
    }
  }

  return errors;
}

function isShippingFormReady(
  shippingAddress: OrderShippingAddress,
  shippingOption: "courier" | "pickup",
) {
  if (shippingAddress.fullName.trim().length < 2) {
    return false;
  }

  if (!shippingAddress.email.trim() || !validator.isEmail(shippingAddress.email.trim())) {
    return false;
  }

  if (shippingAddress.phoneNumber.trim().length < 6) {
    return false;
  }

  if (shippingOption === "pickup") {
    return true;
  }

  return (
    shippingAddress.street.trim().length >= 4 &&
    shippingAddress.postalCode.trim().length > 0 &&
    shippingAddress.city.trim().length >= 2 &&
    shippingAddress.countryCode.trim().length > 0
  );
}

function PendingValue() {
  return (
    <span className="inline-flex items-center justify-end">
      <Spinner className="h-4 w-4" />
    </span>
  );
}

function formatPaymentDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function PaymentOption({
  helper,
  icon,
  isSelected,
  onSelect,
  title,
}: {
  helper: string;
  icon: ReactNode;
  isSelected: boolean;
  onSelect: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`rounded-lg border px-3 py-3 text-left transition ${
        isSelected
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-900 hover:border-slate-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`shrink-0 ${
              isSelected ? "text-white" : "text-slate-500"
            }`}
            aria-hidden="true"
          >
            {icon}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{title}</p>
            <p
              className={`mt-1 text-xs ${
                isSelected ? "text-slate-300" : "text-slate-500"
              }`}
            >
              {helper}
            </p>
          </div>
        </div>
        <span
          className={`mt-0.5 h-4 w-4 rounded-full border ${
            isSelected
              ? "border-white bg-white ring-4 ring-slate-700"
              : "border-slate-300 bg-white"
          }`}
          aria-hidden="true"
        />
      </div>
    </button>
  );
}

function StripeCardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="block h-5 w-5" fill="none">
      <rect
        x="3.25"
        y="5.25"
        width="17.5"
        height="13.5"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M3.75 9.25H20.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M7.5 14.75H11.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BankTransferIcon() {
  return (
    <svg viewBox="0 0 24 24" className="block h-5 w-5" fill="none">
      <path
        d="M4 9L12 4L20 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 9.75V17.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9.5 9.75V17.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14.5 9.75V17.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M18.5 9.75V17.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4 19.5H20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BankTransferDetails({
  amountLabel,
  orderNumber,
}: {
  amountLabel: string;
  orderNumber: string;
}) {
  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">
        Bank transfer details
      </p>
      <div className="mt-3 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
        <div>
          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Account holder
          </span>
          <p className="mt-1">Kanna Bikes Sp. z o.o.</p>
        </div>
        <div>
          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Amount
          </span>
          <p className="mt-1">{amountLabel}</p>
        </div>
        <div>
          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            IBAN
          </span>
          <p className="mt-1 font-medium text-slate-900">
            PL12 3456 7890 1234 5678 9012 3456
          </p>
        </div>
        <div>
          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            SWIFT / BIC
          </span>
          <p className="mt-1 font-medium text-slate-900">PKOPPLPW</p>
        </div>
        <div className="sm:col-span-2">
          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Transfer title
          </span>
          <p className="mt-1 font-medium text-slate-900">
            {`Final payment for order ${orderNumber}`}
          </p>
        </div>
      </div>
    </div>
  );
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
  availablePaymentMethods,
  currentStage,
  depositAmountValue,
  finalAmountValue,
  currency,
  finalPaymentMethod,
  finalPaymentOrderStatus,
  finalPaymentPaidAt,
  initialShippingState,
  onCalculateShipping,
  isSubmittingFinalPayment,
  orderNumber,
  onPayFinalAmount,
}: {
  availablePaymentMethods: DepositPaymentMethod[];
  currentStage: OrderStage;
  depositAmountValue: number;
  finalAmountValue: number;
  currency: string;
  finalPaymentMethod?: DepositPaymentMethod | null;
  finalPaymentOrderStatus?: string;
  finalPaymentPaidAt?: string | null;
  initialShippingState?: {
    address: OrderShippingAddress;
    option: "courier" | "pickup";
    shippingCost: number | null;
    shippingRateLabel?: string;
    shippingEstimateNotice?: string;
    trackingUrl?: string;
  };
  onCalculateShipping: (details: {
    address: OrderShippingAddress;
    option: "courier" | "pickup";
  }) => Promise<OrderShippingState>;
  isSubmittingFinalPayment: boolean;
  orderNumber: string;
  onPayFinalAmount: (details: {
    address: OrderShippingAddress;
    paymentMethod: DepositPaymentMethod;
    option: "courier" | "pickup";
  }) => void;
}) {
  const cityListId = useId();
  const countryListId = useId();
  const [shippingOption, setShippingOption] = useState<"courier" | "pickup">(
    initialShippingState?.option ?? "courier",
  );
  const [paymentMethod, setPaymentMethod] = useState<DepositPaymentMethod>(
    finalPaymentMethod &&
      (finalPaymentMethod === "stripe" ||
        finalPaymentMethod === "classic_transfer")
      ? finalPaymentMethod
      : availablePaymentMethods[0] ?? "stripe",
  );
  const [showShippingValidation, setShowShippingValidation] = useState(false);
  const [shippingQuoteError, setShippingQuoteError] = useState<string | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [lastQuotedSignature, setLastQuotedSignature] = useState(() => {
    if (
      initialShippingState &&
      (initialShippingState.option === "pickup" ||
        initialShippingState.shippingCost !== null ||
        Boolean(initialShippingState.shippingRateLabel))
    ) {
      const address = initialShippingState.address;

      return [
        initialShippingState.option,
        address.fullName.trim(),
        address.street.trim(),
        address.postalCode.trim(),
        address.city.trim(),
        address.countryCode.trim(),
      ].join("|");
    }

    return "";
  });
  const [hasProductionHighlight, setHasProductionHighlight] = useState(
    currentStage === "in_production" || currentStage === "delivered",
  );
  const [quotedShipping, setQuotedShipping] = useState<OrderShippingState | null>(
    initialShippingState &&
      (initialShippingState.option === "pickup" ||
        (initialShippingState.shippingCost ?? 0) > 0 ||
        Boolean(initialShippingState.shippingRateLabel))
      ? {
          address: initialShippingState.address,
          option: initialShippingState.option,
          shippingCost: initialShippingState.shippingCost,
          shippingRateLabel: initialShippingState.shippingRateLabel,
          trackingUrl: initialShippingState.trackingUrl ?? "",
        }
      : null,
  );

  const initialCountryCode =
    initialShippingState?.address.countryCode ||
    getCountryCodeByName(initialShippingState?.address.country ?? "");
  const [shippingAddress, setShippingAddress] = useState({
    fullName: initialShippingState?.address.fullName ?? "",
    email: initialShippingState?.address.email ?? "",
    phoneNumber: initialShippingState?.address.phoneNumber ?? "",
    street: initialShippingState?.address.street ?? "",
    postalCode: initialShippingState?.address.postalCode ?? "",
    city: initialShippingState?.address.city ?? "",
    country: initialShippingState?.address.country ?? getCountryLabel(initialCountryCode),
    countryCode: initialCountryCode,
  });
  const trackingUrl = initialShippingState?.trackingUrl?.trim() ?? "";
  const cityOptions = getCityOptions(shippingAddress.countryCode);
  const shippingErrors = validateShippingDetails(
    shippingAddress,
    cityOptions,
    shippingOption,
  );
  const [shippingFirstName, ...shippingLastNameParts] = shippingAddress.fullName
    .split(/\s+/)
    .filter(Boolean);
  const shippingLastName = shippingLastNameParts.join(" ");
  const shippingRequestSignature = [
    shippingOption,
    shippingAddress.fullName.trim(),
    shippingAddress.street.trim(),
    shippingAddress.postalCode.trim(),
    shippingAddress.city.trim(),
    shippingAddress.countryCode.trim(),
  ].join("|");
  const isShippingReady = isShippingFormReady(shippingAddress, shippingOption);
  const hasShippingErrors = Object.keys(shippingErrors).length > 0;
  const shippingCost = quotedShipping?.shippingCost ?? 0;
  const hasShippingQuote = quotedShipping !== null && quotedShipping.shippingCost !== null;
  const totalAmountBeforeDeposit = finalAmountValue + depositAmountValue;
  const totalWithShipping = finalAmountValue + shippingCost;
  const paidAmountValue = finalAmountValue + (initialShippingState?.shippingCost ?? 0);
  const formattedPaymentDate = formatPaymentDate(finalPaymentPaidAt);
  const balanceTaxSummary = getInclusiveTaxBreakdown(finalAmountValue);
  const shippingTaxSummary =
    quotedShipping?.shippingCost !== null && quotedShipping?.shippingCost !== undefined
      ? getInclusiveTaxBreakdown(quotedShipping.shippingCost)
      : null;
  const totalTaxSummary = hasShippingQuote
    ? getInclusiveTaxBreakdown(totalWithShipping)
    : null;
  const effectiveProductionStage =
    currentStage === "final_payment_in_review" &&
    finalPaymentOrderStatus === "completed"
      ? "delivered"
      : currentStage === "final_payment_in_review" &&
          finalPaymentOrderStatus === "processing"
        ? "in_production"
      : currentStage;
  const finalTransferAmountLabel = formatOrderMoney(
    finalAmountValue + (initialShippingState?.shippingCost ?? shippingCost),
    currency,
  );

  useEffect(() => {
    if (availablePaymentMethods.includes(paymentMethod)) {
      return;
    }

    setPaymentMethod(availablePaymentMethods[0] ?? "stripe");
  }, [availablePaymentMethods, paymentMethod]);

  const resetShippingQuoteState = () => {
    setQuotedShipping(null);
    setShippingQuoteError(null);
    setShowShippingValidation(false);
    setLastQuotedSignature("");
  };

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

  useEffect(() => {
    if (currentStage !== "waiting_for_final_payment") {
      return;
    }

    if (!isShippingReady || hasShippingErrors) {
      if (quotedShipping !== null) {
        setQuotedShipping(null);
      }

      if (shippingQuoteError !== null) {
        setShippingQuoteError(null);
      }

      return;
    }

    if (shippingRequestSignature === lastQuotedSignature) {
      return;
    }

    let isCancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setIsCalculatingShipping(true);
      setShippingQuoteError(null);

      try {
        const shippingQuote = await onCalculateShipping({
          address: shippingAddress,
          option: shippingOption,
        });

        if (isCancelled) {
          return;
        }

        setQuotedShipping(shippingQuote);
        setLastQuotedSignature(shippingRequestSignature);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setQuotedShipping(null);
        setShippingQuoteError(
          error instanceof Error
            ? error.message
            : "We could not calculate shipping for this address.",
        );
      } finally {
        if (!isCancelled) {
          setIsCalculatingShipping(false);
        }
      }
    }, SHIPPING_QUOTE_DEBOUNCE_MS);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    currentStage,
    hasShippingErrors,
    isShippingReady,
    lastQuotedSignature,
    onCalculateShipping,
    quotedShipping,
    shippingAddress,
    shippingOption,
    shippingQuoteError,
    shippingRequestSignature,
  ]);

  if (effectiveProductionStage === "waiting_for_final_payment") {
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
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Name
                </span>
                <input
                  type="text"
                  value={shippingFirstName ?? ""}
                  onChange={(event) =>
                    {
                      setShippingAddress((prev) => ({
                        ...prev,
                        fullName: [event.target.value.trim(), shippingLastName]
                          .filter(Boolean)
                          .join(" "),
                      }));
                      resetShippingQuoteState();
                    }
                  }
                  onFocus={resetShippingQuoteState}
                  placeholder="Name"
                  className={`w-full rounded-md bg-white px-3 py-2 text-slate-900 outline-none transition focus:ring-2 ${
                    showShippingValidation && shippingErrors.fullName
                      ? "border border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border border-slate-300 focus:border-yellow-400 focus:ring-yellow-200"
                  }`}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Lastname
                </span>
                <input
                  type="text"
                  value={shippingLastName}
                  onChange={(event) =>
                    {
                      setShippingAddress((prev) => ({
                        ...prev,
                        fullName: [shippingFirstName ?? "", event.target.value.trim()]
                          .filter(Boolean)
                          .join(" "),
                      }));
                      resetShippingQuoteState();
                    }
                  }
                  onFocus={resetShippingQuoteState}
                  placeholder="Lastname"
                  className={`w-full rounded-md bg-white px-3 py-2 text-slate-900 outline-none transition focus:ring-2 ${
                    showShippingValidation && shippingErrors.fullName
                      ? "border border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border border-slate-300 focus:border-yellow-400 focus:ring-yellow-200"
                  }`}
                />
              </label>
              {showShippingValidation && shippingErrors.fullName ? (
                <p className="sm:col-span-2 -mt-2 text-sm text-red-600">
                  {shippingErrors.fullName}
                </p>
              ) : null}
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Email
                </span>
                <input
                  type="email"
                  value={shippingAddress.email}
                  onChange={(event) =>
                    {
                      setShippingAddress((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }));
                      resetShippingQuoteState();
                    }
                  }
                  onFocus={resetShippingQuoteState}
                  placeholder="Email"
                  className={`w-full rounded-md bg-white px-3 py-2 text-slate-900 outline-none transition focus:ring-2 ${
                    showShippingValidation && shippingErrors.email
                      ? "border border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border border-slate-300 focus:border-yellow-400 focus:ring-yellow-200"
                  }`}
                />
                {showShippingValidation && shippingErrors.email ? (
                  <p className="mt-2 text-sm text-red-600">
                    {shippingErrors.email}
                  </p>
                ) : null}
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Phone number
                </span>
                <input
                  type="tel"
                  value={shippingAddress.phoneNumber}
                  onChange={(event) =>
                    {
                      setShippingAddress((prev) => ({
                        ...prev,
                        phoneNumber: event.target.value,
                      }));
                      resetShippingQuoteState();
                    }
                  }
                  onFocus={resetShippingQuoteState}
                  placeholder="Phone number"
                  className={`w-full rounded-md bg-white px-3 py-2 text-slate-900 outline-none transition focus:ring-2 ${
                    showShippingValidation && shippingErrors.phoneNumber
                      ? "border border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border border-slate-300 focus:border-yellow-400 focus:ring-yellow-200"
                  }`}
                />
                {showShippingValidation && shippingErrors.phoneNumber ? (
                  <p className="mt-2 text-sm text-red-600">
                    {shippingErrors.phoneNumber}
                  </p>
                ) : null}
              </label>
              <label className="block sm:col-span-2">
                <input
                  type="text"
                  list={countryListId}
                  value={shippingAddress.country}
                  onChange={(event) => {
                    const nextCountryName = event.target.value;
                    const nextCountryCode = getCountryCodeByName(nextCountryName);
                    setShippingAddress((prev) => ({
                      ...prev,
                      country: nextCountryName,
                      countryCode: nextCountryCode,
                      city: nextCountryCode !== prev.countryCode ? "" : prev.city,
                      postalCode: nextCountryCode !== prev.countryCode ? "" : prev.postalCode,
                    }));
                    resetShippingQuoteState();
                  }}
                  placeholder="Country"
                  className={`w-full rounded-md bg-white px-3 py-2 text-slate-900 outline-none transition focus:ring-2 ${
                    showShippingValidation && shippingErrors.country
                      ? "border border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border border-slate-300 focus:border-yellow-400 focus:ring-yellow-200"
                  }`}
                />
                <datalist id={countryListId}>
                  {AVAILABLE_COUNTRIES.map((country) => (
                    <option key={country.code} value={country.name} />
                  ))}
                </datalist>
                {showShippingValidation && shippingErrors.country ? (
                  <p className="mt-2 text-sm text-red-600">
                    {shippingErrors.country}
                  </p>
                ) : null}
              </label>
              <label className="block">
                <input
                  type="text"
                  value={shippingAddress.postalCode}
                  onChange={(event) =>
                    {
                      setShippingAddress((prev) => ({
                        ...prev,
                        postalCode: event.target.value,
                      }));
                      resetShippingQuoteState();
                    }
                  }
                  onFocus={resetShippingQuoteState}
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
                  list={cityOptions.length > 0 ? cityListId : undefined}
                  value={shippingAddress.city}
                  onChange={(event) =>
                    {
                      setShippingAddress((prev) => ({
                        ...prev,
                        city: event.target.value,
                      }));
                      resetShippingQuoteState();
                    }
                  }
                  onFocus={resetShippingQuoteState}
                  disabled={!shippingAddress.countryCode}
                  placeholder="City"
                  className={`w-full rounded-md bg-white px-3 py-2 text-slate-900 outline-none transition focus:ring-2 ${
                    showShippingValidation && shippingErrors.city
                      ? "border border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border border-slate-300 focus:border-yellow-400 focus:ring-yellow-200"
                  }`}
                />
                {cityOptions.length > 0 ? (
                  <datalist id={cityListId}>
                    {cityOptions.map((city) => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                ) : null}
                {showShippingValidation && shippingErrors.city ? (
                  <p className="mt-2 text-sm text-red-600">
                    {shippingErrors.city}
                  </p>
                ) : null}
              </label>
              <label className="block sm:col-span-2">
                <input
                  type="text"
                  value={shippingAddress.street}
                  onChange={(event) =>
                    {
                      setShippingAddress((prev) => ({
                        ...prev,
                        street: event.target.value,
                      }));
                      resetShippingQuoteState();
                    }
                  }
                  onFocus={resetShippingQuoteState}
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
                      resetShippingQuoteState();
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
                      resetShippingQuoteState();
                    }}
                  />
                  <span>Studio pickup</span>
                </label>
              </div>
            </fieldset>

            <div className="mt-5 border-t border-slate-200 pt-5">
              <p className="text-sm font-semibold text-slate-900">
                Payment options
              </p>
              <div className="mt-3 grid gap-2">
                {availablePaymentMethods.map((method) => (
                  <PaymentOption
                    key={method}
                    icon={
                      method === "classic_transfer" ? (
                        <BankTransferIcon />
                      ) : (
                        <StripeCardIcon />
                      )
                    }
                    isSelected={paymentMethod === method}
                    onSelect={() => setPaymentMethod(method)}
                    title={
                      method === "classic_transfer"
                        ? "Classic bank transfer"
                        : "Stripe"
                    }
                    helper=""
                  />
                ))}
              </div>
              {paymentMethod === "classic_transfer" && hasShippingQuote ? (
                <BankTransferDetails
                  amountLabel={
                    totalTaxSummary
                      ? formatOrderMoney(totalTaxSummary.grossAmount, currency)
                      : finalTransferAmountLabel
                  }
                  orderNumber={orderNumber}
                />
              ) : null}
            </div>
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
                  -{depositAmountValue.toLocaleString("en-US").replace(/,/g, " ")} EUR
                </span>
              </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className="text-slate-700">Shipping</span>
                <div className="text-right">
                  <span className="font-semibold text-slate-900">
                    {isCalculatingShipping
                      ? <PendingValue />
                      : hasShippingQuote
                      ? shippingCost === 0
                        ? formatOrderMoney(0, currency)
                        : formatOrderMoney(shippingCost, currency)
                      : "Fill shipping details"}
                  </span>
                  {quotedShipping?.shippingRateLabel ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {quotedShipping.shippingRateLabel}
                    </p>
                  ) : null}
                  {quotedShipping?.shippingEstimateNotice ? (
                    <p className="mt-1 max-w-[14rem] text-xs text-amber-700">
                      {quotedShipping.shippingEstimateNotice}
                      {quotedShipping.shippingCost === null ? (
                        <>
                          {" "}
                          <Link
                            to="/contact"
                            className="font-semibold underline underline-offset-2"
                          >
                            Contact us
                          </Link>
                          .
                        </>
                      ) : null}
                    </p>
                  ) : null}
                </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className="text-slate-700">Payment method</span>
                  <span className="font-semibold text-slate-900">
                    {paymentMethod === "classic_transfer"
                      ? "Classic transfer"
                      : "Stripe"}
                  </span>
                </div>
              <div className="mt-3 border-t border-slate-200 pt-3">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <span className="text-slate-700">VAT total (23% included)</span>
                  <span className="font-semibold text-slate-900">
                    {totalTaxSummary
                      ? formatOrderMoney(totalTaxSummary.taxAmount, currency)
                      : isCalculatingShipping
                        ? <PendingValue />
                        : <PendingValue />}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-slate-900">
                    Total due
                  </span>
                  <span className="text-lg font-semibold text-slate-900">
                    {totalTaxSummary
                      ? formatOrderMoney(totalTaxSummary.grossAmount, currency)
                      : isCalculatingShipping
                        ? <PendingValue />
                        : <PendingValue />}
                  </span>
                </div>
              </div>
            </div>
            {shippingQuoteError ? (
              <p className="mt-4 text-sm text-red-600">{shippingQuoteError}</p>
            ) : null}
            <button
              type="button"
              disabled={!hasShippingQuote || isCalculatingShipping}
              onClick={() =>
                {
                  setShowShippingValidation(true);

                  if (hasShippingErrors) {
                    return;
                  }

                  onPayFinalAmount({
                    address: quotedShipping?.address ?? shippingAddress,
                    paymentMethod,
                    option: shippingOption,
                  });
                }
              }
              className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmittingFinalPayment
                ? "Submitting payment..."
                : paymentMethod === "classic_transfer"
                  ? "Continue with transfer"
                  : "Pay final amount"}
            </button>
          </aside>
        </div>
      </section>
    );
  }

  if (effectiveProductionStage === "final_payment_in_review") {
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
        {finalPaymentMethod === "classic_transfer" ? (
          <BankTransferDetails
            amountLabel={finalTransferAmountLabel}
            orderNumber={orderNumber}
          />
        ) : null}
      </section>
    );
  }

  if (
    effectiveProductionStage === "in_production" ||
    effectiveProductionStage === "waiting_for_delivery" ||
    effectiveProductionStage === "delivered"
  ) {
    return (
      <section
        className={`rounded-xl p-6 shadow-sm ${
          (effectiveProductionStage === "in_production" ||
            effectiveProductionStage === "delivered") &&
          hasProductionHighlight
            ? "border border-emerald-200 bg-emerald-50"
            : "border border-slate-200 bg-white"
        }`}
      >
        <p
          className={`text-xs font-semibold uppercase tracking-[0.14em] ${
            (effectiveProductionStage === "in_production" ||
              effectiveProductionStage === "delivered") &&
            hasProductionHighlight
              ? "text-emerald-700"
              : "text-slate-500"
          }`}
        >
          Production
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">
          {effectiveProductionStage === "in_production"
            ? "In production"
            : effectiveProductionStage === "waiting_for_delivery"
              ? "Ready"
              : "Delivered"}
        </h2>
        {effectiveProductionStage === "waiting_for_delivery" ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Your bicycle is ready for delivery or pickup.
            {trackingUrl ? (
              <>
                {" "}
                Courier tracking is available below.
              </>
            ) : null}
          </p>
        ) : null}
        {trackingUrl &&
        (effectiveProductionStage === "waiting_for_delivery" ||
          effectiveProductionStage === "delivered") ? (
          <div className="mt-4 rounded-lg border border-pink-200 bg-pink-50 p-4">
            <span className="mb-2 block text-sm font-semibold text-pink-700">
              Courier tracking
            </span>
            <a
              href={trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="break-all text-sm font-medium text-pink-900 underline underline-offset-2"
            >
              {trackingUrl}
            </a>
          </div>
        ) : null}
        <div
          className={`mt-5 grid gap-4 ${
            initialShippingState?.option === "courier" ? "md:grid-cols-2" : ""
          }`}
        >
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              {effectiveProductionStage === "delivered"
                ? "Delivered on"
                : "Estimated delivery time"}
            </span>
            <p className="text-sm text-slate-900">
              {effectiveProductionStage === "delivered"
                ? MOCK_DELIVERED_ON
                : MOCK_ESTIMATED_DELIVERY_TIME}
            </p>
          </div>
          {initialShippingState?.option === "courier" ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Shipping address
              </span>
              <div className="space-y-1 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">
                  {initialShippingState.address.fullName}
                </p>
                <p>{initialShippingState.address.email}</p>
                <p>{initialShippingState.address.phoneNumber}</p>
                <p>{initialShippingState.address.street}</p>
                <p>
                  {initialShippingState.address.postalCode}{" "}
                  {initialShippingState.address.city}
                </p>
                <p>{initialShippingState.address.country}</p>
              </div>
            </div>
          ) : null}
        </div>
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className={`grid gap-4 ${formattedPaymentDate ? "sm:grid-cols-2" : ""}`}>
            {formattedPaymentDate ? (
              <div>
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Payment date
                </span>
                <p className="text-sm text-slate-900">{formattedPaymentDate}</p>
              </div>
            ) : null}
            <div>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Amount paid by customer
              </span>
              <p className="text-sm text-slate-900">
                {formatOrderMoney(paidAmountValue, currency)}
              </p>
            </div>
          </div>
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
