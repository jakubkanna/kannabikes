import type { MeasurementsSectionProps } from "./types";
import { OrderSubmittedSummarySection } from "./order-submitted-summary-section";

export function OrderMeasurementsSection({
  activeMeasurement,
  bodyType,
  bodyWeight,
  expandedGuidelineKey,
  isSubmitting,
  isSubmitted,
  measurementArrowsSvgMarkup,
  measurementKeys,
  selectedBodySrc,
  values,
  onActivateMeasurement,
  onDeactivateMeasurement,
  onBodyTypeChange,
  onBodyWeightChange,
  onMeasurementChange,
  onSubmit,
  onToggleGuidelines,
}: MeasurementsSectionProps) {
  const hasBodyWeight = bodyWeight.trim().length > 0;
  const hasBodyData = hasBodyWeight && Boolean(bodyType);
  const completedMeasurementCount = measurementKeys.findIndex(
    (key) => values[key]?.trim().length === 0,
  );
  const visibleMeasurementCount =
    completedMeasurementCount === -1 ? measurementKeys.length : completedMeasurementCount + 1;
  const visibleMeasurementKeys = hasBodyData
    ? measurementKeys.slice(0, visibleMeasurementCount)
    : [];
  const allMeasurementsComplete =
    measurementKeys.length > 0 &&
    measurementKeys.every((key) => values[key]?.trim().length > 0);
  const completedSteps =
    Number(hasBodyWeight) +
    Number(Boolean(bodyType)) +
    measurementKeys.filter((key) => values[key]?.trim().length > 0).length;
  const totalSteps = 2 + measurementKeys.length;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  if (isSubmitted) {
    return (
      <OrderSubmittedSummarySection
        collapsible
        defaultExpanded={false}
        title="Measurements"
        description="Your body measurements have been submitted and recorded for the design process."
        imageAlt="Body drawing"
        imageContent={
          <>
            <div className="measurement-base-svg">
              <img src={selectedBodySrc} alt="" aria-hidden="true" />
            </div>
            <div
              className="measurement-svg measurement-svg-overlay"
              data-active={activeMeasurement ?? undefined}
              dangerouslySetInnerHTML={{ __html: measurementArrowsSvgMarkup }}
            />
          </>
        }
      >
        <div className="pt-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Body Data
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Body weight (kg)
              </span>
              <p className="text-sm text-slate-900">
                {bodyWeight ? `${bodyWeight} kg` : "-"}
              </p>
            </div>
            <div>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Body type
              </span>
              <p className="text-sm text-slate-900">
                {bodyType === "female" ? "Female" : "Male"}
              </p>
            </div>
          </div>
        </div>

        <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Measurements
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
          {measurementKeys.map((key) => (
            <div
              key={key}
              onMouseEnter={() => onActivateMeasurement(key)}
              onMouseLeave={onDeactivateMeasurement}
            >
              <span className="mb-2 block text-sm font-semibold text-slate-700">{key}</span>
              <p className="text-sm text-slate-900">
                {values[key] ? `${values[key]} cm` : "-"}
              </p>
            </div>
          ))}
        </div>
      </OrderSubmittedSummarySection>
    );
  }

  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex md:flex-col md:overflow-hidden md:p-6 ${
        "md:h-[80vh]"
      }`}
    >
      <div className="mb-5 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Measurements
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">
          {isSubmitted ? "Received" : "Submit your body data"}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          {isSubmitted
            ? "Your body measurements have been submitted and recorded for the design process."
            : "During this stage we collect the body measurements required to review the order and prepare the next design step."}
        </p>
      </div>

      <div
        className={`grid gap-6 md:min-h-0 md:flex-1 md:items-stretch ${
          isSubmitted ? "md:grid-cols-2" : "md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
        }`}
      >
        <div
          className={`min-h-0 overflow-hidden flex flex-col rounded-lg border border-slate-200 bg-slate-100 p-4 ${
            isSubmitted ? "min-h-[28vh] md:h-full" : "min-h-[44vh] md:h-full"
          }`}
        >
          <div className="measurement-svg-wrap min-h-0 flex-1">
            <div
              className="measurement-svg-stack"
              aria-label={
                activeMeasurement
                  ? `Body drawing with measurement ${activeMeasurement} active`
                  : "Body drawing"
              }
            >
              <div className="measurement-base-svg">
                <img src={selectedBodySrc} alt="" aria-hidden="true" />
              </div>
              <div
                className="measurement-svg measurement-svg-overlay"
                data-active={activeMeasurement ?? undefined}
                dangerouslySetInnerHTML={{ __html: measurementArrowsSvgMarkup }}
              />
            </div>
          </div>
        </div>

        <aside className="min-h-0 rounded-lg border border-slate-200 bg-slate-50 px-3 pb-3 pt-0 md:flex md:h-full md:flex-col md:px-4 md:pb-4 md:pt-0">
          <div className="min-h-0 md:flex-1 md:overflow-y-auto">
            <div className={isSubmitted ? "pt-3" : "pt-4"}>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Body Data
              </h3>

              {isSubmitted ? (
                <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Body weight (kg)
                    </span>
                    <p className="text-sm text-slate-900">
                      {bodyWeight ? `${bodyWeight} kg` : "-"}
                    </p>
                  </div>
                  <div>
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Body type
                    </span>
                    <p className="text-sm text-slate-900">
                      {bodyType === "female" ? "Female" : "Male"}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <label className="mt-3 block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Body weight (kg)
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Enter body weight in kg"
                      value={bodyWeight}
                      onChange={(event) => onBodyWeightChange(event.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                    />
                  </label>

                  {hasBodyWeight ? (
                    <fieldset className="mt-4">
                      <legend className="mb-2 text-sm font-semibold text-slate-700">
                        Body type
                      </legend>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800">
                          <input
                            type="radio"
                            name="bodyType"
                            value="male"
                            checked={bodyType === "male"}
                            onChange={() => onBodyTypeChange("male")}
                          />
                          <span>Male</span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800">
                          <input
                            type="radio"
                            name="bodyType"
                            value="female"
                            checked={bodyType === "female"}
                            onChange={() => onBodyTypeChange("female")}
                          />
                          <span>Female</span>
                        </label>
                      </div>
                    </fieldset>
                  ) : null}
                </>
              )}
            </div>

            {hasBodyData ? (
              <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Measurements
              </h3>
            ) : null}
            <div className="mt-4 space-y-4 pb-4">
              {visibleMeasurementKeys.map((key) => {
                const isActive = activeMeasurement === key;
                const isGuidelineExpanded = expandedGuidelineKey === key;

                return (
                  <label
                    key={key}
                    className="block rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      {key} (cm)
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder={`Enter measurement ${key} in cm`}
                      value={values[key] ?? ""}
                      onFocus={() => onActivateMeasurement(key)}
                      onClick={() => onActivateMeasurement(key)}
                      onChange={(event) => onMeasurementChange(key, event.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                    />
                    {isActive ? (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => onToggleGuidelines(key)}
                          className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600"
                          aria-expanded={isGuidelineExpanded}
                          aria-controls={`guidelines-${key}`}
                        >
                          <span>How to measure</span>
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 20 20"
                            className={`h-4 w-4 transition-transform duration-200 ${
                              isGuidelineExpanded ? "rotate-180" : "rotate-0"
                            }`}
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
                        </button>
                        {isGuidelineExpanded ? (
                          <div
                            id={`guidelines-${key}`}
                            className="mt-2 flex aspect-video items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-black/90 px-4 text-center text-sm text-slate-300"
                          >
                            Add a guideline video or image for {key}.
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </label>
                );
              })}
            </div>
          </div>

          {!isSubmitted ? (
            <div className="shrink-0 border-t border-slate-200 bg-slate-50 pt-4">
              {hasBodyData && allMeasurementsComplete ? (
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isSubmitting ? "Submitting measurements..." : "Submit body data"}
                </button>
              ) : (
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-slate-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
