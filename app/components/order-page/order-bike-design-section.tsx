import { ORDER_STAGE_DEFINITIONS } from "~/lib/mock-order";
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
    fields: ["Crankset", "Chainring", "Cassette", "Rear derailleur", "Chain", "Shifters"],
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

export function OrderBikeDesignSection({
  bikeDrawingSrc,
  currentStage,
  specificationMode,
  values,
  onModeChange,
  onValueChange,
}: BikeDesignSectionProps) {
  const isWaitingForDesign = currentStage === "waiting_for_design";
  const showSpecificationForm = specificationMode === "self_specified";
  const showGuidedMessage = specificationMode === "guided_by_designer";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex md:max-h-[80vh] md:flex-col md:overflow-hidden md:p-6">
      <div className="mb-5 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Bike design
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">
          Define the bike specification
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          During the design stage we collect the preferred parts and build direction for
          the bike.
        </p>
      </div>

      <div className="grid gap-6 md:min-h-0 md:flex-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:items-stretch">
        <div className="relative flex min-h-[44vh] items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 p-4">
          <img
            src={bikeDrawingSrc}
            alt="Bike drawing"
            className={`h-auto max-h-[520px] w-full object-contain transition ${
              isWaitingForDesign ? "scale-[1.02] blur-md opacity-50" : ""
            }`}
          />
          {isWaitingForDesign ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/35 p-6">
              <div className="max-w-sm rounded-xl border border-slate-200 bg-white/95 px-5 py-4 text-center shadow-sm backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Status
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {ORDER_STAGE_DEFINITIONS[currentStage].label}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  The bike design section will unlock once this order moves beyond the
                  current stage.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="rounded-lg border border-slate-200 bg-slate-50 p-3 md:h-full md:overflow-y-auto md:p-4">
          <div className="space-y-4 pb-2">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                Specification route
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
                  <p className="text-sm font-semibold">Let the designer define the specification</p>
                  <p
                    className={`mt-1 text-xs ${
                      specificationMode === "guided_by_designer"
                        ? "text-slate-200"
                        : "text-slate-500"
                    }`}
                  >
                    You provide direction and the designer prepares the component specification for you.
                  </p>
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
                  <p className="text-sm font-semibold">I want to define the specification</p>
                  <p
                    className={`mt-1 text-xs ${
                      specificationMode === "self_specified"
                        ? "text-slate-200"
                        : "text-slate-500"
                    }`}
                  >
                    Fill in the preferred parts and component choices yourself.
                  </p>
                </button>
              </div>
            </div>

            {showGuidedMessage ? (
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  We will create the specification for you
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  We will use your measurements, riding goals, and order context to prepare
                  a full bike specification. If you have not discussed it with your designer
                  yet, feel free to contact us before the next step.
                </p>
              </div>
            ) : null}

            {showSpecificationForm
              ? BIKE_COMPONENT_SECTIONS.map((section) => (
                  <div
                    key={section.title}
                    className="rounded-lg border border-slate-200 bg-white p-3"
                  >
                    <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                      {section.title}
                    </h3>
                    <div className="mt-3 space-y-3">
                      {section.fields.map((field) => {
                        const fieldKey = `${section.title}:${field}`;

                        return (
                          <label key={fieldKey} className="block">
                            <span className="mb-2 block text-sm font-semibold text-slate-700">
                              {field}
                            </span>
                            <input
                              type="text"
                              value={values[fieldKey] ?? ""}
                              onChange={(event) => onValueChange(fieldKey, event.target.value)}
                              placeholder={`Specify ${field.toLowerCase()}`}
                              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))
              : null}
          </div>
        </aside>
      </div>
    </section>
  );
}
