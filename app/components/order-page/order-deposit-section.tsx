import { useEffect, useState } from "react";
import type { OrderStage } from "~/lib/mock-order";

const DEPOSIT_SUCCESS_HIGHLIGHT_DELAY_MS = 4000;

export function OrderDepositSection({
  agreementAccepted,
  currentStage,
  depositPayment,
  isDepositConfirmed,
  isProcessingPayment,
  onAgreementChange,
  onPayDeposit,
}: {
  agreementAccepted: boolean;
  currentStage: OrderStage;
  depositPayment: { amount: string; paidAt: string } | null;
  isDepositConfirmed: boolean;
  isProcessingPayment: boolean;
  onAgreementChange: (value: boolean) => void;
  onPayDeposit: () => void;
}) {
  const depositPaid = currentStage !== "waiting_for_deposit";
  const [hasSuccessHighlight, setHasSuccessHighlight] = useState(false);

  useEffect(() => {
    if (!isDepositConfirmed || !depositPayment) {
      setHasSuccessHighlight(false);
      return;
    }

    const paidAt = new Date(depositPayment.paidAt).getTime();
    const elapsed = Date.now() - paidAt;

    if (elapsed >= DEPOSIT_SUCCESS_HIGHLIGHT_DELAY_MS) {
      setHasSuccessHighlight(true);
      return;
    }

    setHasSuccessHighlight(false);
    const timeoutId = window.setTimeout(() => {
      setHasSuccessHighlight(true);
    }, DEPOSIT_SUCCESS_HIGHLIGHT_DELAY_MS - elapsed);

    return () => window.clearTimeout(timeoutId);
  }, [depositPayment, isDepositConfirmed]);

  if (depositPaid) {
    const isDepositStillUnderReview = !isDepositConfirmed;
    const useSuccessColors = !isDepositStillUnderReview && hasSuccessHighlight;

    return (
      <section
        className={`rounded-xl p-4 shadow-sm md:max-h-[80vh] md:overflow-y-auto md:p-6 ${
          useSuccessColors
            ? "border border-emerald-200 bg-emerald-50"
            : "border border-slate-200 bg-white"
        }`}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p
              className={`text-xs font-semibold uppercase tracking-[0.14em] ${
                useSuccessColors ? "text-emerald-700" : "text-slate-500"
              }`}
            >
              Deposit
            </p>
            <div className="mt-1">
              <h2 className="text-xl font-semibold text-slate-900">
                {isDepositStillUnderReview ? "In review" : "Received"}
              </h2>
            </div>
            <p
              className={`mt-2 max-w-3xl text-sm leading-6 ${
                useSuccessColors ? "text-slate-700" : "text-slate-600"
              }`}
            >
              {isDepositStillUnderReview
                ? "We are reviewing your deposit and confirming that the payment has been received correctly. In the meantime, you can add the measurements required for the design process below."
                : "Your deposit has been confirmed. The order is secured and will continue through the remaining build stages."}
            </p>
          </div>
          {!isDepositStillUnderReview && depositPayment ? (
            <div className="shrink-0 text-sm md:text-right">
              <span className="block text-slate-700">
                {new Intl.DateTimeFormat("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }).format(new Date(depositPayment.paidAt))}
              </span>
              <span className="mt-1 block font-semibold text-slate-900">
                {depositPayment.amount}
              </span>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm md:max-h-[80vh] md:overflow-y-auto md:p-6">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
            Deposit required
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">
            Waiting for deposit
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
            We are waiting for the order deposit before review starts. This payment flow
            is mocked for UI work only and does not process real transactions.
          </p>
          <div className="mt-4 rounded-lg border border-amber-200 bg-white/80 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Included in this mock step</p>
            <p className="mt-2">Deposit amount: 500 EUR</p>
            <p className="mt-1">Accepted methods: card, bank transfer, PayPal</p>
            <p className="mt-1">After payment the order moves to review automatically.</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">Payment options</p>
          <div className="mt-4 grid gap-2">
            <PaymentOption title="Credit or debit card" helper="Instant confirmation in the mock flow" />
            <PaymentOption title="Bank transfer" helper="Displayed as available but not connected yet" />
            <PaymentOption title="PayPal" helper="Displayed as available but not connected yet" />
          </div>

          <label className="mt-5 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={agreementAccepted}
              onChange={(event) => onAgreementChange(event.target.checked)}
              className="mt-0.5"
            />
            <span>
              I accept the order agreement, deposit terms, and processing of my order data
              for this bike build.
            </span>
          </label>

          <button
            type="button"
            onClick={onPayDeposit}
            disabled={!agreementAccepted || isProcessingPayment}
            className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isProcessingPayment ? "Processing mock payment..." : "Mark deposit as paid"}
          </button>
        </div>
      </div>
    </section>
  );
}

function PaymentOption({ helper, title }: { helper: string; title: string }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-3">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </div>
  );
}
