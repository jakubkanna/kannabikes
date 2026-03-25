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
  artistNote?: string;
  isApproving: boolean;
  bikeDrawingSrc: string;
  designPreviewSrc: string;
  designValues?: Record<string, string>;
  currentStage: import("~/lib/mock-order").OrderStage;
  depositOrderStatus: string;
  finalAmountLabel: string;
  isDepositConfirmed: boolean;
  isSubmitting: boolean;
  isSubmitted: boolean;
  specificationMode:
    | "guided_by_designer"
    | "self_specified"
    | "frame_only"
    | null;
  attachmentFile: File | null;
  onApprove: () => void;
  values: Record<string, string>;
  onModeChange: (
    mode: "guided_by_designer" | "self_specified" | "frame_only",
  ) => void;
  onAttachmentChange: (file: File | null) => void;
  onSubmit: () => void;
  onValueChange: (key: string, value: string) => void;
};
