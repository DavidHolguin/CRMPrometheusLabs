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
    <div className="py-4 bg-gradient-to-b from-primary/5 to-transparent shadow-sm">
      <div className="container max-w-screen-xl mx-auto">
        <nav aria-label="Progress" className="px-4 md:px-6">
          <ol className="flex items-center justify-center">
            {steps.map((step, stepIdx) => (
              <li
                key={step.name}
                className={`relative ${
                  stepIdx !== steps.length - 1 ? "pr-16 sm:pr-28 lg:pr-36" : ""
                }`}
              >
                {step.id < currentStep ? (
                  // Paso completado
                  <>
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div
                        className={`h-0.5 w-full ${
                          stepIdx === 0 ? "bg-primary" : "bg-primary"
                        }`}
                      />
                    </div>
                    <div
                      className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary shadow-md shadow-primary/30 transition-all duration-300"
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
                      className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-white dark:bg-slate-900 text-primary ring-4 ring-primary/10 transition-all duration-300"
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
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-muted bg-white dark:bg-slate-900 transition-all duration-300">
                      <span className="text-muted-foreground">{step.id + 1}</span>
                      <span className="sr-only">{step.name}</span>
                    </div>
                  </>
                )}
                <div className={`absolute top-12 text-xs sm:text-sm whitespace-nowrap text-center ${
                  step.id === currentStep ? "font-medium text-primary" : "text-muted-foreground"
                }`} style={{ left: "50%", transform: "translateX(-50%)" }}>
                  {step.name}
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  );
}
