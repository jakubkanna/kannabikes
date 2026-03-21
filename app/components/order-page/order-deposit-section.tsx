import type { OrderStage } from "~/lib/mock-order";

export function OrderDepositSection({
  agreementAccepted,
  currentStage,
  isDepositConfirmed,
  isProcessingPayment,
  onAgreementChange,
  onPayDeposit,
}: {
  agreementAccepted: boolean;
  currentStage: OrderStage;
  isDepositConfirmed: boolean;
  isProcessingPayment: boolean;
  onAgreementChange: (value: boolean) => void;
  onPayDeposit: () => void;
}) {
  const depositPaid = currentStage !== "waiting_for_deposit";

  if (depositPaid) {
    const isDepositStillUnderReview = !isDepositConfirmed;

    return (
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm md:max-h-[80vh] md:overflow-y-auto md:p-6">
        <div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Deposit
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              {isDepositStillUnderReview ? "In review" : "Confirmed"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
              {isDepositStillUnderReview
                ? "We are reviewing your deposit and confirming that the payment has been received correctly. In the meantime, you can add the measurements required for the design process below."
                : "Your deposit has been confirmed. The order is secured and will continue through the remaining build stages."}
            </p>
          </div>
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
