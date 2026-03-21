import { useState, type ReactNode } from "react";

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

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex md:max-h-[60vh] md:flex-col md:overflow-hidden md:p-6">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex w-full items-start justify-between gap-4 text-left"
          aria-expanded={isExpanded}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {title}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">{heading}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
          </div>
          <span
            className={`mt-1 text-lg leading-none text-slate-500 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          >
            ˅
          </span>
        </button>
      ) : (
        <div className="mb-5 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            {title}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">{heading}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
        </div>
      )}

      {(!collapsible || isExpanded) ? (
        <div className={`${collapsible ? "mt-5" : ""} grid gap-6 md:min-h-0 md:flex-1 md:grid-cols-2 md:items-stretch`}>
          <div className="min-h-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 p-4">
            <div className="measurement-svg-wrap h-full min-h-0">
              <div className="measurement-svg-stack" aria-label={imageAlt}>
                {imageContent}
              </div>
            </div>
          </div>

          <aside className="min-h-0 rounded-lg border border-slate-200 bg-slate-50 p-3 md:h-full md:overflow-y-auto md:p-4">
            {children}
          </aside>
        </div>
      ) : null}
    </section>
  );
}
