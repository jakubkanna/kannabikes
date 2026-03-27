import { useEffect, useState, type ReactNode } from "react";
import { DetailPanel } from "~/components/commerce/detail-panel";
import {
  BankTransferIcon,
  PaymentOption,
  StripeCardIcon,
} from "~/components/commerce/payment-option";
import { LockedField } from "~/components/form-field";
import { LocalizedLink } from "~/components/localized-link";
import { useLocale, useMessages } from "~/components/locale-provider";
import { getIntlLocale } from "~/lib/i18n";
import { getOrderDepositTransferTitle } from "~/lib/i18n-messages";
import type {
  DepositPaymentMethod,
  OrderStage,
  StoredDepositPayment,
} from "~/lib/mock-order";
import { formatOrderMoney, getInclusiveTaxBreakdown } from "~/lib/order-tax";
import { SectionPill } from "~/components/section-pill";
import { AnimatedOrderSection } from "./order-motion";

const DEPOSIT_SUCCESS_HIGHLIGHT_DELAY_MS = 4000;

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
  orderNumber,
  onPayDeposit,
  orderAccessContent,
  requiresClaim,
}: {
  agreementAccepted: boolean;
  availablePaymentMethods: DepositPaymentMethod[];
  claimError: string | null;
  customerDetails: {
    email: string;
    firstName: string;
    fullName: string;
    lastName: string;
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
  orderNumber: string;
  onPayDeposit: (payload: { paymentMethod: DepositPaymentMethod }) => void;
  orderAccessContent?: ReactNode;
  requiresClaim: boolean;
}) {
  const locale = useLocale();
  const messages = useMessages();
  const depositMessages = messages.orderPortal.deposit;
  const depositPaid = currentStage !== "waiting_for_deposit";
  const [hasSuccessHighlight, setHasSuccessHighlight] = useState(false);
  const [isReceivedExpanded, setIsReceivedExpanded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<DepositPaymentMethod>(
    availablePaymentMethods[0] ?? "stripe",
  );
  const depositTaxSummary = getInclusiveTaxBreakdown(depositAmountValue, locale);
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
    onPayDeposit({
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
                {depositMessages.sectionPill}
              </SectionPill>
              <div className="mt-1">
                <h2 className="text-xl font-semibold text-gray-900">
                  {depositMessages.inReview}
                </h2>
              </div>
              <p
                className={`mt-2 max-w-3xl text-sm leading-6 ${
                  useSuccessColors ? "text-gray-700" : "text-gray-600"
                }`}
              >
                {depositMessages.inReviewDescription}
              </p>

              {depositPayment?.paymentMethod === "classic_transfer" ? (
                <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">
                    {depositMessages.bankTransferDetails}
                  </p>
                  <div className="mt-3 grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                        {depositMessages.accountHolder}
                      </span>
                      <p className="mt-1">Kanna Bikes Sp. z o.o.</p>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                        {depositMessages.amount}
                      </span>
                      <p className="mt-1">{depositPayment.amount}</p>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                        {depositMessages.iban}
                      </span>
                      <p className="mt-1 font-medium text-gray-900">
                        PL12 3456 7890 1234 5678 9012 3456
                      </p>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                        {depositMessages.swift}
                      </span>
                      <p className="mt-1 font-medium text-gray-900">PKOPPLPW</p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                        {depositMessages.transferTitle}
                      </span>
                      <p className="mt-1 font-medium text-gray-900">
                        {getOrderDepositTransferTitle(locale, orderNumber)}
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
                  {depositMessages.sectionPill}
                </SectionPill>
                <div className="mt-1">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {depositMessages.received}
                  </h2>
                </div>
                <p
                  className={`mt-2 max-w-3xl text-sm leading-6 ${
                    useSuccessColors ? "text-gray-700" : "text-gray-600"
                  }`}
                >
                  {depositMessages.receivedDescription}
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
                      <span className="mb-2 block text-sm font-semibold text-gray-700">
                        {depositMessages.paymentDate}
                      </span>
                      <p className="text-sm text-gray-900">
                        {new Intl.DateTimeFormat(getIntlLocale(locale), {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(depositPayment.paidAt))}
                      </p>
                    </div>
                  ) : null}
                  <div>
                    <span className="mb-2 block text-sm font-semibold text-gray-700">
                      {depositMessages.amount}
                    </span>
                    <p className="text-sm text-gray-900">
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
          <SectionPill>{depositMessages.sectionPill}</SectionPill>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900">
            {depositMessages.waitingForDeposit}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-700">
            {depositMessages.description}
          </p>

          <DetailPanel
            className="mt-6"
            title={depositMessages.orderDetails}
            description={depositMessages.orderDetailsDescription}
          >
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-gray-700">
                  {depositMessages.orderTitle}
                </span>
                <LockedField
                  value={customerDetails.orderTitle}
                  className="px-3 py-2"
                />
              </div>

              {!requiresClaim ? (
                <>
                  <div>
                    <span className="mb-2 block text-sm font-semibold text-gray-700">
                      {depositMessages.firstName}
                    </span>
                    <LockedField
                      value={customerDetails.firstName}
                      className="px-3 py-2"
                    />
                  </div>

                  <div>
                    <span className="mb-2 block text-sm font-semibold text-gray-700">
                      {depositMessages.lastName}
                    </span>
                    <LockedField
                      value={customerDetails.lastName}
                      className="px-3 py-2"
                    />
                  </div>

                  <div>
                    <span className="mb-2 block text-sm font-semibold text-gray-700">
                      {depositMessages.email}
                    </span>
                    <LockedField
                      value={customerDetails.email}
                      className="px-3 py-2"
                    />
                  </div>

                  <div>
                    <span className="mb-2 block text-sm font-semibold text-gray-700">
                      {depositMessages.phoneNumber}
                    </span>
                    <LockedField
                      value={customerDetails.phoneNumber}
                      className="px-3 py-2"
                    />
                  </div>
                </>
              ) : null}

              {requiresClaim ? (
                <>
                  <div className="sm:col-span-2 rounded-xl border border-stone-200 bg-stone-50 p-4">
                    {claimError ? (
                      <p className="text-sm text-red-600">{claimError}</p>
                    ) : null}
                    {orderAccessContent ? (
                      <div>{orderAccessContent}</div>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>

            <div className="mt-6 border-t border-stone-200 pt-5">
              <p className="text-sm font-semibold text-gray-900">
                {depositMessages.paymentOptions}
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
                        ? depositMessages.classicBankTransfer
                        : "Stripe"
                    }
                    helper=""
                  />
                ))}
              </div>
            </div>
          </DetailPanel>
        </div>

        <div className="md:sticky md:top-4">
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-500">
              {depositMessages.orderSummary}
            </p>
            <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {customerDetails.orderTitle || depositMessages.customBuildFallback}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {depositMessages.amountDueNow}
                </p>
              </div>

              <div className="mt-4 border-t border-stone-200 pt-4 text-sm text-gray-600">
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span>{depositMessages.netAmount}</span>
                  <span className="font-medium text-gray-900">
                    {formatOrderMoney(
                      depositTaxSummary.netAmount,
                      depositCurrency,
                      locale,
                    )}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span>{depositTaxSummary.taxLabel}</span>
                  <span className="font-medium text-gray-900">
                    {formatOrderMoney(
                      depositTaxSummary.taxAmount,
                      depositCurrency,
                      locale,
                    )}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span>{depositMessages.paymentMethod}</span>
                  <span className="font-medium text-gray-900">
                    {paymentMethod === "classic_transfer"
                      ? depositMessages.classicTransfer
                      : "Stripe"}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-4 border-t border-stone-200 pt-3 text-base font-semibold text-gray-900">
                  <span>{depositMessages.total}</span>
                  <span>{depositAmountLabel}</span>
                </div>
              </div>
            </div>

            <label className="mt-4 flex items-start gap-3 rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={agreementAccepted}
                onChange={(event) => onAgreementChange(event.target.checked)}
                className="mt-0.5"
              />
              <span>
                {depositMessages.depositAgreement.split(
                  depositMessages.orderAgreement,
                )[0]}
                <LocalizedLink
                  to="/privacy-terms"
                  className="font-medium text-gray-900 underline underline-offset-2"
                >
                  {depositMessages.orderAgreement}
                </LocalizedLink>
                {depositMessages.depositAgreement.split(
                  depositMessages.orderAgreement,
                )[1] ?? ""}
              </span>
            </label>

            <button
              type="button"
              onClick={handlePayDeposit}
              disabled={!agreementAccepted || isProcessingPayment}
              className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-[var(--kanna-ink)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {isProcessingPayment
                ? depositMessages.preparingPayment
                : depositMessages.payDeposit}
            </button>
          </div>
        </div>
      </div>
    </AnimatedOrderSection>
  );
}
