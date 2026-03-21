import type { ReactNode } from "react";

export function OrderSubmittedSummarySection({
  children,
  description,
  heading = "Received",
  imageAlt,
  imageContent,
  title,
}: {
  children: ReactNode;
  description: string;
  heading?: string;
  imageAlt: string;
  imageContent: ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex md:max-h-[60vh] md:flex-col md:overflow-hidden md:p-6">
      <div className="mb-5 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          {title}
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">{heading}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      </div>

      <div className="grid gap-6 md:min-h-0 md:flex-1 md:grid-cols-2 md:items-stretch">
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
    </section>
  );
}
