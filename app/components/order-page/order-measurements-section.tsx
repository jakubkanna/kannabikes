import type { MeasurementsSectionProps } from "./types";

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
  onBodyTypeChange,
  onBodyWeightChange,
  onMeasurementChange,
  onSubmit,
  onToggleGuidelines,
}: MeasurementsSectionProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex md:max-h-[80vh] md:flex-col md:overflow-hidden md:p-6">
      <div className="mb-5 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Measurements
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">
          Submit your body data
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          During this stage we collect the body measurements required to review the order
          and prepare the next design step.
        </p>
      </div>

      <div className="grid gap-6 md:min-h-0 md:flex-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:items-stretch">
        <div className="flex min-h-[44vh] flex-col rounded-lg border border-slate-200 bg-slate-100 p-4 md:h-full">
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

        <aside className="rounded-lg border border-slate-200 bg-slate-50 p-3 md:h-full md:overflow-y-auto md:p-4">
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
              Body Data
            </h3>

            <label className="mt-3 block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Body weight
              </span>
              {isSubmitted ? (
                <p className="text-sm text-slate-900">{bodyWeight || "-"}</p>
              ) : (
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Enter body weight"
                  value={bodyWeight}
                  onChange={(event) => onBodyWeightChange(event.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                />
              )}
            </label>

            <fieldset className="mt-4">
              <legend className="mb-2 text-sm font-semibold text-slate-700">Body type</legend>
              {isSubmitted ? (
                <p className="text-sm text-slate-900">
                  {bodyType === "female" ? "Female" : "Male"}
                </p>
              ) : (
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
              )}
            </fieldset>
          </div>

          <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Measurements
          </h3>

          <div className="mt-4 space-y-4">
            {measurementKeys.map((key) => {
              const isActive = activeMeasurement === key;
              const isGuidelineExpanded = expandedGuidelineKey === key;

              return (
                <label
                  key={key}
                  className="block rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    {key}
                  </span>
                  {isSubmitted ? (
                    <p className="text-sm text-slate-900">{values[key] || "-"}</p>
                  ) : (
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder={`Enter measurement ${key}`}
                      value={values[key] ?? ""}
                      onFocus={() => onActivateMeasurement(key)}
                      onClick={() => onActivateMeasurement(key)}
                      onChange={(event) => onMeasurementChange(key, event.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                    />
                  )}
                  {isActive ? (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => onToggleGuidelines(key)}
                        className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600"
                        aria-expanded={isGuidelineExpanded}
                        aria-controls={`guidelines-${key}`}
                      >
                        <span>Guidelines</span>
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

          {!isSubmitted ? (
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? "Submitting measurements..." : "Submit body data"}
            </button>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
