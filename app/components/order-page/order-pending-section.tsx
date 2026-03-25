import { useEffect, useId, useState, type ReactNode } from "react";
import { InputField } from "~/components/form-field";
import { LocalizedLink } from "~/components/localized-link";
import { SectionPill } from "~/components/section-pill";
import { Spinner } from "~/components/spinner";
import { AnimatedOrderSection } from "./order-motion";
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

type CountryOption = {
  code: string;
  name: string;
};

type ShippingReferenceData = {
  availableCountries: CountryOption[];
  getCityOptions: (countryCode: string) => string[];
  getCountryLabel: (countryCode: string) => string;
  getCountryCodeByName: (countryName: string) => string;
  isValidCountry: (countryCode: string) => boolean;
  isValidPostalCode: (postalCode: string, countryCode: string) => boolean;
  isEmail: (email: string) => boolean;
};

let shippingReferenceDataPromise: Promise<ShippingReferenceData> | null = null;

function getCountryLabel(
  countryCode: string,
  availableCountries: CountryOption[],
) {
  const match = availableCountries.find(
    (country) => country.code === countryCode.toUpperCase(),
  );

  return match?.name ?? "";
}

function getCountryCodeByName(
  countryName: string,
  availableCountries: CountryOption[],
) {
  const normalizedCountryName = countryName.trim().toLowerCase();
  const match = availableCountries.find(
    (country) => country.name.toLowerCase() === normalizedCountryName,
  );

  return match?.code ?? "";
}

function loadShippingReferenceData() {
  if (shippingReferenceDataPromise) {
    return shippingReferenceDataPromise;
  }

  shippingReferenceDataPromise = Promise.all([
    import("country-state-city"),
    import("validator"),
  ]).then(([countryStateCity, validatorModule]) => {
    const { City, Country } = countryStateCity;
    const validator = validatorModule.default;
    const availableCountries = Country.getAllCountries().map((country) => ({
      code: country.isoCode,
      name: country.name,
    }));
    const postalCodeLocales = new Set(
      validator.isPostalCodeLocales.map((locale) => locale.toUpperCase()),
    );

    return {
      availableCountries,
      getCityOptions(countryCode: string) {
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
      },
      getCountryLabel(countryCode: string) {
        return getCountryLabel(countryCode, availableCountries);
      },
      getCountryCodeByName(countryName: string) {
        return getCountryCodeByName(countryName, availableCountries);
      },
      isValidCountry(countryCode: string) {
        return availableCountries.some(
          (country) => country.code === countryCode.toUpperCase(),
        );
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
  });

  return shippingReferenceDataPromise;
}

function validateShippingDetails(
  shippingAddress: OrderShippingAddress,
  cityOptions: string[],
  shippingOption: "courier" | "pickup",
  shippingReferenceData: ShippingReferenceData | null,
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

  const isEmailValid = shippingReferenceData
    ? shippingReferenceData.isEmail(shippingAddress.email)
    : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingAddress.email.trim());

  if (!shippingAddress.email.trim() || !isEmailValid) {
    errors.email = "Enter a valid email address.";
  }

  const normalizedPhoneNumber = shippingAddress.phoneNumber.replace(
    /[^\d+]/g,
    "",
  );

  if (normalizedPhoneNumber.length < 7) {
    errors.phoneNumber = "Enter a valid phone number.";
  }

  if (shippingOption === "courier") {
    if (shippingAddress.street.trim().length < 4) {
      errors.street = "Enter street and house number.";
    }
    if (
      shippingReferenceData &&
      !shippingReferenceData.isValidPostalCode(
        shippingAddress.postalCode,
        shippingAddress.countryCode,
      )
    ) {
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
    if (
      shippingReferenceData &&
      !shippingReferenceData.isValidCountry(shippingAddress.countryCode)
    ) {
      errors.country = "Select a valid country.";
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

  if (shippingAddress.phoneNumber.replace(/[^\d+]/g, "").length < 7) {
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
          ? "border-[var(--kanna-ink)] bg-[var(--kanna-ink)] text-white"
          : "border-stone-200 bg-white text-slate-900 hover:border-stone-300"
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
              : "border-stone-300 bg-white"
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
    <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
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
    <AnimatedOrderSection className="rounded-xl border border-dashed border-stone-300 bg-stone-100/80 p-6 shadow-sm">
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
    </AnimatedOrderSection>
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
  const [quotedShipping, setQuotedShipping] = useState<OrderShippingState | null>(
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
  const cityOptions =
    shippingReferenceData?.getCityOptions(shippingAddress.countryCode) ?? [];
  const shippingErrors = validateShippingDetails(
    shippingAddress,
    cityOptions,
    shippingOption,
    shippingReferenceData,
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
    quotedShipping ?? (hasInitialShippingState ? initialShippingState ?? null : null);
  const shippingCost = effectiveShippingState?.shippingCost ?? 0;
  const hasShippingQuote =
    effectiveShippingState !== null && effectiveShippingState.shippingCost !== null;
  const totalAmountBeforeDeposit = finalAmountValue + depositAmountValue;
  const totalWithShipping = finalAmountValue + shippingCost;
  const formattedPaymentDate = formatPaymentDate(finalPaymentPaidAt);
  const balanceTaxSummary = getInclusiveTaxBreakdown(finalAmountValue);
  const shippingTaxSummary =
    effectiveShippingState?.shippingCost !== null &&
    effectiveShippingState?.shippingCost !== undefined
      ? getInclusiveTaxBreakdown(effectiveShippingState.shippingCost)
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
    finalAmountValue + shippingCost,
    currency,
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
        previousState.shippingRateLabel === nextShippingState.shippingRateLabel &&
        previousState.shippingEstimateNotice === nextShippingState.shippingEstimateNotice &&
        previousState.trackingUrl === nextShippingState.trackingUrl &&
        previousState.address.fullName === nextShippingState.address.fullName &&
        previousState.address.street === nextShippingState.address.street &&
        previousState.address.postalCode === nextShippingState.address.postalCode &&
        previousState.address.city === nextShippingState.address.city &&
        previousState.address.countryCode === nextShippingState.address.countryCode
      ) {
        return previousState;
      }

      return nextShippingState;
    });

    setLastQuotedSignature([
      initialShippingState.option,
      initialShippingState.address.fullName.trim(),
      initialShippingState.address.street.trim(),
      initialShippingState.address.postalCode.trim(),
      initialShippingState.address.city.trim(),
      initialShippingState.address.countryCode.trim(),
    ].join("|"));
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
    shippingReferenceData,
  ]);

  if (effectiveProductionStage === "waiting_for_final_payment") {
    return (
      <AnimatedOrderSection className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <SectionPill>Production</SectionPill>
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
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Shipping details
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Name
                </span>
                <InputField
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
                  hasError={showShippingValidation && Boolean(shippingErrors.fullName)}
                  className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Lastname
                </span>
                <InputField
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
                  hasError={showShippingValidation && Boolean(shippingErrors.fullName)}
                  className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
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
                <InputField
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
                  hasError={showShippingValidation && Boolean(shippingErrors.email)}
                  className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
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
                <InputField
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
                  hasError={showShippingValidation && Boolean(shippingErrors.phoneNumber)}
                  className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
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
                      ? shippingReferenceData.getCountryCodeByName(nextCountryName)
                      : "";
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
                  hasError={showShippingValidation && Boolean(shippingErrors.country)}
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
                  hasError={showShippingValidation && Boolean(shippingErrors.postalCode)}
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
                  hasError={showShippingValidation && Boolean(shippingErrors.city)}
                  className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
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
                <InputField
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
                  hasError={showShippingValidation && Boolean(shippingErrors.street)}
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
              <legend className="mb-2 text-sm font-semibold text-slate-700">
                Shipping option
              </legend>
              <div className="grid gap-2">
                <label className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-slate-900">
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
                <label className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-slate-900">
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

            <div className="mt-5 border-t border-stone-200 pt-5">
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

          <aside className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Summary</h3>
            <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm">
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
                          <LocalizedLink
                            to="/contact"
                            className="font-semibold underline underline-offset-2"
                          >
                            Contact us
                          </LocalizedLink>
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
              <div className="mt-3 border-t border-stone-200 pt-3">
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
                  <span className="text-base font-semibold text-slate-900">
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
              disabled={isCalculatingShipping || isSubmittingFinalPayment}
              onClick={() =>
                {
                  setShowShippingValidation(true);

                  if (hasShippingErrors || !hasShippingQuote) {
                    return;
                  }

                  onPayFinalAmount({
                    address: quotedShipping?.address ?? shippingAddress,
                    paymentMethod,
                    option: shippingOption,
                  });
                }
              }
              className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-[var(--kanna-ink)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {isSubmittingFinalPayment
                ? "Submitting payment..."
                : paymentMethod === "classic_transfer"
                  ? "Continue with transfer"
                  : "Pay final amount"}
            </button>
          </aside>
        </div>
      </AnimatedOrderSection>
    );
  }

  if (effectiveProductionStage === "final_payment_in_review") {
    return (
      <AnimatedOrderSection className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <SectionPill>Production</SectionPill>
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
          Production
        </SectionPill>
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
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <span className="mb-2 block text-sm font-semibold text-amber-700">
              Courier tracking
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
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
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
        <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
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
                {formatOrderMoney(totalWithShipping, currency)}
              </p>
            </div>
          </div>
        </div>
      </AnimatedOrderSection>
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
