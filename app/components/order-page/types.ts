export type MeasurementsSectionProps = {
  activeMeasurement: string | null;
  bodyType: "male" | "female";
  bodyWeight: string;
  expandedGuidelineKey: string | null;
  isSubmitting: boolean;
  isSubmitted: boolean;
  measurementArrowsSvgMarkup: string;
  measurementKeys: string[];
  selectedBodySrc: string;
  values: Record<string, string>;
  onActivateMeasurement: (key: string) => void;
  onDeactivateMeasurement: () => void;
  onBodyTypeChange: (value: "male" | "female") => void;
  onBodyWeightChange: (value: string) => void;
  onMeasurementChange: (key: string, value: string) => void;
  onSubmit: () => void;
  onToggleGuidelines: (key: string) => void;
};

export type BikeDesignSectionProps = {
  bikeDrawingSrc: string;
  currentStage: import("~/lib/mock-order").OrderStage;
  specificationMode: "guided_by_designer" | "self_specified" | null;
  values: Record<string, string>;
  onModeChange: (mode: "guided_by_designer" | "self_specified") => void;
  onValueChange: (key: string, value: string) => void;
};
