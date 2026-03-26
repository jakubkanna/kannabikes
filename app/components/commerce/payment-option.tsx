import type { ReactNode } from "react";

export function PaymentOption({
  helper = "",
  icon,
  isSelected,
  onSelect,
  title,
}: {
  helper?: string;
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
          : "border-stone-200 bg-white text-gray-900 hover:border-stone-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`shrink-0 ${
              isSelected ? "text-white" : "text-gray-500"
            }`}
            aria-hidden="true"
          >
            {icon}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{title}</p>
            <p
              className={`mt-1 text-xs ${
                isSelected ? "text-gray-300" : "text-gray-500"
              }`}
            >
              {helper}
            </p>
          </div>
        </div>
        <span
          className={`mt-0.5 h-4 w-4 rounded-full border ${
            isSelected
              ? "border-white bg-white ring-4 ring-gray-700"
              : "border-stone-300 bg-white"
          }`}
          aria-hidden="true"
        />
      </div>
    </button>
  );
}

export function StripeCardIcon() {
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

export function BankTransferIcon() {
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
