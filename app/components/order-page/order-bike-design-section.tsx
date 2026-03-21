import { ORDER_STAGE_DEFINITIONS } from "~/lib/mock-order";
import { OrderSubmittedSummarySection } from "./order-submitted-summary-section";
import type { BikeDesignSectionProps } from "./types";

const BIKE_COMPONENT_SECTIONS = [
  {
    title: "Frameset",
    fields: ["Frame", "Fork", "Headset", "Cockpit"],
  },
  {
    title: "Front wheel",
    fields: ["Front rim", "Front hub", "Front tire"],
  },
  {
    title: "Back wheel",
    fields: ["Rear rim", "Rear hub", "Rear tire"],
  },
  {
    title: "Drivetrain",
    fields: [
      "Crankset",
      "Chainring",
      "Cassette",
      "Rear derailleur",
      "Chain",
      "Shifters",
    ],
  },
  {
    title: "Brakes",
    fields: ["Front brake", "Rear brake", "Rotors"],
  },
  {
    title: "Other",
    fields: ["Saddle", "Seatpost", "Pedals", "Accessories"],
  },
] as const;

const DESIGNER_LED_SAMPLE_SPECIFICATION: Record<string, string> = {
  "Frameset:Frame": "Custom steel frame, designer recommendation",
  "Frameset:Fork": "Matched carbon fork",
  "Frameset:Headset": "Integrated headset",
  "Frameset:Cockpit": "Compact gravel cockpit",
  "Front wheel:Front rim": "Light alloy gravel rim",
  "Front wheel:Front hub": "Sealed bearing front hub",
  "Front wheel:Front tire": "700x40c all-road tire",
  "Back wheel:Rear rim": "Light alloy gravel rim",
  "Back wheel:Rear hub": "Sealed bearing rear hub",
  "Back wheel:Rear tire": "700x40c all-road tire",
  "Drivetrain:Crankset": "1x gravel crankset",
  "Drivetrain:Chainring": "40T narrow-wide chainring",
  "Drivetrain:Cassette": "10-44 cassette",
  "Drivetrain:Rear derailleur": "Clutch rear derailleur",
  "Drivetrain:Chain": "11-speed chain",
  "Drivetrain:Shifters": "Hydraulic integrated shifters",
  "Brakes:Front brake": "Hydraulic disc brake",
  "Brakes:Rear brake": "Hydraulic disc brake",
  "Brakes:Rotors": "160 mm rotors",
  "Other:Saddle": "Endurance saddle",
  "Other:Seatpost": "Setback seatpost",
  "Other:Pedals": "Flat test pedals",
  "Other:Accessories": "Tubeless setup, bottle cages",
};

const DESIGNER_LED_BUDGET_KEY = "Designer:Budget";
const RIDING_FIELDS = [
  {
    title: "Riding style",
    key: "Riding:Style",
    options: ["easy", "aggressive", "mixed"],
  },
  {
    title: "Riding destinations",
    key: "Riding:Destinations",
    options: ["mountains", "flat terrain", "city"],
  },
  {
    title: "Range",
    key: "Riding:Range",
    options: ["short", "mid", "long"],
  },
  {
    title: "Preferred bike type",
    key: "Riding:BikeType",
    options: ["mtb", "gravel", "road", "track", "mixed", "other"],
  },
] as const;
const RIDING_NOTES_KEY = "Riding:AdditionalNotes";
const PAINTJOB_ROUTE_KEY = "Paintjob:Route";
const PAINTJOB_COLORS_KEY = "Paintjob:FavoriteColors";
const PAINTJOB_CUSTOM_COLOR_KEY = "Paintjob:CustomColor";
const PAINTJOB_STYLE_KEY = "Paintjob:Style";
const PAINTJOB_NOTES_KEY = "Paintjob:AdditionalNotes";
const PAINTJOB_IMAGE_KEY = "Paintjob:Attachment";
const PAINTJOB_ROUTE_OPTIONS = [
  "I want to rely fully on the artist",
  "I have a design in mind",
] as const;
const PAINTJOB_STYLE_OPTIONS = [
  "raw material",
  "coating",
  "graphics",
  "gradients",
  "other",
] as const;
const PAINTJOB_COLOR_OPTIONS = [
  { label: "Black", value: "black", swatchClassName: "bg-black" },
  {
    label: "White",
    value: "white",
    swatchClassName: "bg-white border border-slate-300",
  },
  { label: "Red", value: "red", swatchClassName: "bg-red-500" },
  { label: "Blue", value: "blue", swatchClassName: "bg-blue-500" },
  { label: "Green", value: "green", swatchClassName: "bg-green-500" },
  { label: "Yellow", value: "yellow", swatchClassName: "bg-yellow-400" },
  { label: "Orange", value: "orange", swatchClassName: "bg-orange-500" },
  { label: "Purple", value: "purple", swatchClassName: "bg-violet-500" },
  { label: "Pink", value: "pink", swatchClassName: "bg-pink-500" },
  { label: "Silver", value: "silver", swatchClassName: "bg-slate-300" },
  {
    label: "Other",
    value: "other",
    swatchClassName:
      "bg-[linear-gradient(135deg,#ef4444,#f59e0b,#10b981,#3b82f6,#8b5cf6)]",
  },
] as const;

function getSelectedValues(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function toggleSelectedValue(value: string | undefined, nextValue: string) {
  const selectedValues = new Set(getSelectedValues(value));

  if (selectedValues.has(nextValue)) {
    selectedValues.delete(nextValue);
  } else {
    selectedValues.add(nextValue);
  }

  return Array.from(selectedValues).join(",");
}

export function OrderBikeDesignSection({
  isApproving,
  bikeDrawingSrc,
  currentStage,
  isSubmitting,
  isSubmitted,
  specificationMode,
  onApprove,
  values,
  onModeChange,
  onSubmit,
  onValueChange,
}: BikeDesignSectionProps) {
  const isWaitingForDesign = currentStage === "waiting_for_design";
  const isWaitingForApproval = currentStage === "waiting_for_design_approval";
  const hasBuildTypeSelected = specificationMode !== null;
  const showSpecificationForm = specificationMode === "self_specified";
  const showGuidedMessage = specificationMode === "guided_by_designer";
  const showFrameOnlyMessage = specificationMode === "frame_only";
  const hasDesignerBudget =
    (values[DESIGNER_LED_BUDGET_KEY] ?? "").trim().length > 0;
  const ridingComplete = RIDING_FIELDS.every(
    (field) => (values[field.key] ?? "").trim().length > 0,
  );
  const paintjobRoute = values[PAINTJOB_ROUTE_KEY] ?? "";
  const hasCustomPaintDirection = paintjobRoute === "I have a design in mind";
  const selectedPaintColors = getSelectedValues(values[PAINTJOB_COLORS_KEY]);
  const hasOtherPaintColor = selectedPaintColors.includes("other");
  const customPaintColor = values[PAINTJOB_CUSTOM_COLOR_KEY] ?? "";
  const selectedPaintStyles = getSelectedValues(values[PAINTJOB_STYLE_KEY]);
  const paintjobComplete =
    paintjobRoute.length > 0 &&
    (!hasCustomPaintDirection ||
      (selectedPaintColors.length > 0 &&
        selectedPaintStyles.length > 0 &&
        (!hasOtherPaintColor || customPaintColor.length > 0)));
  const specificationFields = BIKE_COMPONENT_SECTIONS.flatMap((section) =>
    section.fields.map((field) => `${section.title}:${field}`),
  );
  const completedFields = specificationFields.filter(
    (fieldKey) => values[fieldKey]?.trim().length > 0,
  ).length;
  const totalFields = specificationFields.length;
  const allFieldsComplete = totalFields > 0 && completedFields === totalFields;
  const nextSpecificationFieldIndex = specificationFields.findIndex(
    (fieldKey) => (values[fieldKey] ?? "").trim().length === 0,
  );
  const visibleSpecificationFieldCount =
    nextSpecificationFieldIndex === -1
      ? totalFields
      : nextSpecificationFieldIndex + 1;
  const visibleSpecificationFieldKeys = new Set(
    specificationFields.slice(0, visibleSpecificationFieldCount),
  );
  const progressPercent = Math.round((completedFields / totalFields) * 100);
  const renderRidingSection = () => (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
        Riding
      </h3>
      <div className="mt-4 space-y-5">
        {RIDING_FIELDS.map((field) => (
          <div key={field.key}>
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              {field.title}
            </span>
            <div className="flex flex-wrap gap-2">
              {field.options.map((option) => {
                const isSelected = values[field.key] === option;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onValueChange(field.key, option)}
                    className={`rounded-full border px-3 py-2 text-sm capitalize transition ${
                      isSelected
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            Additional notes
          </span>
          <textarea
            value={values[RIDING_NOTES_KEY] ?? ""}
            onChange={(event) =>
              onValueChange(RIDING_NOTES_KEY, event.target.value)
            }
            placeholder="Add any additional riding notes"
            rows={4}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
          />
        </label>
      </div>
    </div>
  );
  const renderRidingSummary = () => (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
        Riding
      </h3>
      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {RIDING_FIELDS.map((field) => (
          <div key={field.key}>
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              {field.title}
            </span>
            <p className="text-sm capitalize text-slate-900">
              {values[field.key] || "-"}
            </p>
          </div>
        ))}
        <div className="sm:col-span-2">
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            Additional notes
          </span>
          <p className="text-sm text-slate-900">
            {values[RIDING_NOTES_KEY] || "-"}
          </p>
        </div>
      </div>
    </div>
  );
  const renderPaintjobSection = () => (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
        Paintjob
      </h3>
      <div className="mt-4 space-y-5">
        <div>
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            Variant
          </span>
          <div className="grid gap-3">
            {PAINTJOB_ROUTE_OPTIONS.map((option) => {
              const isSelected = paintjobRoute === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onValueChange(PAINTJOB_ROUTE_KEY, option)}
                  className={`rounded-lg border px-4 py-3 text-left transition ${
                    isSelected
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-900 hover:border-slate-300"
                  }`}
                >
                  <span className="text-sm font-semibold">{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        {hasCustomPaintDirection ? (
          <>
            <div>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Colors
              </span>
              <div className="flex flex-wrap gap-3">
                {PAINTJOB_COLOR_OPTIONS.map((option) => {
                  const isSelected = selectedPaintColors.includes(option.value);

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        const nextColors = toggleSelectedValue(
                          values[PAINTJOB_COLORS_KEY],
                          option.value,
                        );

                        onValueChange(PAINTJOB_COLORS_KEY, nextColors);

                        if (option.value === "other") {
                          const nextSelectionIncludesOther =
                            getSelectedValues(nextColors).includes("other");

                          onValueChange(
                            PAINTJOB_CUSTOM_COLOR_KEY,
                            nextSelectionIncludesOther
                              ? values[PAINTJOB_CUSTOM_COLOR_KEY] || "#000000"
                              : "",
                          );
                        }
                      }}
                      className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                        isSelected
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                      }`}
                    >
                      <span
                        className={`h-4 w-4 rounded-full ${option.swatchClassName}`}
                      />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {hasOtherPaintColor ? (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Other color
                </span>
                <input
                  type="color"
                  value={customPaintColor || "#000000"}
                  onChange={(event) =>
                    onValueChange(PAINTJOB_CUSTOM_COLOR_KEY, event.target.value)
                  }
                  className="h-11 w-full rounded-md border border-slate-300 bg-white p-1"
                />
              </label>
            ) : null}

            <div>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Style
              </span>
              <div className="flex flex-wrap gap-2">
                {PAINTJOB_STYLE_OPTIONS.map((option) => {
                  const isSelected = selectedPaintStyles.includes(option);

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() =>
                        onValueChange(
                          PAINTJOB_STYLE_KEY,
                          toggleSelectedValue(
                            values[PAINTJOB_STYLE_KEY],
                            option,
                          ),
                        )
                      }
                      className={`rounded-full border px-3 py-2 text-sm capitalize transition ${
                        isSelected
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Additional notes
              </span>
              <textarea
                value={values[PAINTJOB_NOTES_KEY] ?? ""}
                onChange={(event) =>
                  onValueChange(PAINTJOB_NOTES_KEY, event.target.value)
                }
                placeholder="Give some tips to the artist"
                rows={4}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Attach image
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  onValueChange(
                    PAINTJOB_IMAGE_KEY,
                    event.target.files?.[0]?.name ?? "",
                  )
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
              {values[PAINTJOB_IMAGE_KEY] ? (
                <p className="mt-2 text-sm text-slate-600">
                  {values[PAINTJOB_IMAGE_KEY]}
                </p>
              ) : null}
            </label>
          </>
        ) : null}
      </div>
    </div>
  );
  const renderPaintjobSummary = () => (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
        Paintjob
      </h3>
      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            Variant
          </span>
          <p className="text-sm text-slate-900">{paintjobRoute || "-"}</p>
        </div>
        {hasCustomPaintDirection ? (
          <>
            <div className="sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Colors
              </span>
              <p className="text-sm capitalize text-slate-900">
                {selectedPaintColors.length > 0
                  ? selectedPaintColors
                      .map((color) =>
                        color === "other" && customPaintColor
                          ? `other (${customPaintColor})`
                          : color,
                      )
                      .join(", ")
                  : "-"}
              </p>
            </div>
            <div>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Style
              </span>
              <p className="text-sm capitalize text-slate-900">
                {selectedPaintStyles.length > 0
                  ? selectedPaintStyles.join(", ")
                  : "-"}
              </p>
            </div>
            <div>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Attach image
              </span>
              <p className="text-sm text-slate-900">
                {values[PAINTJOB_IMAGE_KEY] || "-"}
              </p>
            </div>
            <div className="sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Additional notes
              </span>
              <p className="text-sm text-slate-900">
                {values[PAINTJOB_NOTES_KEY] || "-"}
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );

  if (isWaitingForApproval) {
    const resolveFieldValue = (fieldKey: string) =>
      values[fieldKey] ||
      (specificationMode === "guided_by_designer"
        ? DESIGNER_LED_SAMPLE_SPECIFICATION[fieldKey]
        : "");

    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex md:max-h-[80vh] md:flex-col md:overflow-hidden md:p-6">
        <div className="mb-5 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Bike design
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">
            Design waiting for approval
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Review the proposed bike setup below. Once approved, the order can
            move into production.
          </p>
        </div>

        <div className="grid gap-6 md:min-h-0 md:flex-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:items-stretch">
          <div className="relative flex min-h-[44vh] items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 p-4">
            <img
              src={bikeDrawingSrc}
              alt="Bike drawing"
              className="h-auto max-h-[520px] w-full object-contain"
            />
          </div>

          <aside className="rounded-lg border border-slate-200 bg-slate-50 p-3 md:flex md:h-full md:flex-col md:p-4">
            <div className="space-y-4 pb-2 md:min-h-0 md:flex-1 md:overflow-y-auto">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Message from designer
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  The geometry and component direction are prepared based on
                  your submitted measurements and project goals. Please review
                  the setup below and approve it if everything looks right.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Build type
                </h3>
                <p className="mt-3 text-sm text-slate-900">
                  {specificationMode === "guided_by_designer"
                    ? "Designer-led specification"
                    : specificationMode === "frame_only"
                      ? "Frame only"
                      : "Self-defined specification"}
                </p>
              </div>

              {renderRidingSummary()}
              {renderPaintjobSummary()}

              {specificationMode === "guided_by_designer" ? (
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Budget
                  </h3>
                  <p className="mt-3 text-sm text-slate-900">
                    {values[DESIGNER_LED_BUDGET_KEY] || "-"}
                  </p>
                </div>
              ) : null}

              {BIKE_COMPONENT_SECTIONS.map((section) => (
                <div
                  key={section.title}
                  className="rounded-lg border border-slate-200 bg-white p-4"
                >
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {section.title}
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                    {section.fields.map((field) => {
                      const fieldKey = `${section.title}:${field}`;

                      return (
                        <div key={fieldKey}>
                          <span className="mb-2 block text-sm font-semibold text-slate-700">
                            {field}
                          </span>
                          <p className="text-sm text-slate-900">
                            {resolveFieldValue(fieldKey) || "-"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="shrink-0 border-t border-slate-200 bg-slate-50 pt-4">
              <button
                type="button"
                onClick={onApprove}
                disabled={isApproving}
                className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isApproving ? "Approving design..." : "Approve design"}
              </button>
            </div>
          </aside>
        </div>
      </section>
    );
  }

  if (isSubmitted) {
    return (
      <OrderSubmittedSummarySection
        title="Bike design"
        heading="Specification received"
        description="Your bike specification has been submitted and recorded for the next design and production steps."
        imageAlt="Bike drawing"
        imageContent={
          <>
            <div className="measurement-base-svg">
              <img
                src={bikeDrawingSrc}
                alt=""
                aria-hidden="true"
                className={isWaitingForDesign ? "blur-md opacity-50" : ""}
              />
            </div>
            {isWaitingForDesign ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/35 p-6">
                <div className="max-w-sm rounded-xl border border-slate-200 bg-white/95 px-5 py-4 text-center shadow-sm backdrop-blur-sm">
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {ORDER_STAGE_DEFINITIONS[currentStage].label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    We are working on your custom bicycle. Once it's ready you
                    will be asked for approval.
                  </p>
                </div>
              </div>
            ) : null}
          </>
        }
      >
        <div className="pt-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Build type
          </h3>
          <p className="mt-3 text-sm text-slate-900">
            {specificationMode === "guided_by_designer"
              ? "Designer-led specification"
              : specificationMode === "frame_only"
                ? "Frame only"
                : "Self-defined specification"}
          </p>
        </div>

        <div className="mt-5">{renderRidingSummary()}</div>
        <div className="mt-5">{renderPaintjobSummary()}</div>

        {specificationMode === "guided_by_designer" ? (
          <>
            <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Budget
            </h3>
            <p className="mt-3 text-sm text-slate-900">
              {values[DESIGNER_LED_BUDGET_KEY] || "-"}
            </p>

            <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Notes
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The designer will prepare the specification based on your
              measurements, riding goals, and project direction.
            </p>
          </>
        ) : specificationMode === "frame_only" ? (
          <>
            <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Notes
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This order will continue as a frame-only project. The designer
              will prepare the frame direction based on your submitted
              measurements and project goals.
            </p>
          </>
        ) : (
          <>
            {BIKE_COMPONENT_SECTIONS.map((section) => (
              <div key={section.title} className="mt-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {section.title}
                </h3>
                <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  {section.fields.map((field) => {
                    const fieldKey = `${section.title}:${field}`;

                    return (
                      <div key={fieldKey}>
                        <span className="mb-2 block text-sm font-semibold text-slate-700">
                          {field}
                        </span>
                        <p className="text-sm text-slate-900">
                          {values[fieldKey] || "-"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}
      </OrderSubmittedSummarySection>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex md:h-[80vh] md:flex-col md:overflow-hidden md:p-6">
      <div className="mb-5 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Bike design
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">
          Define the bike specification
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          During the design stage we collect the preferred parts and build
          direction for the bike based on initial conversation.
        </p>
      </div>

      <div className="md:min-h-0 md:flex-1">
        <aside className="min-h-0 rounded-lg border border-slate-200 bg-slate-50 px-3 pb-3 pt-0 md:flex md:h-full md:flex-col md:px-4 md:pb-4 md:pt-0">
          <div className="min-h-0 md:flex-1 md:overflow-y-auto">
            <div className="space-y-4 pt-4 pb-4">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                  Build type
                </h3>
                <div className="mt-3 grid gap-3">
                  <button
                    type="button"
                    onClick={() => onModeChange("guided_by_designer")}
                    className={`rounded-lg border px-4 py-3 text-left transition ${
                      specificationMode === "guided_by_designer"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-900 hover:border-slate-300"
                    }`}
                  >
                    <p className="text-sm font-semibold">
                      Let the designer define the specification
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        specificationMode === "guided_by_designer"
                          ? "text-slate-200"
                          : "text-slate-500"
                      }`}
                    >
                      You provide direction and the designer prepares the
                      component specification for you.
                    </p>
                    {showGuidedMessage ? (
                      <label className="mt-4 block">
                        <span className="mb-2 block text-sm font-semibold text-slate-100">
                          Budget
                        </span>
                        <div className="mt-3 flex items-center gap-2">
                          <input
                            type="text"
                            value={values[DESIGNER_LED_BUDGET_KEY] ?? ""}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) =>
                              onValueChange(
                                DESIGNER_LED_BUDGET_KEY,
                                event.target.value,
                              )
                            }
                            placeholder="Budget"
                            className="w-[9ch] rounded-md border border-slate-500 bg-slate-800 px-3 py-2 text-white outline-none transition placeholder:text-slate-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                          />
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onValueChange(DESIGNER_LED_BUDGET_KEY, "No limit");
                            }}
                            className={`rounded-full border px-3 py-2 text-sm transition ${
                              values[DESIGNER_LED_BUDGET_KEY] === "No limit"
                                ? "border-slate-100 bg-slate-100 text-slate-900"
                                : "border-slate-500 bg-slate-800 text-slate-100 hover:border-slate-300"
                            }`}
                          >
                            No limit
                          </button>
                        </div>
                      </label>
                    ) : null}
                  </button>

                  <button
                    type="button"
                    onClick={() => onModeChange("self_specified")}
                    className={`rounded-lg border px-4 py-3 text-left transition ${
                      specificationMode === "self_specified"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-900 hover:border-slate-300"
                    }`}
                  >
                    <p className="text-sm font-semibold">
                      I want to define the specification
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        specificationMode === "self_specified"
                          ? "text-slate-200"
                          : "text-slate-500"
                      }`}
                    >
                      Fill in the preferred parts and component choices
                      yourself.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => onModeChange("frame_only")}
                    className={`rounded-lg border px-4 py-3 text-left transition ${
                      specificationMode === "frame_only"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-900 hover:border-slate-300"
                    }`}
                  >
                    <p className="text-sm font-semibold">Frame only</p>
                    <p
                      className={`mt-1 text-xs ${
                        specificationMode === "frame_only"
                          ? "text-slate-200"
                          : "text-slate-500"
                      }`}
                    >
                      Continue this order as a frame-only project without a full
                      bike component specification.
                    </p>
                  </button>
                </div>
              </div>

              {showSpecificationForm ? (
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Specification
                  </h3>
                  <div className="mt-4 space-y-4">
                    {BIKE_COMPONENT_SECTIONS.map((section) => {
                      const visibleFields = section.fields.filter((field) => {
                        const fieldKey = `${section.title}:${field}`;

                        return visibleSpecificationFieldKeys.has(fieldKey);
                      });

                      if (visibleFields.length === 0) {
                        return null;
                      }

                      return (
                        <div
                          key={section.title}
                          className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                        >
                          <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                            {section.title}
                          </h4>
                          <div className="mt-3 space-y-3">
                            {visibleFields.map((field) => {
                              const fieldKey = `${section.title}:${field}`;

                              return (
                                <label key={fieldKey} className="block">
                                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                                    {field}
                                  </span>
                                  <input
                                    type="text"
                                    value={values[fieldKey] ?? ""}
                                    onChange={(event) =>
                                      onValueChange(
                                        fieldKey,
                                        event.target.value,
                                      )
                                    }
                                    placeholder={`Specify ${field.toLowerCase()}`}
                                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                                  />
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {hasBuildTypeSelected ? renderRidingSection() : null}
              {hasBuildTypeSelected && ridingComplete
                ? renderPaintjobSection()
                : null}
            </div>
          </div>

          {showSpecificationForm ||
          showGuidedMessage ||
          showFrameOnlyMessage ? (
            <div className="shrink-0 border-t border-slate-200 bg-slate-50 pt-4">
              {showGuidedMessage ? (
                hasDesignerBudget && ridingComplete && paintjobComplete ? (
                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isSubmitting ? "Submitting direction..." : "Submit"}
                  </button>
                ) : (
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-slate-500 transition-all duration-300"
                      style={{
                        width: `${Math.round(
                          ((Number(hasDesignerBudget) +
                            RIDING_FIELDS.filter(
                              (field) =>
                                (values[field.key] ?? "").trim().length > 0,
                            ).length +
                            Number(paintjobRoute.length > 0) +
                            Number(selectedPaintColors.length > 0) +
                            Number(selectedPaintStyles.length > 0)) /
                            (1 +
                              RIDING_FIELDS.length +
                              1 +
                              (hasCustomPaintDirection ? 2 : 0))) *
                            100,
                        )}%`,
                      }}
                    />
                  </div>
                )
              ) : showFrameOnlyMessage ? (
                ridingComplete && paintjobComplete ? (
                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isSubmitting
                      ? "Submitting direction..."
                      : "Confirm frame-only project"}
                  </button>
                ) : (
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-slate-500 transition-all duration-300"
                      style={{
                        width: `${Math.round(
                          ((RIDING_FIELDS.filter(
                            (field) =>
                              (values[field.key] ?? "").trim().length > 0,
                          ).length +
                            Number(paintjobRoute.length > 0) +
                            Number(selectedPaintColors.length > 0) +
                            Number(selectedPaintStyles.length > 0)) /
                            (RIDING_FIELDS.length +
                              1 +
                              (hasCustomPaintDirection ? 2 : 0))) *
                            100,
                        )}%`,
                      }}
                    />
                  </div>
                )
              ) : (
                <>
                  {allFieldsComplete && ridingComplete && paintjobComplete ? (
                    <button
                      type="button"
                      onClick={onSubmit}
                      disabled={isSubmitting}
                      className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {isSubmitting
                        ? "Submitting specification..."
                        : "Submit specification"}
                    </button>
                  ) : (
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-slate-500 transition-all duration-300"
                        style={{
                          width: `${Math.round(
                            ((completedFields +
                              RIDING_FIELDS.filter(
                                (field) =>
                                  (values[field.key] ?? "").trim().length > 0,
                              ).length +
                              Number(paintjobRoute.length > 0) +
                              Number(selectedPaintColors.length > 0) +
                              Number(selectedPaintStyles.length > 0)) /
                              (totalFields +
                                RIDING_FIELDS.length +
                                1 +
                                (hasCustomPaintDirection ? 2 : 0))) *
                              100,
                          )}%`,
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
