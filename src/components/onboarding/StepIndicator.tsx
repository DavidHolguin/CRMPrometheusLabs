
import { CheckIcon } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
}

const steps = [
  { id: 0, name: "Bienvenida" },
  { id: 1, name: "Empresa" },
  { id: 2, name: "Servicios" },
  { id: 3, name: "Chatbot" },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="py-4">
      <nav aria-label="Progress">
        <ol className="flex items-center justify-center">
          {steps.map((step, stepIdx) => (
            <li
              key={step.name}
              className={`relative ${
                stepIdx !== steps.length - 1 ? "pr-32 sm:pr-44" : ""
              }`}
            >
              {step.id < currentStep ? (
                // Paso completado
                <>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div
                      className={`h-0.5 w-full ${
                        step.id < currentStep ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  </div>
                  <div
                    className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary"
                  >
                    <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                    <span className="sr-only">{step.name}</span>
                  </div>
                </>
              ) : step.id === currentStep ? (
                // Paso actual
                <>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div
                      className={`h-0.5 w-full ${
                        stepIdx === 0 ? "bg-muted" : "bg-primary"
                      }`}
                    />
                  </div>
                  <div
                    className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background text-primary"
                    aria-current="step"
                  >
                    <span className="font-medium">{step.id + 1}</span>
                    <span className="sr-only">{step.name}</span>
                  </div>
                </>
              ) : (
                // Paso futuro
                <>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-muted" />
                  </div>
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted bg-background">
                    <span className="text-muted-foreground">{step.id + 1}</span>
                    <span className="sr-only">{step.name}</span>
                  </div>
                </>
              )}
              {stepIdx !== steps.length - 1 && (
                <div className="absolute top-0 right-8 hidden text-sm whitespace-nowrap sm:block">
                  {step.name}
                </div>
              )}
              {stepIdx === steps.length - 1 && (
                <div className="absolute top-0 right-0 hidden text-sm whitespace-nowrap sm:block">
                  {step.name}
                </div>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
