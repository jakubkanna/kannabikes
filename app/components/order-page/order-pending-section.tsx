import { useEffect, useId, useState } from "react";
import { DetailPanel } from "~/components/commerce/detail-panel";
import {
  BankTransferIcon,
  PaymentOption,
  StripeCardIcon,
} from "~/components/commerce/payment-option";
import { InputField } from "~/components/form-field";
import { LocalizedLink } from "~/components/localized-link";
import { useLocale, useMessages } from "~/components/locale-provider";
import { PhoneNumberField } from "~/components/phone-number-field";
import { SectionPill } from "~/components/section-pill";
import { Spinner } from "~/components/spinner";
import { getOrderPendingCopy } from "~/lib/i18n-messages";
import { AnimatedOrderSection } from "./order-motion";
import {
  MOCK_DELIVERED_ON,
  MOCK_ESTIMATED_DELIVERY_TIME,
  type DepositPaymentMethod,
  type OrderStage,
} from "~/lib/mock-order";
import {
  findCountryByCode,
  findCountryByName,
  loadCountryDirectory,
  type CountryDirectoryEntry,
} from "~/lib/countries";
import type { OrderShippingAddress, OrderShippingState } from "~/lib/order-api";
import { isPhoneNumberWithCountryCode } from "~/lib/phone";
import { formatOrderMoney, getInclusiveTaxBreakdown } from "~/lib/order-tax";
import { getIntlLocale } from "~/lib/i18n";

const PRODUCTION_SUCCESS_HIGHLIGHT_DELAY_MS = 4000;
const SHIPPING_QUOTE_DEBOUNCE_MS = 450;

type CountryOption = {
  code: string;
  name: string;
};

type ShippingReferenceData = {
  availableCountries: CountryOption[];
  getCountryLabel: (countryCode: string) => string;
  getCountryCodeByName: (countryName: string) => string;
  isValidCountry: (countryCode: string) => boolean;
  isValidPostalCode: (postalCode: string, countryCode: string) => boolean;
  isEmail: (email: string) => boolean;
};

let shippingReferenceDataPromise: Promise<ShippingReferenceData> | null = null;

function getCountryLabel(
  countryCode: string,
  availableCountries: CountryDirectoryEntry[],
) {
  const match = findCountryByCode(countryCode, availableCountries);

  return match?.name ?? "";
}

function getCountryCodeByName(
  countryName: string,
  availableCountries: CountryDirectoryEntry[],
) {
  const match = findCountryByName(countryName, availableCountries);

  return match?.code ?? "";
}

function loadShippingReferenceData() {
  if (shippingReferenceDataPromise) {
    return shippingReferenceDataPromise;
  }

  shippingReferenceDataPromise = Promise.all([
    loadCountryDirectory(),
    import("validator"),
  ]).then(([countryDirectory, validatorModule]) => {
    const validator = validatorModule.default;
    const availableCountries = countryDirectory.map((country) => ({
      code: country.code,
      name: country.name,
    }));
    const postalCodeLocales = new Set(
      validator.isPostalCodeLocales.map((locale) => locale.toUpperCase()),
    );

    return {
      availableCountries,
      getCountryLabel(countryCode: string) {
        return getCountryLabel(countryCode, countryDirectory);
      },
      getCountryCodeByName(countryName: string) {
        return getCountryCodeByName(countryName, countryDirectory);
      },
      isValidCountry(countryCode: string) {
        return Boolean(findCountryByCode(countryCode, countryDirectory));
      },
      isValidPostalCode(postalCode: string, countryCode: string) {
        const trimmedPostalCode = postalCode.trim();

        if (!trimmedPostalCode) {
          return false;
        }

        const normalizedCountryCode = countryCode.toUpperCase();
        const locale = postalCodeLocales.has(normalizedCountryCode)
          ? normalizedCountryCode
          : "any";

        return validator.isPostalCode(trimmedPostalCode, locale as never);
      },
      isEmail(email: string) {
        return validator.isEmail(email.trim());
      },
    };
  }).catch((error) => {
    shippingReferenceDataPromise = null;
    throw error;
  });

  return shippingReferenceDataPromise;
}

function validateShippingDetails(
  shippingAddress: OrderShippingAddress,
  shippingOption: "courier" | "pickup",
  shippingReferenceData: ShippingReferenceData | null,
  phoneErrorMessage: string,
  copy: ReturnType<typeof getOrderPendingCopy>,
) {
  const errors: Partial<Record<keyof typeof shippingAddress, string>> = {};
  const [firstName, ...lastNameParts] = shippingAddress.fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!firstName || firstName.length < 2) {
    errors.fullName = copy.errors.fullName;
  } else if (lastNameParts.join(" ").length < 2) {
    errors.fullName = copy.errors.lastName;
  }

  const isEmailValid = shippingReferenceData
    ? shippingReferenceData.isEmail(shippingAddress.email)
    : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingAddress.email.trim());

  if (!shippingAddress.email.trim() || !isEmailValid) {
    errors.email = copy.errors.email;
  }

  if (!isPhoneNumberWithCountryCode(shippingAddress.phoneNumber)) {
    errors.phoneNumber = phoneErrorMessage;
  }

  if (shippingOption === "courier") {
    if (shippingAddress.street.trim().length < 4) {
      errors.street = copy.errors.street;
    }
    if (
      shippingReferenceData &&
      !shippingReferenceData.isValidPostalCode(
        shippingAddress.postalCode,
        shippingAddress.countryCode,
      )
    ) {
      errors.postalCode = copy.errors.postalCode;
    }
    if (shippingAddress.city.trim().length < 2) {
      errors.city = copy.errors.city;
    }
    if (
      shippingReferenceData &&
      !shippingReferenceData.isValidCountry(shippingAddress.countryCode)
    ) {
      errors.country = copy.errors.country;
    }
  }

  return errors;
}

function isShippingFormReady(
  shippingAddress: OrderShippingAddress,
  shippingOption: "courier" | "pickup",
  isShippingReferenceReady: boolean,
) {
  if (shippingAddress.fullName.trim().length < 2) {
    return false;
  }

  if (
    !shippingAddress.email.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingAddress.email.trim())
  ) {
    return false;
  }

  if (!isPhoneNumberWithCountryCode(shippingAddress.phoneNumber)) {
    return false;
  }

  if (shippingOption === "pickup") {
    return true;
  }

  if (!isShippingReferenceReady) {
    return false;
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

function formatPaymentDate(value?: string | null, locale: "en" | "pl" = "en") {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function BankTransferDetails({
  amountLabel,
  copy,
  orderNumber,
}: {
  amountLabel: string;
  copy: ReturnType<typeof getOrderPendingCopy>;
  orderNumber: string;
}) {
  return (
    <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
      <p className="text-sm font-semibold text-gray-900">
        {copy.bankTransferDetails}
      </p>
      <div className="mt-3 grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
        <div>
          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
            {copy.accountHolder}
          </span>
          <p className="mt-1">Kanna Bikes Sp. z o.o.</p>
        </div>
        <div>
          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
            {copy.amount}
          </span>
          <p className="mt-1">{amountLabel}</p>
        </div>
        <div>
          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
            IBAN
          </span>
          <p className="mt-1 font-medium text-gray-900">
            PL12 3456 7890 1234 5678 9012 3456
          </p>
        </div>
        <div>
          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
            SWIFT / BIC
          </span>
          <p className="mt-1 font-medium text-gray-900">PKOPPLPW</p>
        </div>
        <div className="sm:col-span-2">
          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
            {copy.transferTitle}
          </span>
          <p className="mt-1 font-medium text-gray-900">
            {copy.finalPaymentForOrder(orderNumber)}
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
    <AnimatedOrderSection className="rounded-xl border border-dashed border-stone-300 bg-stone-100/80 p-6 shadow-sm">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={
          isEyebrowTitle
            ? "text-xs font-semibold uppercase tracking-[0.14em] text-gray-500"
            : "mt-2 text-xl font-semibold text-gray-900"
        }
      >
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
        {description}
      </p>
    </AnimatedOrderSection>
  );
}

export function OrderBikeDesignPreviewSection() {
  const locale = useLocale();
  const copy = getOrderPendingCopy(locale);
  return (
    <OrderPendingSection
      title={copy.nextBikeDesign}
      titleStyle="eyebrow"
      description={copy.nextBikeDesignDescription}
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
  const locale = useLocale();
  const messages = useMessages();
  const copy = getOrderPendingCopy(locale);
  const countryListId = useId();
  const [shippingOption, setShippingOption] = useState<"courier" | "pickup">(
    initialShippingState?.option ?? "courier",
  );
  const [paymentMethod, setPaymentMethod] = useState<DepositPaymentMethod>(
    finalPaymentMethod &&
      (finalPaymentMethod === "stripe" ||
        finalPaymentMethod === "classic_transfer")
      ? finalPaymentMethod
      : (availablePaymentMethods[0] ?? "stripe"),
  );
  const [showShippingValidation, setShowShippingValidation] = useState(false);
  const [shippingQuoteError, setShippingQuoteError] = useState<string | null>(
    null,
  );
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const hasInitialShippingState =
    Boolean(initialShippingState) &&
    Boolean(
      initialShippingState &&
      (initialShippingState.option === "pickup" ||
        initialShippingState.shippingCost !== null ||
        initialShippingState.shippingRateLabel),
    );
  const [lastQuotedSignature, setLastQuotedSignature] = useState(() => {
    if (hasInitialShippingState && initialShippingState) {
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
  const [quotedShipping, setQuotedShipping] =
    useState<OrderShippingState | null>(
      hasInitialShippingState && initialShippingState
        ? {
            address: initialShippingState.address,
            option: initialShippingState.option,
            shippingCost: initialShippingState.shippingCost,
            shippingRateLabel: initialShippingState.shippingRateLabel,
            trackingUrl: initialShippingState.trackingUrl ?? "",
          }
        : null,
    );
  const [shippingReferenceData, setShippingReferenceData] =
    useState<ShippingReferenceData | null>(null);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: initialShippingState?.address.fullName ?? "",
    email: initialShippingState?.address.email ?? "",
    phoneNumber: initialShippingState?.address.phoneNumber ?? "",
    street: initialShippingState?.address.street ?? "",
    postalCode: initialShippingState?.address.postalCode ?? "",
    city: initialShippingState?.address.city ?? "",
    country: initialShippingState?.address.country ?? "",
    countryCode: initialShippingState?.address.countryCode ?? "",
  });
  const trackingUrl = initialShippingState?.trackingUrl?.trim() ?? "";
  const availableCountries = shippingReferenceData?.availableCountries ?? [];
  const shippingErrors = validateShippingDetails(
    shippingAddress,
    shippingOption,
    shippingReferenceData,
    messages.common.phoneNumberWithCountryCodeError,
    copy,
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
  const isShippingReady = isShippingFormReady(
    shippingAddress,
    shippingOption,
    shippingReferenceData !== null,
  );
  const hasShippingErrors = Object.keys(shippingErrors).length > 0;
  const effectiveShippingState =
    quotedShipping ??
    (hasInitialShippingState ? (initialShippingState ?? null) : null);
  const shippingCost = effectiveShippingState?.shippingCost ?? 0;
  const hasShippingQuote =
    effectiveShippingState !== null &&
    effectiveShippingState.shippingCost !== null;
  const totalAmountBeforeDeposit = finalAmountValue + depositAmountValue;
  const totalWithShipping = finalAmountValue + shippingCost;
  const formattedPaymentDate = formatPaymentDate(finalPaymentPaidAt, locale);
  const balanceTaxSummary = getInclusiveTaxBreakdown(finalAmountValue, locale);
  const shippingTaxSummary =
    effectiveShippingState?.shippingCost !== null &&
    effectiveShippingState?.shippingCost !== undefined
      ? getInclusiveTaxBreakdown(effectiveShippingState.shippingCost, locale)
      : null;
  const totalTaxSummary = hasShippingQuote
    ? getInclusiveTaxBreakdown(totalWithShipping, locale)
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
    finalAmountValue + shippingCost,
    currency,
    locale,
  );

  useEffect(() => {
    let isCancelled = false;

    void loadShippingReferenceData().then((data) => {
      if (!isCancelled) {
        setShippingReferenceData(data);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!shippingReferenceData) {
      return;
    }

    setShippingAddress((prev) => {
      const nextCountryCode =
        prev.countryCode ||
        shippingReferenceData.getCountryCodeByName(prev.country);
      const nextCountry =
        prev.country || shippingReferenceData.getCountryLabel(nextCountryCode);

      if (
        nextCountryCode === prev.countryCode &&
        nextCountry === prev.country
      ) {
        return prev;
      }

      return {
        ...prev,
        country: nextCountry,
        countryCode: nextCountryCode,
      };
    });
  }, [shippingReferenceData]);

  useEffect(() => {
    if (!hasInitialShippingState || !initialShippingState) {
      return;
    }

    const nextShippingState: OrderShippingState = {
      address: initialShippingState.address,
      option: initialShippingState.option,
      shippingCost: initialShippingState.shippingCost,
      shippingRateLabel: initialShippingState.shippingRateLabel,
      shippingEstimateNotice: initialShippingState.shippingEstimateNotice,
      trackingUrl: initialShippingState.trackingUrl ?? "",
    };

    setQuotedShipping((previousState) => {
      if (
        previousState &&
        previousState.option === nextShippingState.option &&
        previousState.shippingCost === nextShippingState.shippingCost &&
        previousState.shippingRateLabel ===
          nextShippingState.shippingRateLabel &&
        previousState.shippingEstimateNotice ===
          nextShippingState.shippingEstimateNotice &&
        previousState.trackingUrl === nextShippingState.trackingUrl &&
        previousState.address.fullName === nextShippingState.address.fullName &&
        previousState.address.street === nextShippingState.address.street &&
        previousState.address.postalCode ===
          nextShippingState.address.postalCode &&
        previousState.address.city === nextShippingState.address.city &&
        previousState.address.countryCode ===
          nextShippingState.address.countryCode
      ) {
        return previousState;
      }

      return nextShippingState;
    });

    setLastQuotedSignature(
      [
        initialShippingState.option,
        initialShippingState.address.fullName.trim(),
        initialShippingState.address.street.trim(),
        initialShippingState.address.postalCode.trim(),
        initialShippingState.address.city.trim(),
        initialShippingState.address.countryCode.trim(),
      ].join("|"),
    );
  }, [hasInitialShippingState, initialShippingState]);

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

    if (shippingOption === "courier" && shippingReferenceData === null) {
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
            : copy.errors.shippingQuote,
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
    shippingReferenceData,
  ]);

  if (effectiveProductionStage === "waiting_for_final_payment") {
    return (
      <AnimatedOrderSection className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <SectionPill>{copy.production}</SectionPill>
        <h2 className="mt-2 text-xl font-semibold text-gray-900">
          {copy.waitingForFinalPayment}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
          {copy.waitingForFinalPaymentDescription}
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)] md:items-start">
          <DetailPanel title={copy.shippingDetails}>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-gray-700">
                  {copy.firstName}
                </span>
                <InputField
                  type="text"
                  value={shippingFirstName ?? ""}
                  onChange={(event) => {
                    setShippingAddress((prev) => ({
                      ...prev,
                      fullName: [event.target.value.trim(), shippingLastName]
                        .filter(Boolean)
                        .join(" "),
                    }));
                    resetShippingQuoteState();
                  }}
                  onFocus={resetShippingQuoteState}
                  placeholder={copy.firstName}
                  hasError={
                    showShippingValidation && Boolean(shippingErrors.fullName)
                  }
                  className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-gray-700">
                  {copy.lastName}
                </span>
                <InputField
                  type="text"
                  value={shippingLastName}
                  onChange={(event) => {
                    setShippingAddress((prev) => ({
                      ...prev,
                      fullName: [
                        shippingFirstName ?? "",
                        event.target.value.trim(),
                      ]
                        .filter(Boolean)
                        .join(" "),
                    }));
                    resetShippingQuoteState();
                  }}
                  onFocus={resetShippingQuoteState}
                  placeholder={copy.lastName}
                  hasError={
                    showShippingValidation && Boolean(shippingErrors.fullName)
                  }
                  className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                />
              </label>
              {showShippingValidation && shippingErrors.fullName ? (
                <p className="sm:col-span-2 -mt-2 text-sm text-red-600">
                  {shippingErrors.fullName}
                </p>
              ) : null}
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-gray-700">
                  {copy.email}
                </span>
                <InputField
                  type="email"
                  value={shippingAddress.email}
                  onChange={(event) => {
                    setShippingAddress((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }));
                    resetShippingQuoteState();
                  }}
                  onFocus={resetShippingQuoteState}
                  placeholder={copy.email}
                  hasError={
                    showShippingValidation && Boolean(shippingErrors.email)
                  }
                  className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                />
                {showShippingValidation && shippingErrors.email ? (
                  <p className="mt-2 text-sm text-red-600">
                    {shippingErrors.email}
                  </p>
                ) : null}
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-gray-700">
                  {copy.phoneNumber}
                </span>
                <PhoneNumberField
                  hasError={
                    showShippingValidation &&
                    Boolean(shippingErrors.phoneNumber)
                  }
                  inputClassName="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                  selectClassName="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                  value={shippingAddress.phoneNumber}
                  onChange={(phoneNumber) => {
                    setShippingAddress((prev) => ({
                      ...prev,
                      phoneNumber,
                    }));
                    resetShippingQuoteState();
                  }}
                />
                {showShippingValidation && shippingErrors.phoneNumber ? (
                  <p className="mt-2 text-sm text-red-600">
                    {shippingErrors.phoneNumber}
                  </p>
                ) : null}
              </label>
              <label className="block sm:col-span-2">
                <InputField
                  type="text"
                  list={countryListId}
                  value={shippingAddress.country}
                  onChange={(event) => {
                    const nextCountryName = event.target.value;
                    const nextCountryCode = shippingReferenceData
                      ? shippingReferenceData.getCountryCodeByName(
                          nextCountryName,
                        )
                      : "";
                    setShippingAddress((prev) => ({
                      ...prev,
                      country: nextCountryName,
                      countryCode: nextCountryCode,
                      city:
                        nextCountryCode !== prev.countryCode ? "" : prev.city,
                      postalCode:
                        nextCountryCode !== prev.countryCode
                          ? ""
                          : prev.postalCode,
                    }));
                    resetShippingQuoteState();
                  }}
                  placeholder={copy.country}
                  hasError={
                    showShippingValidation && Boolean(shippingErrors.country)
                  }
                  className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                />
                <datalist id={countryListId}>
                  {availableCountries.map((country) => (
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
                <InputField
                  type="text"
                  value={shippingAddress.postalCode}
                  onChange={(event) => {
                    setShippingAddress((prev) => ({
                      ...prev,
                      postalCode: event.target.value,
                    }));
                    resetShippingQuoteState();
                  }}
                  onFocus={resetShippingQuoteState}
                  placeholder={copy.postalCode}
                  hasError={
                    showShippingValidation && Boolean(shippingErrors.postalCode)
                  }
                  className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                />
                {showShippingValidation && shippingErrors.postalCode ? (
                  <p className="mt-2 text-sm text-red-600">
                    {shippingErrors.postalCode}
                  </p>
                ) : null}
              </label>
              <label className="block">
                <InputField
                  type="text"
                  value={shippingAddress.city}
                  onChange={(event) => {
                    setShippingAddress((prev) => ({
                      ...prev,
                      city: event.target.value,
                    }));
                    resetShippingQuoteState();
                  }}
                  onFocus={resetShippingQuoteState}
                  disabled={!shippingAddress.countryCode}
                  placeholder={copy.city}
                  hasError={
                    showShippingValidation && Boolean(shippingErrors.city)
                  }
                  className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                />
                {showShippingValidation && shippingErrors.city ? (
                  <p className="mt-2 text-sm text-red-600">
                    {shippingErrors.city}
                  </p>
                ) : null}
              </label>
              <label className="block sm:col-span-2">
                <InputField
                  type="text"
                  value={shippingAddress.street}
                  onChange={(event) => {
                    setShippingAddress((prev) => ({
                      ...prev,
                      street: event.target.value,
                    }));
                    resetShippingQuoteState();
                  }}
                  onFocus={resetShippingQuoteState}
                  placeholder={copy.street}
                  hasError={
                    showShippingValidation && Boolean(shippingErrors.street)
                  }
                  className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                />
                {showShippingValidation && shippingErrors.street ? (
                  <p className="mt-2 text-sm text-red-600">
                    {shippingErrors.street}
                  </p>
                ) : null}
              </label>
            </div>

            <fieldset className="mt-5">
              <legend className="mb-2 text-sm font-semibold text-gray-700">
                {copy.shippingOption}
              </legend>
              <div className="grid gap-2">
                <label className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-gray-900">
                  <input
                    type="radio"
                    name="shipping-option"
                    checked={shippingOption === "courier"}
                    onChange={() => {
                      setShippingOption("courier");
                      resetShippingQuoteState();
                    }}
                  />
                  <span>{copy.courierDelivery}</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-gray-900">
                  <input
                    type="radio"
                    name="shipping-option"
                    checked={shippingOption === "pickup"}
                    onChange={() => {
                      setShippingOption("pickup");
                      resetShippingQuoteState();
                    }}
                  />
                  <span>{copy.showroomPickup}</span>
                </label>
              </div>
            </fieldset>

            <div className="mt-5 border-t border-stone-200 pt-5">
              <p className="text-sm font-semibold text-gray-900">
                {copy.paymentOptions}
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
                        ? copy.classicBankTransfer
                        : "Stripe"
                    }
                    helper=""
                  />
                ))}
              </div>
              {paymentMethod === "classic_transfer" && hasShippingQuote ? (
                <BankTransferDetails
                  copy={copy}
                  amountLabel={
                    totalTaxSummary
                      ? formatOrderMoney(
                          totalTaxSummary.grossAmount,
                          currency,
                          locale,
                        )
                      : finalTransferAmountLabel
                  }
                  orderNumber={orderNumber}
                />
              ) : null}
            </div>
          </DetailPanel>

          <aside className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">{copy.summary}</h3>
            <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-700">{copy.totalAmount}</span>
                <span className="font-semibold text-gray-900">
                  {formatOrderMoney(totalAmountBeforeDeposit, currency, locale)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-4">
                <span className="text-gray-700">{copy.deposit}</span>
                <span className="font-semibold text-gray-900">
                  -{formatOrderMoney(depositAmountValue, currency, locale)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-4">
                <span className="text-gray-700">{copy.shipping}</span>
                <div className="text-right">
                  <span className="font-semibold text-gray-900">
                    {isCalculatingShipping ? (
                      <PendingValue />
                    ) : hasShippingQuote ? (
                      shippingCost === 0 ? (
                        formatOrderMoney(0, currency, locale)
                      ) : (
                        formatOrderMoney(shippingCost, currency, locale)
                      )
                    ) : (
                      copy.fillShippingDetails
                    )}
                  </span>
                  {quotedShipping?.shippingRateLabel ? (
                    <p className="mt-1 text-xs text-gray-500">
                      {quotedShipping.shippingRateLabel}
                    </p>
                  ) : null}
                  {quotedShipping?.shippingEstimateNotice ? (
                    <p className="mt-1 max-w-[14rem] text-xs text-amber-700">
                      {quotedShipping.shippingEstimateNotice}
                      {quotedShipping.shippingCost === null ? (
                        <>
                          {" "}
                          <LocalizedLink
                            to="/contact"
                            className="font-semibold underline underline-offset-2"
                          >
                            {copy.contactUs}
                          </LocalizedLink>
                          .
                        </>
                      ) : null}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-4">
                <span className="text-gray-700">{copy.paymentMethod}</span>
                <span className="font-semibold text-gray-900">
                  {paymentMethod === "classic_transfer"
                    ? copy.classicTransfer
                    : "Stripe"}
                </span>
              </div>
              <div className="mt-3 border-t border-stone-200 pt-3">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <span className="text-gray-700">
                    {copy.vatIncluded}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {totalTaxSummary ? (
                      formatOrderMoney(
                        totalTaxSummary.taxAmount,
                        currency,
                        locale,
                      )
                    ) : isCalculatingShipping ? (
                      <PendingValue />
                    ) : (
                      <PendingValue />
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-base font-semibold text-gray-900">
                    {copy.totalDue}
                  </span>
                  <span className="text-lg font-semibold text-gray-900">
                    {totalTaxSummary ? (
                      formatOrderMoney(
                        totalTaxSummary.grossAmount,
                        currency,
                        locale,
                      )
                    ) : isCalculatingShipping ? (
                      <PendingValue />
                    ) : (
                      <PendingValue />
                    )}
                  </span>
                </div>
              </div>
            </div>
            {shippingQuoteError ? (
              <p className="mt-4 text-sm text-red-600">{shippingQuoteError}</p>
            ) : null}
            <button
              type="button"
              disabled={isCalculatingShipping || isSubmittingFinalPayment}
              onClick={() => {
                setShowShippingValidation(true);

                if (hasShippingErrors || !hasShippingQuote) {
                  return;
                }

                onPayFinalAmount({
                  address: quotedShipping?.address ?? shippingAddress,
                  paymentMethod,
                  option: shippingOption,
                });
              }}
              className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-[var(--kanna-ink)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {isSubmittingFinalPayment
                ? copy.submittingPayment
                : paymentMethod === "classic_transfer"
                  ? copy.continueWithTransfer
                  : copy.payFinalAmount}
            </button>
          </aside>
        </div>
      </AnimatedOrderSection>
    );
  }

  if (effectiveProductionStage === "final_payment_in_review") {
    return (
      <AnimatedOrderSection className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <SectionPill>{copy.production}</SectionPill>
        <h2 className="mt-2 text-xl font-semibold text-gray-900">{copy.inReview}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
          {copy.inReviewDescription}
        </p>
        {finalPaymentMethod === "classic_transfer" ? (
          <BankTransferDetails
            copy={copy}
            amountLabel={finalTransferAmountLabel}
            orderNumber={orderNumber}
          />
        ) : null}
      </AnimatedOrderSection>
    );
  }

  if (
    effectiveProductionStage === "in_production" ||
    effectiveProductionStage === "waiting_for_delivery" ||
    effectiveProductionStage === "delivered"
  ) {
    return (
      <AnimatedOrderSection
        className={`rounded-xl p-6 shadow-sm ${
          (effectiveProductionStage === "in_production" ||
            effectiveProductionStage === "delivered") &&
          hasProductionHighlight
            ? "border border-emerald-200 bg-emerald-50"
            : "border border-stone-200 bg-white"
        }`}
      >
        <SectionPill
          tone={
            (effectiveProductionStage === "in_production" ||
              effectiveProductionStage === "delivered") &&
            hasProductionHighlight
              ? "success"
              : "light"
          }
        >
          {copy.production}
        </SectionPill>
        <h2 className="mt-2 text-xl font-semibold text-gray-900">
          {effectiveProductionStage === "in_production"
            ? copy.inProduction
            : effectiveProductionStage === "waiting_for_delivery"
              ? copy.ready
              : copy.delivered}
        </h2>
        {effectiveProductionStage === "waiting_for_delivery" ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
            {trackingUrl
              ? copy.courierTrackingAvailable
              : copy.readyDescription}
          </p>
        ) : null}
        {trackingUrl &&
        (effectiveProductionStage === "waiting_for_delivery" ||
          effectiveProductionStage === "delivered") ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <span className="mb-2 block text-sm font-semibold text-amber-700">
              {copy.courierTracking}
            </span>
            <a
              href={trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="break-all text-sm font-medium text-amber-900 underline underline-offset-2"
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
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <span className="mb-2 block text-sm font-semibold text-gray-700">
              {effectiveProductionStage === "delivered"
                ? copy.deliveredOn
                : copy.estimatedDeliveryTime}
            </span>
            <p className="text-sm text-gray-900">
              {effectiveProductionStage === "delivered"
                ? MOCK_DELIVERED_ON
                : copy.estimatedDeliveryWindow}
            </p>
          </div>
          {initialShippingState?.option === "courier" ? (
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <span className="mb-2 block text-sm font-semibold text-gray-700">
                {copy.shippingAddress}
              </span>
              <div className="space-y-1 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">
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
        <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
          <div
            className={`grid gap-4 ${formattedPaymentDate ? "sm:grid-cols-2" : ""}`}
          >
            {formattedPaymentDate ? (
              <div>
                <span className="mb-2 block text-sm font-semibold text-gray-700">
                  {copy.paymentDate}
                </span>
                <p className="text-sm text-gray-900">{formattedPaymentDate}</p>
              </div>
            ) : null}
            <div>
              <span className="mb-2 block text-sm font-semibold text-gray-700">
                {copy.amountPaidByCustomer}
              </span>
              <p className="text-sm text-gray-900">
                {formatOrderMoney(totalWithShipping, currency, locale)}
              </p>
            </div>
          </div>
        </div>
      </AnimatedOrderSection>
    );
  }

  return (
    <OrderPendingSection
      title={copy.nextProduction}
      titleStyle="eyebrow"
      description={copy.nextProductionDescription}
    />
  );
}
