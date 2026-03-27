import { useEffect, useState } from "react";
import {
  InputField,
  SelectField,
  TextareaField,
} from "~/components/form-field";
import { useLocale } from "~/components/locale-provider";
import {
  getOrderBikeDesignFieldPlaceholder,
  getOrderBikeDesignText,
} from "~/lib/i18n-messages";
import { SectionPill } from "~/components/section-pill";
import { AnimatedOrderSection } from "./order-motion";
import { OrderSubmittedSummarySection } from "./order-submitted-summary-section";
import type { BikeDesignSectionProps } from "./types";

const WHEEL_SIZE_OPTIONS = ['32"', '29"', '27.5"', '26"', "700c"] as const;
const DRIVETRAIN_TYPE_OPTIONS = [
  { label: "Gearbox", value: "gearbox" },
  { label: "Hub transmission", value: "hub_transmission" },
  { label: "Derailleur", value: "derailleur" },
] as const;

type SpecificationFieldDefinition = {
  key: string;
  label: string;
  kind?: "text" | "select";
  options?: readonly string[];
};

type SpecificationSectionDefinition = {
  title: string;
  fields: SpecificationFieldDefinition[];
};

type DrivetrainType = (typeof DRIVETRAIN_TYPE_OPTIONS)[number]["value"];

const DRIVETRAIN_TYPE_KEY = "Drivetrain:Transmission";
const DRIVETRAIN_FIELDS_BY_TYPE: Record<
  DrivetrainType,
  SpecificationFieldDefinition[]
> = {
  gearbox: [
    { key: "Drivetrain:Gearbox", label: "Gearbox" },
    { key: "Drivetrain:Crankset", label: "Crankset" },
    { key: "Drivetrain:BeltOrChain", label: "Belt / chain" },
    { key: "Drivetrain:RearCog", label: "Rear cog" },
    { key: "Drivetrain:Shifter", label: "Shifter" },
  ],
  hub_transmission: [
    { key: "Drivetrain:Hub", label: "Hub" },
    { key: "Drivetrain:Crankset", label: "Crankset" },
    { key: "Drivetrain:Chainring", label: "Chainring" },
    { key: "Drivetrain:Cog", label: "Cog" },
    { key: "Drivetrain:BeltOrChain", label: "Belt / chain" },
    { key: "Drivetrain:Shifter", label: "Shifter" },
  ],
  derailleur: [
    { key: "Drivetrain:Crankset", label: "Crankset" },
    { key: "Drivetrain:Chainring", label: "Chainring" },
    { key: "Drivetrain:Cassette", label: "Cassette" },
    { key: "Drivetrain:RearDerailleur", label: "Rear derailleur" },
    { key: "Drivetrain:Chain", label: "Chain" },
    { key: "Drivetrain:Shifters", label: "Shifters" },
  ],
};
const ALL_DRIVETRAIN_FIELD_KEYS = Array.from(
  new Set(
    Object.values(DRIVETRAIN_FIELDS_BY_TYPE).flatMap((fields) =>
      fields.map((field) => field.key),
    ),
  ),
);

const BASE_COMPONENT_SECTIONS: SpecificationSectionDefinition[] = [
  {
    title: "Frameset",
    fields: [
      { key: "Frameset:Fork", label: "Fork" },
      { key: "Frameset:Headset", label: "Headset" },
      { key: "Frameset:Cockpit", label: "Cockpit" },
    ],
  },
  {
    title: "Front wheel",
    fields: [
      {
        key: "Front wheel:Size",
        label: "Size",
        kind: "select",
        options: WHEEL_SIZE_OPTIONS,
      },
      { key: "Front wheel:Front rim", label: "Front rim" },
      { key: "Front wheel:Front hub", label: "Front hub" },
      { key: "Front wheel:Front tire", label: "Front tire" },
    ],
  },
  {
    title: "Back wheel",
    fields: [
      {
        key: "Back wheel:Size",
        label: "Size",
        kind: "select",
        options: WHEEL_SIZE_OPTIONS,
      },
      { key: "Back wheel:Rear rim", label: "Rear rim" },
      { key: "Back wheel:Rear hub", label: "Rear hub" },
      { key: "Back wheel:Rear tire", label: "Rear tire" },
    ],
  },
  {
    title: "Brakes",
    fields: [
      { key: "Brakes:Front brake", label: "Front brake" },
      { key: "Brakes:Rear brake", label: "Rear brake" },
      { key: "Brakes:Rotors", label: "Rotors" },
    ],
  },
  {
    title: "Other",
    fields: [
      { key: "Other:Saddle", label: "Saddle" },
      { key: "Other:Seatpost", label: "Seatpost" },
      { key: "Other:Pedals", label: "Pedals" },
      { key: "Other:Accessories", label: "Accessories" },
    ],
  },
];

const GEOMETRY_FIELDS = [
  { title: "Stack", key: "Geometry:Stack" },
  { title: "Reach", key: "Geometry:Reach" },
  { title: "Top tube", key: "Geometry:TopTube" },
  { title: "Seat tube", key: "Geometry:SeatTube" },
  { title: "Head tube", key: "Geometry:HeadTube" },
  { title: "Head angle", key: "Geometry:HeadAngle" },
  { title: "Seat angle", key: "Geometry:SeatAngle" },
  { title: "Chainstay", key: "Geometry:Chainstay" },
  { title: "BB height", key: "Geometry:BBHeight" },
] as const;

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
  {
    title: "Frame material",
    key: "Riding:FrameMaterial",
    options: ["steel", "titanium"],
  },
] as const;
const RIDING_NOTES_KEY = "Riding:AdditionalNotes";
const PAINTJOB_ROUTE_KEY = "Paintjob:Route";
const PAINTJOB_COLORS_KEY = "Paintjob:FavoriteColors";
const PAINTJOB_CUSTOM_COLOR_KEY = "Paintjob:CustomColor";
const PAINTJOB_STYLE_KEY = "Paintjob:Style";
const PAINTJOB_NOTES_KEY = "Paintjob:AdditionalNotes";
const PAINTJOB_IMAGE_KEY = "Paintjob:Attachment";
const PAINTJOB_IMAGE_URL_KEY = "Paintjob:AttachmentUrl";
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
    swatchClassName: "bg-white border border-stone-300",
  },
  { label: "Red", value: "red", swatchClassName: "bg-red-500" },
  { label: "Blue", value: "blue", swatchClassName: "bg-blue-500" },
  { label: "Green", value: "green", swatchClassName: "bg-green-500" },
  { label: "Yellow", value: "yellow", swatchClassName: "bg-yellow-400" },
  { label: "Orange", value: "orange", swatchClassName: "bg-orange-500" },
  { label: "Purple", value: "purple", swatchClassName: "bg-violet-500" },
  { label: "Pink", value: "pink", swatchClassName: "bg-pink-500" },
  { label: "Silver", value: "silver", swatchClassName: "bg-gray-300" },
  {
    label: "Other",
    value: "other",
    swatchClassName:
      "bg-[linear-gradient(135deg,#ef4444,#f59e0b,#10b981,#3b82f6,#8b5cf6)]",
  },
] as const;

function getDrivetrainType(value: string | undefined): DrivetrainType | null {
  return DRIVETRAIN_TYPE_OPTIONS.some((option) => option.value === value)
    ? (value as DrivetrainType)
    : null;
}

function getDrivetrainTypeLabel(value: string | undefined) {
  return (
    DRIVETRAIN_TYPE_OPTIONS.find((option) => option.value === value)?.label ??
    value ??
    ""
  );
}

function getComponentSections(
  drivetrainType: DrivetrainType | null,
): SpecificationSectionDefinition[] {
  return [
    BASE_COMPONENT_SECTIONS[0],
    BASE_COMPONENT_SECTIONS[1],
    BASE_COMPONENT_SECTIONS[2],
    {
      title: "Drivetrain",
      fields: [
        {
          key: DRIVETRAIN_TYPE_KEY,
          label: "Transmission",
          kind: "select",
          options: DRIVETRAIN_TYPE_OPTIONS.map((option) => option.value),
        },
        ...(drivetrainType ? DRIVETRAIN_FIELDS_BY_TYPE[drivetrainType] : []),
      ],
    },
    BASE_COMPONENT_SECTIONS[3],
    BASE_COMPONENT_SECTIONS[4],
  ];
}

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
  artistNote,
  attachmentFile,
  isApproving,
  bikeDrawingSrc,
  designValues = {},
  designPreviewSrc,
  currentStage,
  depositOrderStatus,
  finalAmountLabel,
  isDepositConfirmed,
  isSubmitting,
  isSubmitted,
  specificationMode,
  onAttachmentChange,
  onApprove,
  values,
  onModeChange,
  onSubmit,
  onValueChange,
}: BikeDesignSectionProps) {
  const locale = useLocale();
  const t = (value: string) => getOrderBikeDesignText(locale, value);
  const isWaitingForDesign = currentStage === "waiting_for_design";
  const isWaitingForApproval = currentStage === "waiting_for_design_approval";
  const hasDepositReachedPaidState =
    isDepositConfirmed ||
    depositOrderStatus === "processing" ||
    depositOrderStatus === "completed";
  const isPaymentVerificationPending =
    isWaitingForDesign && !hasDepositReachedPaidState;
  const isApprovedDesign =
    currentStage === "waiting_for_final_payment" ||
    currentStage === "in_production" ||
    currentStage === "waiting_for_delivery" ||
    currentStage === "delivered";
  const shouldCollapseSubmittedSummary = isApprovedDesign;
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
  const uploadedPaintImageName = values[PAINTJOB_IMAGE_KEY] ?? "";
  const uploadedPaintImageUrl = values[PAINTJOB_IMAGE_URL_KEY] ?? "";
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<
    string | null
  >(null);
  const customPaintColor = values[PAINTJOB_CUSTOM_COLOR_KEY] ?? "";
  const selectedPaintStyles = getSelectedValues(values[PAINTJOB_STYLE_KEY]);
  const drivetrainType = getDrivetrainType(values[DRIVETRAIN_TYPE_KEY]);
  const componentSections = getComponentSections(drivetrainType);
  const paintjobComplete =
    paintjobRoute.length > 0 &&
    (!hasCustomPaintDirection ||
      (selectedPaintColors.length > 0 &&
        selectedPaintStyles.length > 0 &&
        (!hasOtherPaintColor || customPaintColor.length > 0)));
  const specificationFields = componentSections.flatMap((section) =>
    section.fields.map((field) => field.key),
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
  const resolveSpecificationFieldValue = (fieldKey: string) =>
    designValues[fieldKey] || values[fieldKey] || "";
  const displayedPaintImageUrl = attachmentPreviewUrl || uploadedPaintImageUrl;
  const handleDrivetrainTypeChange = (nextType: DrivetrainType) => {
    onValueChange(DRIVETRAIN_TYPE_KEY, nextType);

    const nextFieldKeys = new Set(
      DRIVETRAIN_FIELDS_BY_TYPE[nextType].map((field) => field.key),
    );

    ALL_DRIVETRAIN_FIELD_KEYS.forEach((fieldKey) => {
      if (!nextFieldKeys.has(fieldKey) && (values[fieldKey] ?? "") !== "") {
        onValueChange(fieldKey, "");
      }
    });
  };

  useEffect(() => {
    if (!attachmentFile) {
      setAttachmentPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(attachmentFile);
    setAttachmentPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [attachmentFile]);

  const renderRidingSection = () => (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
        {t("Riding")}
      </h3>
      <div className="mt-4 space-y-5">
        {RIDING_FIELDS.map((field) => (
          <div key={field.key}>
            <span className="mb-2 block text-sm font-semibold text-gray-700">
              {t(field.title)}
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
                        ? "border-[var(--kanna-ink)] bg-[var(--kanna-ink)] text-white"
                        : "border-stone-300 bg-white text-gray-700 hover:border-stone-400"
                    }`}
                  >
                    {t(option)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-gray-700">
            {t("Additional notes")}
          </span>
          <TextareaField
            value={values[RIDING_NOTES_KEY] ?? ""}
            onChange={(event) =>
              onValueChange(RIDING_NOTES_KEY, event.target.value)
            }
            placeholder={t("Add any additional riding notes")}
            rows={4}
            className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
          />
        </label>
      </div>
    </div>
  );
  const renderRidingSummary = () => (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
        {t("Riding")}
      </h3>
      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {RIDING_FIELDS.map((field) => (
          <div key={field.key}>
            <span className="mb-2 block text-sm font-semibold text-gray-700">
              {t(field.title)}
            </span>
            <p className="text-sm capitalize text-gray-900">
              {values[field.key] || "-"}
            </p>
          </div>
        ))}
        <div className="sm:col-span-2">
          <span className="mb-2 block text-sm font-semibold text-gray-700">
            {t("Additional notes")}
          </span>
          <p className="text-sm text-gray-900">
            {values[RIDING_NOTES_KEY] || "-"}
          </p>
        </div>
      </div>
    </div>
  );
  const renderPaintjobSection = () => (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
        {t("Paintjob")}
      </h3>
      <div className="mt-4 space-y-5">
        <div>
          <span className="mb-2 block text-sm font-semibold text-gray-700">
            {t("Variant")}
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
                      ? "border-[var(--kanna-ink)] bg-[var(--kanna-ink)] text-white"
                      : "border-stone-200 bg-white text-gray-900 hover:border-stone-300"
                  }`}
                >
                  <span className="text-sm font-semibold">{t(option)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {hasCustomPaintDirection ? (
          <>
            <div>
              <span className="mb-2 block text-sm font-semibold text-gray-700">
                {t("Colors")}
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
                          ? "border-[var(--kanna-ink)] bg-[var(--kanna-ink)] text-white"
                          : "border-stone-300 bg-white text-gray-700 hover:border-stone-400"
                      }`}
                    >
                      <span
                        className={`h-4 w-4 rounded-full ${option.swatchClassName}`}
                      />
                      <span>{t(option.label)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {hasOtherPaintColor ? (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-gray-700">
                  {t("Other color")}
                </span>
                <InputField
                  type="color"
                  value={customPaintColor || "#000000"}
                  onChange={(event) =>
                    onValueChange(PAINTJOB_CUSTOM_COLOR_KEY, event.target.value)
                  }
                  className="h-11 p-1"
                />
              </label>
            ) : null}

            <div>
              <span className="mb-2 block text-sm font-semibold text-gray-700">
                {t("Style")}
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
                          ? "border-[var(--kanna-ink)] bg-[var(--kanna-ink)] text-white"
                          : "border-stone-300 bg-white text-gray-700 hover:border-stone-400"
                      }`}
                    >
                      {t(option)}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-gray-700">
                {t("Additional notes")}
              </span>
              <TextareaField
                value={values[PAINTJOB_NOTES_KEY] ?? ""}
                onChange={(event) =>
                  onValueChange(PAINTJOB_NOTES_KEY, event.target.value)
                }
                placeholder={t("Give some tips to the artist")}
                rows={4}
                className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-gray-700">
                {t("Attach image")}
              </span>
              <InputField
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null;

                  onAttachmentChange(nextFile);
                  onValueChange(PAINTJOB_IMAGE_KEY, nextFile?.name ?? "");
                }}
                className="px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[var(--kanna-ink)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
              {displayedPaintImageUrl ? (
                <div className="mt-2">
                  <div className="w-full overflow-hidden rounded-lg border border-stone-200 bg-stone-50 sm:w-1/3">
                    <img
                      src={displayedPaintImageUrl}
                      alt={uploadedPaintImageName || t("Paint reference image")}
                      className="h-auto max-h-56 w-full object-contain"
                    />
                  </div>
                </div>
              ) : null}
            </label>
          </>
        ) : null}
      </div>
    </div>
  );
  const renderPaintjobSummary = () => (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
        {t("Paintjob")}
      </h3>
      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <span className="mb-2 block text-sm font-semibold text-gray-700">
            {t("Variant")}
          </span>
          <p className="text-sm text-gray-900">{paintjobRoute || "-"}</p>
        </div>
        {hasCustomPaintDirection ? (
          <>
            <div className="sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-gray-700">
                {t("Colors")}
              </span>
              <p className="text-sm capitalize text-gray-900">
                {selectedPaintColors.length > 0
                  ? selectedPaintColors
                      .map((color) =>
                        color === "other" && customPaintColor
                          ? `${t("other")} (${customPaintColor})`
                          : t(color),
                      )
                      .join(", ")
                  : "-"}
              </p>
            </div>
            <div>
              <span className="mb-2 block text-sm font-semibold text-gray-700">
                {t("Style")}
              </span>
              <p className="text-sm capitalize text-gray-900">
                {selectedPaintStyles.length > 0
                  ? selectedPaintStyles.map((style) => t(style)).join(", ")
                  : "-"}
              </p>
            </div>
            <div>
              <span className="mb-2 block text-sm font-semibold text-gray-700">
                {t("Attach image")}
              </span>
              {displayedPaintImageUrl ? (
                <div className="w-full overflow-hidden rounded-lg border border-stone-200 bg-stone-50 sm:w-1/3">
                  <img
                    src={displayedPaintImageUrl}
                    alt={uploadedPaintImageName || t("Paint reference image")}
                    className="h-auto max-h-56 w-full object-contain"
                  />
                </div>
              ) : (
                <p className="text-sm text-gray-900">-</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-gray-700">
                {t("Additional notes")}
              </span>
              <p className="text-sm text-gray-900">
                {values[PAINTJOB_NOTES_KEY] || "-"}
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
  const renderComponentsSummary = () => (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
        {t("Components")}
      </h3>
      <div className="mt-4 space-y-5">
        {componentSections.map((section, sectionIndex) => (
          <div
            key={section.title}
            className={sectionIndex > 0 ? "border-t border-stone-200 pt-5" : ""}
          >
            <h4 className="text-sm font-semibold text-gray-900">
              {t(section.title)}
            </h4>
            <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {section.fields.map((field) => {
                const fieldValue = resolveSpecificationFieldValue(field.key);

                return (
                  <div key={field.key}>
                    <span className="mb-2 block text-sm font-semibold text-gray-700">
                      {t(field.label)}
                    </span>
                    <p className="text-sm text-gray-900">
                      {field.key === DRIVETRAIN_TYPE_KEY
                        ? t(getDrivetrainTypeLabel(fieldValue) || "-")
                        : fieldValue || "-"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  const renderBuildDataSummary = () => (
    <>
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
          {t("Build type")}
        </h3>
        <p className="mt-3 text-sm text-gray-900">
          {specificationMode === "guided_by_designer"
            ? t("Designer-led specification")
            : specificationMode === "frame_only"
              ? t("Frame only")
              : t("Self-defined specification")}
        </p>
      </div>

      <div className="mt-5">{renderRidingSummary()}</div>
      <div className="mt-5">{renderPaintjobSummary()}</div>

      {specificationMode === "guided_by_designer" ? (
        <>
          <div className="mt-5 rounded-lg border border-stone-200 bg-white p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
              {t("Budget")}
            </h3>
            <p className="mt-3 text-sm text-gray-900">
              {values[DESIGNER_LED_BUDGET_KEY] || "-"}
            </p>
          </div>
        </>
      ) : specificationMode === "frame_only" ? (
        <div className="mt-5 rounded-lg border border-stone-200 bg-white p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
            {t("Notes")}
          </h3>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            {t(
              "This order will continue as a frame-only project. The designer will prepare the frame direction based on your submitted measurements and project goals.",
            )}
          </p>
        </div>
      ) : (
        <div className="mt-5">{renderComponentsSummary()}</div>
      )}
    </>
  );
  const renderPartsSummary = () => (
    <div className="mt-5">{renderComponentsSummary()}</div>
  );
  const renderGeometrySummary = () => (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
        {t("Geometry")}
      </h3>
      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {GEOMETRY_FIELDS.map((field) => (
          <div key={field.key}>
            <span className="mb-2 block text-sm font-semibold text-gray-700">
              {t(field.title)}
            </span>
            <p className="text-sm text-gray-900">
              {designValues[field.key] || values[field.key] || "-"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
  const renderArtistMessage = () => (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
        {t("From the artist")}
      </h3>
      <p className="mt-2 text-sm leading-6 text-gray-600">
        {artistNote ||
          t(
            "The geometry and component direction are prepared based on your submitted measurements and project goals. Please review the setup below and approve it if everything looks right.",
          )}
      </p>
      <p className="mt-4 text-sm font-semibold text-gray-900">Jakub Kanna</p>
    </div>
  );
  const renderFinalPriceSummary = (title = t("Amount left to pay")) => (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
        {title}
      </h3>
      <p className="mt-3 text-sm text-gray-900">{finalAmountLabel}</p>
      <p className="mt-2 text-sm leading-6 text-gray-600">
        {t("Final amount after deducting the deposit already paid.")}
      </p>
    </div>
  );

  if (isWaitingForApproval) {
    return (
      <AnimatedOrderSection className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm md:p-6">
        <div className="mb-5 shrink-0">
          <SectionPill>{t("Specification")}</SectionPill>
          <h2 className="mt-2 text-xl font-semibold text-gray-900">
            {t("Design waiting for approval")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            {t(
              "Review the proposed bike setup below. Once approved, the order can move into production.",
            )}
          </p>
        </div>

        <div className="space-y-6">
          <div className="relative flex min-h-[36vh] items-center justify-center overflow-hidden rounded-lg border border-stone-200 bg-stone-100 p-4">
            <img
              src={designPreviewSrc}
              alt="Bike design preview"
              className="h-auto max-h-[560px] w-full object-contain"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2 md:items-stretch">
            <aside className="rounded-lg border border-stone-200 bg-stone-50 p-3 md:h-full md:p-4">
              <div className="space-y-4 pb-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {t("Build data")}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {t(
                      "Review the selected configuration, riding direction, and finish details before approving the project.",
                    )}
                  </p>
                </div>

                {renderBuildDataSummary()}
                {specificationMode === "guided_by_designer"
                  ? renderPartsSummary()
                  : null}
              </div>
            </aside>

            <aside className="rounded-lg border border-stone-200 bg-stone-50 p-3 md:flex md:h-full md:flex-col md:self-stretch md:p-4">
              <div className="space-y-4 md:flex-1 md:overflow-y-auto md:pr-1">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {t("Geometry")}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {t(
                      "This geometry proposal is prepared specifically for this order and should be reviewed together with the design image.",
                    )}
                  </p>
                </div>

                {renderGeometrySummary()}
                {renderFinalPriceSummary()}
                {renderArtistMessage()}
              </div>

              <div className=" shrink-0 border-t border-stone-200 bg-stone-50 py-4 md:sticky md:bottom-0">
                <button
                  type="button"
                  onClick={onApprove}
                  disabled={isApproving}
                  className="inline-flex w-full items-center justify-center rounded-md bg-[var(--kanna-ink)] px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-black disabled:cursor-not-allowed disabled:bg-stone-300"
                >
                  {isApproving ? t("Approving design...") : t("Approve design")}
                </button>
              </div>
            </aside>
          </div>

          <div className="md:hidden">
            <div className="sticky bottom-4 z-10">
              <button
                type="button"
                onClick={onApprove}
                disabled={isApproving}
                className="inline-flex w-full items-center justify-center rounded-md bg-[var(--kanna-ink)] px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-black disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                {isApproving ? t("Approving design...") : t("Approve design")}
              </button>
            </div>
          </div>
        </div>
      </AnimatedOrderSection>
    );
  }

  if (isSubmitted) {
    return (
      <OrderSubmittedSummarySection
        collapsible
        defaultExpanded={!shouldCollapseSubmittedSummary}
        title={t("Specification")}
        heading={isApprovedDesign ? t("Approved") : t("Received")}
        description={t(
          "Your bike specification has been submitted and recorded for the next design and production steps.",
        )}
        imageAlt={t("Bike drawing")}
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
                <div className="max-w-sm rounded-xl border border-stone-200 bg-white/95 px-5 py-4 text-center shadow-sm backdrop-blur-sm">
                  <p className="mt-2 text-lg font-semibold text-gray-900">
                    {isPaymentVerificationPending
                      ? t("We are verifying your payment")
                      : t("We are designing your bicycle")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {isPaymentVerificationPending
                      ? t(
                          "Your specification has been received. Once the deposit is verified, we will move your bike into the design stage.",
                        )
                      : t(
                          "Your measurements and specification have been received, and we are now working on the design of your bicycle. Once it is ready, you will be asked for approval.",
                        )}
                  </p>
                </div>
              </div>
            ) : null}
          </>
        }
      >
        {isApprovedDesign ? (
          <div className="space-y-5 pt-3">
            <div>
              {renderBuildDataSummary()}
              {specificationMode === "guided_by_designer"
                ? renderPartsSummary()
                : null}
            </div>
            <div className="grid gap-5 md:grid-cols-2 md:items-start">
              <div className="space-y-5">
                <div>{renderGeometrySummary()}</div>
                <div>{renderFinalPriceSummary()}</div>
              </div>
              <div>{renderArtistMessage()}</div>
            </div>
          </div>
        ) : (
          renderBuildDataSummary()
        )}
      </OrderSubmittedSummarySection>
    );
  }

  return (
    <AnimatedOrderSection className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm md:flex md:h-[80vh] md:flex-col md:overflow-hidden md:p-6">
      <div className="mb-5 shrink-0">
        <SectionPill>{t("Specification")}</SectionPill>
        <h2 className="mt-2 text-xl font-semibold text-gray-900">
          {t("Define the bike specification")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
          {t(
            "During the design stage we collect the preferred parts and build direction for the bike based on initial conversation.",
          )}
        </p>
      </div>

      <div className="md:min-h-0 md:flex-1">
        <aside className="min-h-0 rounded-lg border border-stone-200 bg-stone-50 px-3 pb-3 pt-0 md:flex md:h-full md:flex-col md:px-4 md:pb-4 md:pt-0">
          <div className="min-h-0 md:flex-1 md:overflow-y-auto">
            <div className="space-y-4 pt-4 pb-4">
              <div className="rounded-lg border border-stone-200 bg-white p-3">
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-600">
                  {t("Build type")}
                </h3>
                <div className="mt-3 grid gap-3">
                  <button
                    type="button"
                    onClick={() => onModeChange("guided_by_designer")}
                    className={`rounded-lg border px-4 py-3 text-left transition ${
                      specificationMode === "guided_by_designer"
                        ? "border-[var(--kanna-ink)] bg-[var(--kanna-ink)] text-white"
                        : "border-stone-200 bg-white text-gray-900 hover:border-stone-300"
                    }`}
                  >
                    <p className="text-sm font-semibold">
                      {t("Let the designer define the specification")}
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        specificationMode === "guided_by_designer"
                          ? "text-gray-200"
                          : "text-gray-500"
                      }`}
                    >
                      {t(
                        "You provide direction and the designer prepares the component specification for you.",
                      )}
                    </p>
                    {showGuidedMessage ? (
                      <label className="mt-4 block">
                        <span className="mb-2 block text-sm font-semibold text-gray-100">
                          {t("Budget")}
                        </span>
                        <div className="mt-3 flex items-center gap-2">
                          <InputField
                            type="text"
                            value={values[DESIGNER_LED_BUDGET_KEY] ?? ""}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) =>
                              onValueChange(
                                DESIGNER_LED_BUDGET_KEY,
                                event.target.value,
                              )
                            }
                            placeholder={t("Budget")}
                            className="w-[12ch]! border-white/70 bg-white px-3 py-2 text-[var(--kanna-ink)] placeholder:text-stone-400 focus:border-[var(--kanna-color)] focus:ring-2 focus:ring-white/35"
                          />
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onValueChange(
                                DESIGNER_LED_BUDGET_KEY,
                                "No limit",
                              );
                            }}
                            className={`rounded-full border px-3 py-2 text-sm transition ${
                              values[DESIGNER_LED_BUDGET_KEY] === "No limit"
                                ? "border-[var(--kanna-color)] bg-[var(--kanna-color)] text-[var(--kanna-ink)]"
                                : "border-white/70 bg-white text-[var(--kanna-ink)] hover:border-white"
                            }`}
                          >
                            {t("No limit")}
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
                        ? "border-[var(--kanna-ink)] bg-[var(--kanna-ink)] text-white"
                        : "border-stone-200 bg-white text-gray-900 hover:border-stone-300"
                    }`}
                  >
                    <p className="text-sm font-semibold">
                      {t("I want to define the specification")}
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        specificationMode === "self_specified"
                          ? "text-gray-200"
                          : "text-gray-500"
                      }`}
                    >
                      {t(
                        "Fill in the preferred parts and component choices yourself.",
                      )}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => onModeChange("frame_only")}
                    className={`rounded-lg border px-4 py-3 text-left transition ${
                      specificationMode === "frame_only"
                        ? "border-[var(--kanna-ink)] bg-[var(--kanna-ink)] text-white"
                        : "border-stone-200 bg-white text-gray-900 hover:border-stone-300"
                    }`}
                  >
                    <p className="text-sm font-semibold">{t("Frame only")}</p>
                    <p
                      className={`mt-1 text-xs ${
                        specificationMode === "frame_only"
                          ? "text-gray-200"
                          : "text-gray-500"
                      }`}
                    >
                      {t(
                        "Continue this order as a frame-only project without a full bike component specification.",
                      )}
                    </p>
                  </button>
                </div>
              </div>

              {showSpecificationForm ? (
                <div className="rounded-lg border border-stone-200 bg-white p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
                    {t("Specification")}
                  </h3>
                  <div className="mt-4 space-y-4">
                    {componentSections.map((section) => {
                      const visibleFields = section.fields.filter((field) => {
                        return visibleSpecificationFieldKeys.has(field.key);
                      });

                      if (visibleFields.length === 0) {
                        return null;
                      }

                      return (
                        <div
                          key={section.title}
                          className="rounded-lg border border-stone-200 bg-stone-50 p-3"
                        >
                          <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-600">
                            {t(section.title)}
                          </h4>
                          <div className="mt-3 space-y-3">
                            {visibleFields.map((field) => {
                              return (
                                <label key={field.key} className="block">
                                  <span className="mb-2 block text-sm font-semibold text-gray-700">
                                    {t(field.label)}
                                  </span>
                                  {field.kind === "select" ? (
                                    <SelectField
                                      value={values[field.key] ?? ""}
                                      onChange={(event) =>
                                        field.key === DRIVETRAIN_TYPE_KEY
                                          ? handleDrivetrainTypeChange(
                                              event.target
                                                .value as DrivetrainType,
                                            )
                                          : onValueChange(
                                              field.key,
                                              event.target.value,
                                            )
                                      }
                                      className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                                    >
                                      <option value="">
                                        {field.key === DRIVETRAIN_TYPE_KEY
                                          ? t("Select transmission")
                                          : t("Select wheel size")}
                                      </option>
                                      {(field.options ?? []).map((option) => (
                                        <option key={option} value={option}>
                                          {field.key === DRIVETRAIN_TYPE_KEY
                                            ? t(getDrivetrainTypeLabel(option))
                                            : t(option)}
                                        </option>
                                      ))}
                                    </SelectField>
                                  ) : (
                                    <InputField
                                      type="text"
                                      value={values[field.key] ?? ""}
                                      onChange={(event) =>
                                        onValueChange(
                                          field.key,
                                          event.target.value,
                                        )
                                      }
                                      placeholder={
                                        getOrderBikeDesignFieldPlaceholder(
                                          locale,
                                          t(field.label),
                                        )
                                      }
                                      className="px-3 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                                    />
                                  )}
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
            <div className="shrink-0 border-t border-stone-200 bg-stone-50 pt-4">
              {showGuidedMessage ? (
                hasDesignerBudget && ridingComplete && paintjobComplete ? (
                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className="inline-flex w-full items-center justify-center rounded-md bg-[var(--kanna-ink)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-stone-300"
                  >
                    {isSubmitting ? t("Submitting direction...") : t("Submit")}
                  </button>
                ) : (
                  <div className="h-2 overflow-hidden rounded-full bg-stone-200">
                    <div
                      className="h-full rounded-full bg-[var(--kanna-color)] transition-all duration-300"
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
                    className="inline-flex w-full items-center justify-center rounded-md bg-[var(--kanna-ink)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-stone-300"
                  >
                    {isSubmitting
                      ? t("Submitting direction...")
                      : t("Confirm frame-only project")}
                  </button>
                ) : (
                  <div className="h-2 overflow-hidden rounded-full bg-stone-200">
                    <div
                      className="h-full rounded-full bg-[var(--kanna-color)] transition-all duration-300"
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
                      className="inline-flex w-full items-center justify-center rounded-md bg-[var(--kanna-ink)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-stone-300"
                    >
                      {isSubmitting
                        ? t("Submitting specification...")
                        : t("Submit specification")}
                    </button>
                  ) : (
                    <div className="h-2 overflow-hidden rounded-full bg-stone-200">
                      <div
                        className="h-full rounded-full bg-[var(--kanna-color)] transition-all duration-300"
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
    </AnimatedOrderSection>
  );
}
