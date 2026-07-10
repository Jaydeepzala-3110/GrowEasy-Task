import type { AppStep } from "@/types/crm";

const STEPS: { id: AppStep; label: string; number: number }[] = [
  { id: "upload", label: "Upload", number: 1 },
  { id: "preview", label: "Preview", number: 2 },
  { id: "processing", label: "Import", number: 3 },
  { id: "results", label: "Results", number: 4 },
];

const stepOrder: AppStep[] = ["upload", "preview", "processing", "results"];

function stepIndex(step: AppStep): number {
  return stepOrder.indexOf(step);
}

interface StepIndicatorProps {
  currentStep: AppStep;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const current = stepIndex(currentStep);

  return (
    <nav aria-label="Import progress" className="mb-8">
      <ol className="flex flex-wrap items-center gap-2 sm:gap-4">
        {STEPS.map((step, index) => {
          const isActive = index === current;
          const isComplete = index < current;

          return (
            <li key={step.id} className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <span
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium",
                    isActive
                      ? "bg-primary text-on-primary"
                      : isComplete
                        ? "bg-surface-card text-ink"
                        : "border border-hairline bg-canvas text-muted",
                  ].join(" ")}
                >
                  {step.number}
                </span>
                <span
                  className={[
                    "hidden text-sm font-medium sm:inline",
                    isActive ? "text-ink" : isComplete ? "text-body-strong" : "text-muted",
                  ].join(" ")}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <span className="hidden h-px w-8 bg-hairline sm:block" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
