import { useEffect, useState, type ReactNode } from "react";
import { InputField, LockedField } from "~/components/form-field";
import { LocalizedLink } from "~/components/localized-link";
import { useLocale } from "~/components/locale-provider";
import type {
  DepositPaymentMethod,
  OrderStage,
  StoredDepositPayment,
} from "~/lib/mock-order";
import { formatOrderMoney, getInclusiveTaxBreakdown } from "~/lib/order-tax";
import { SectionPill } from "~/components/section-pill";
import { AnimatedOrderSection } from "./order-motion";

const DEPOSIT_SUCCESS_HIGHLIGHT_DELAY_MS = 4000;
function validatePasswords(password: string, repeatPassword: string) {
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

export function OrderDepositSection({
  agreementAccepted,
  availablePaymentMethods,
  claimError,
  customerDetails,
  currentStage,
  depositAmountLabel,
  depositAmountValue,
  depositCurrency,
  depositOrderStatus,
  depositPayment,
  isDepositConfirmed,
  isProcessingPayment,
  onAgreementChange,
  onClaimErrorChange,
  orderNumber,
  onPayDeposit,
  requiresClaim,
}: {
  agreementAccepted: boolean;
  availablePaymentMethods: DepositPaymentMethod[];
  claimError: string | null;
  customerDetails: {
    email: string;
    fullName: string;
    orderTitle: string;
    phoneNumber: string;
  };
  currentStage: OrderStage;
  depositAmountLabel: string;
  depositAmountValue: number;
  depositCurrency: string;
  depositOrderStatus: string;
  depositPayment: StoredDepositPayment | null;
  isDepositConfirmed: boolean;
  isProcessingPayment: boolean;
  onAgreementChange: (value: boolean) => void;
  onClaimErrorChange: (value: string | null) => void;
  orderNumber: string;
  onPayDeposit: (payload: {
    password: string;
    paymentMethod: DepositPaymentMethod;
  }) => void;
  requiresClaim: boolean;
}) {
  const locale = useLocale();
  const depositPaid = currentStage !== "waiting_for_deposit";
  const [hasSuccessHighlight, setHasSuccessHighlight] = useState(false);
  const [isReceivedExpanded, setIsReceivedExpanded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<DepositPaymentMethod>(
    availablePaymentMethods[0] ?? "stripe",
  );
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [repeatPasswordTouched, setRepeatPasswordTouched] = useState(false);
  const [showPasswordValidation, setShowPasswordValidation] = useState(false);
  const passwordErrors = validatePasswords(password, repeatPassword);
  const hasPasswordErrors = Object.keys(passwordErrors).length > 0;
  const passwordFieldError =
    (showPasswordValidation || passwordTouched
      ? passwordErrors.password
      : undefined) ??
    claimError ??
    undefined;
  const repeatPasswordFieldError =
    showPasswordValidation || repeatPasswordTouched
      ? passwordErrors.repeatPassword
      : undefined;
  const depositTaxSummary = getInclusiveTaxBreakdown(depositAmountValue);
  const hasDepositReachedPaidState =
    isDepositConfirmed ||
    depositOrderStatus === "processing" ||
    depositOrderStatus === "completed";

  useEffect(() => {
    if (availablePaymentMethods.includes(paymentMethod)) {
      return;
    }

    setPaymentMethod(availablePaymentMethods[0] ?? "stripe");
  }, [availablePaymentMethods, paymentMethod]);

  useEffect(() => {
    if (!hasDepositReachedPaidState || !depositPayment) {
      setHasSuccessHighlight(false);
      return;
    }

    setHasSuccessHighlight(true);
    const timeoutId = window.setTimeout(() => {
      setHasSuccessHighlight(false);
    }, DEPOSIT_SUCCESS_HIGHLIGHT_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [depositPayment, hasDepositReachedPaidState]);

  const handlePayDeposit = () => {
    setShowPasswordValidation(true);

    if (requiresClaim && hasPasswordErrors) {
      return;
    }

    onPayDeposit({
      password,
      paymentMethod,
    });
  };

  if (depositPaid) {
    const isDepositStillUnderReview = !hasDepositReachedPaidState;
    const useSuccessColors = !isDepositStillUnderReview && hasSuccessHighlight;

    return (
      <AnimatedOrderSection
        className={`rounded-xl p-4 shadow-sm md:max-h-[80vh] md:overflow-y-auto md:p-6 ${
          useSuccessColors
            ? "border border-emerald-200 bg-emerald-50"
            : "border border-stone-200 bg-white"
        }`}
      >
        {isDepositStillUnderReview ? (
          <div className="flex flex-col gap-3">
            <div className="min-w-0">
              <SectionPill tone={useSuccessColors ? "success" : "light"}>
                Deposit
              </SectionPill>
              <div className="mt-1">
                <h2 className="text-xl font-semibold text-slate-900">
                  In review
                </h2>
              </div>
              <p
                className={`mt-2 max-w-3xl text-sm leading-6 ${
                  useSuccessColors ? "text-slate-700" : "text-slate-600"
                }`}
              >
                We are reviewing your deposit and confirming that the payment
                has been received correctly. In the meantime, you can add the
                measurements required for the design process below.
              </p>

              {depositPayment?.paymentMethod === "classic_transfer" ? (
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
                      <p className="mt-1">{depositPayment.amount}</p>
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
                      <p className="mt-1 font-medium text-slate-900">
                        PKOPPLPW
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Transfer title
                      </span>
                      <p className="mt-1 font-medium text-slate-900">
                        {`Deposit payment for order ${orderNumber}`}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setIsReceivedExpanded((prev) => !prev)}
              className="flex w-full items-start justify-between gap-4 pr-2 text-left"
              aria-expanded={isReceivedExpanded}
            >
              <div className="min-w-0">
                <SectionPill tone={useSuccessColors ? "success" : "light"}>
                  Deposit
                </SectionPill>
                <div className="mt-1">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Received
                  </h2>
                </div>
                <p
                  className={`mt-2 max-w-3xl text-sm leading-6 ${
                    useSuccessColors ? "text-slate-700" : "text-slate-600"
                  }`}
                >
                  Deposit has been confirmed. The order is secured and will
                  continue through the remaining build stages.
                </p>
              </div>
              <span
                className={`shrink-0 self-center transition-transform ${
                  isReceivedExpanded ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="block h-[22px] w-[22px]"
                  style={{ color: useSuccessColors ? "#047857" : "#64748b" }}
                >
                  <path
                    d="M5 7.5L10 12.5L15 7.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>

            {isReceivedExpanded && depositPayment ? (
              <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
                <div
                  className={`grid grid-cols-1 gap-x-6 gap-y-4 ${
                    depositPayment.paidAt ? "sm:grid-cols-2" : ""
                  }`}
                >
                  {depositPayment.paidAt ? (
                    <div>
                      <span className="mb-2 block text-sm font-semibold text-slate-700">
                        Payment date
                      </span>
                      <p className="text-sm text-slate-900">
                        {new Intl.DateTimeFormat("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(depositPayment.paidAt))}
                      </p>
                    </div>
                  ) : null}
                  <div>
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Amount
                    </span>
                    <p className="text-sm text-slate-900">
                      {depositPayment.amount}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </AnimatedOrderSection>
    );
  }

  return (
    <AnimatedOrderSection className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm md:max-h-[80vh] md:overflow-y-auto md:p-6">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.95fr)] md:items-start">
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <SectionPill>Deposit</SectionPill>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Waiting for deposit
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
            Book your place in the custom build queue. Once we receive the
            deposit, we will begin designing your dream bike.
          </p>

          <div className="mt-6 rounded-xl border border-stone-200 bg-stone-50 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Order details
              </p>
              <p className="mt-1 text-sm text-slate-600">
                We will use this data to contact you about your order.
              </p>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Order title
                </span>
                <LockedField
                  value={customerDetails.orderTitle}
                  className="px-3 py-2"
                />
              </div>

              <div className="sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Full name
                </span>
                <LockedField
                  value={customerDetails.fullName}
                  className="px-3 py-2"
                />
              </div>

              <div>
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Email
                </span>
                <LockedField
                  value={customerDetails.email}
                  className="px-3 py-2"
                />
              </div>

              <div>
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Phone number
                </span>
                <LockedField
                  value={customerDetails.phoneNumber}
                  className="px-3 py-2"
                />
              </div>

              {requiresClaim ? (
                <>
                  <label className="sm:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Create password
                    </span>
                    <InputField
                      type="password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        onClaimErrorChange(null);
                      }}
                      onBlur={() => setPasswordTouched(true)}
                      hasError={Boolean(passwordFieldError)}
                      className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                    />
                    {passwordFieldError ? (
                      <p className="mt-2 text-sm text-red-600">
                        {passwordFieldError}
                      </p>
                    ) : null}
                  </label>

                  <label className="sm:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Repeat password
                    </span>
                    <InputField
                      type="password"
                      value={repeatPassword}
                      onChange={(event) => {
                        setRepeatPassword(event.target.value);
                        onClaimErrorChange(null);
                      }}
                      onBlur={() => setRepeatPasswordTouched(true)}
                      hasError={Boolean(repeatPasswordFieldError)}
                      className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                    />
                    {repeatPasswordFieldError ? (
                      <p className="mt-2 text-sm text-red-600">
                        {repeatPasswordFieldError}
                      </p>
                    ) : null}
                  </label>

                  <p className="sm:col-span-2 text-xs leading-6 text-slate-600">
                    Save it securely. You will need this password to track your
                    order status.
                  </p>
                </>
              ) : null}
            </div>

            <div className="mt-6 border-t border-stone-200 pt-5">
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
            </div>
          </div>
        </div>

        <div className="md:sticky md:top-4">
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
              Order summary
            </p>
            <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {customerDetails.orderTitle || "Custom Kanna Bike Build"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Deposit amount due now
                </p>
              </div>

              <div className="mt-4 border-t border-stone-200 pt-4 text-sm text-slate-600">
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span>Net amount</span>
                  <span className="font-medium text-slate-900">
                    {formatOrderMoney(
                      depositTaxSummary.netAmount,
                      depositCurrency,
                      locale,
                    )}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span>{depositTaxSummary.taxLabel}</span>
                  <span className="font-medium text-slate-900">
                    {formatOrderMoney(
                      depositTaxSummary.taxAmount,
                      depositCurrency,
                      locale,
                    )}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span>Payment method</span>
                  <span className="font-medium text-slate-900">
                    {paymentMethod === "classic_transfer"
                      ? "Classic transfer"
                      : "Stripe"}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-4 border-t border-stone-200 pt-3 text-base font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{depositAmountLabel}</span>
                </div>
              </div>
            </div>

            <label className="mt-4 flex items-start gap-3 rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={agreementAccepted}
                onChange={(event) => onAgreementChange(event.target.checked)}
                className="mt-0.5"
              />
              <span>
                I accept the{" "}
                <LocalizedLink
                  to="/privacy-terms"
                  className="font-medium text-slate-900 underline underline-offset-2"
                >
                  order agreement
                </LocalizedLink>
                , deposit terms, and processing of my order data for this bike
                build. I understand that, once the bike enters production, the
                deposit becomes non-refundable.
              </span>
            </label>

            <button
              type="button"
              onClick={handlePayDeposit}
              disabled={!agreementAccepted || isProcessingPayment}
              className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-[var(--kanna-ink)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {isProcessingPayment ? "Preparing payment..." : "Pay Deposit"}
            </button>
          </div>
        </div>
      </div>
    </AnimatedOrderSection>
  );
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
