import { useEffect, useState, type ReactNode } from "react";
import { SectionPill } from "~/components/section-pill";
import { AnimatedOrderSection } from "./order-motion";

const SUBMITTED_SUCCESS_HIGHLIGHT_DELAY_MS = 4000;

export function OrderSubmittedSummarySection({
  collapsible = false,
  defaultExpanded = true,
  children,
  description,
  heading = "Received",
  imageAlt,
  imageContent,
  title,
}: {
  collapsible?: boolean;
  defaultExpanded?: boolean;
  children: ReactNode;
  description: string;
  heading?: string;
  imageAlt: string;
  imageContent: ReactNode;
  title: string;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [hasSuccessHighlight, setHasSuccessHighlight] = useState(true);

  useEffect(() => {
    setHasSuccessHighlight(true);
    const timeoutId = window.setTimeout(() => {
      setHasSuccessHighlight(false);
    }, SUBMITTED_SUCCESS_HIGHLIGHT_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <AnimatedOrderSection
      className={`rounded-xl p-4 shadow-sm md:flex md:max-h-[60vh] md:flex-col md:overflow-hidden md:p-6 ${
        hasSuccessHighlight
          ? "border border-emerald-200 bg-emerald-50"
          : "border border-stone-200 bg-white"
      }`}
    >
      {collapsible ? (
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex w-full items-start justify-between gap-4 text-left"
          aria-expanded={isExpanded}
        >
          <div>
            <SectionPill tone={hasSuccessHighlight ? "success" : "light"}>
              {title}
            </SectionPill>
            <h2 className="mt-2 text-xl font-semibold text-gray-900">
              {heading}
            </h2>
            <p
              className={`mt-2 max-w-2xl text-sm leading-6 ${
                hasSuccessHighlight ? "text-gray-700" : "text-gray-600"
              }`}
            >
              {description}
            </p>
          </div>
          <span
            className={`shrink-0 self-center transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="block h-[22px] w-[22px]"
              style={{ color: hasSuccessHighlight ? "#047857" : "#64748b" }}
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
      ) : (
        <div className="mb-5 shrink-0">
          <SectionPill tone={hasSuccessHighlight ? "success" : "light"}>
            {title}
          </SectionPill>
          <h2 className="mt-2 text-xl font-semibold text-gray-900">
            {heading}
          </h2>
          <p
            className={`mt-2 max-w-2xl text-sm leading-6 ${
              hasSuccessHighlight ? "text-gray-700" : "text-gray-600"
            }`}
          >
            {description}
          </p>
        </div>
      )}

      {!collapsible || isExpanded ? (
        <div
          className={`${collapsible ? "mt-5" : ""} grid gap-6 md:min-h-0 md:flex-1 md:grid-cols-2 md:items-stretch`}
        >
          <div
            className={`min-h-0 overflow-hidden rounded-lg p-4 ${
              hasSuccessHighlight
                ? "border border-emerald-200 bg-emerald-100/60"
                : "border border-stone-200 bg-stone-100"
            }`}
          >
            <div className="measurement-svg-wrap h-full min-h-0">
              <div className="measurement-svg-stack" aria-label={imageAlt}>
                {imageContent}
              </div>
            </div>
          </div>

          <aside
            className={`min-h-0 rounded-lg p-3 md:h-full md:overflow-y-auto md:p-4 ${
              hasSuccessHighlight
                ? "border border-emerald-200 bg-emerald-50/70"
                : "border border-stone-200 bg-stone-50"
            }`}
          >
            {children}
          </aside>
        </div>
      ) : null}
    </AnimatedOrderSection>
  );
}
