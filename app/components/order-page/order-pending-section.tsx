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
    <section className="rounded-xl border border-dashed border-slate-300 bg-slate-100/70 p-6 shadow-sm">
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
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
    </section>
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
