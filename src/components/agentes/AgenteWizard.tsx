import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Bot, FileText, Sparkles, Zap, CheckCircle } from "lucide-react";
import { AgenteBasicInfo } from "./AgenteBasicInfo";
import { AgenteKnowledgeSource } from "./AgenteKnowledgeSource";
import { AgentePersonality } from "./AgentePersonality";
import { AgenteAutomation } from "./AgenteAutomation";
import { AgenteReview } from "./AgenteReview";
import { Progress } from "@/components/ui/progress";

type Step = "basic" | "knowledge" | "personality" | "automation" | "review";

const steps = [
  { id: "basic", label: "Información básica", icon: Bot },
  { id: "knowledge", label: "Fuentes de conocimiento", icon: FileText },
  { id: "personality", label: "Personalidad & estilo", icon: Sparkles },
  { id: "automation", label: "Intenciones & Automatizaciones", icon: Zap },
  { id: "review", label: "Revisión & Publicación", icon: CheckCircle }
];

interface AgenteWizardProps {
  onComplete: (data: any) => void;
  onCancel: () => void;
}

export function AgenteWizard({ onComplete, onCancel }: AgenteWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>("basic");
  const [formData, setFormData] = useState<any>({});
  const [progress, setProgress] = useState(0);

  // Índice del paso actual
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id as Step);
      setProgress(((currentStepIndex + 2) / steps.length) * 100);
    } else {
      onComplete(formData);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id as Step);
      setProgress(((currentStepIndex) / steps.length) * 100);
    }
  };

  const updateFormData = (stepId: Step, data: any) => {
    setFormData(prev => ({
      ...prev,
      [stepId]: data
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case "basic":
        return formData.basic?.nombre && formData.basic?.email;
      case "knowledge":
      case "personality":
      case "automation":
        return true; // Estos pasos son opcionales
      case "review":
        return formData.basic?.nombre && formData.basic?.email;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "basic":
        return (
          <AgenteBasicInfo
            onDataChange={(data) => updateFormData("basic", data)}
            initialData={formData.basic}
          />
        );
      case "knowledge":
        return (
          <AgenteKnowledgeSource
            onDataChange={(data) => updateFormData("knowledge", data)}
            initialData={formData.knowledge}
          />
        );
      case "personality":
        return (
          <AgentePersonality
            onDataChange={(data) => updateFormData("personality", data)}
            initialData={formData.personality}
          />
        );
      case "automation":
        return (
          <AgenteAutomation
            onDataChange={(data) => updateFormData("automation", data)}
            initialData={formData.automation}
          />
        );
      case "review":
        return (
          <AgenteReview
            data={formData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      {/* Header con Progreso */}
      <div className="flex-none bg-background p-6 border-b">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">{steps[currentStepIndex].label}</h2>
              <p className="text-sm text-muted-foreground">
                Paso {currentStepIndex + 1} de {steps.length}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStepIndex > idx;
                return (
                  <div key={step.id} className="flex items-center">
                    {idx > 0 && (
                      <div 
                        className={`h-px w-4 mx-1 transition-colors duration-300 ${
                          currentStepIndex > idx - 1 ? "bg-primary" : "bg-border"
                        }`} 
                      />
                    )}
                    <div 
                      className={`
                        relative flex h-8 w-8 items-center justify-center rounded-full 
                        transition-all duration-300 
                        ${isActive ? "bg-primary text-primary-foreground ring-4 ring-primary/10" :
                          isCompleted ? "bg-primary text-primary-foreground" :
                          "bg-muted text-muted-foreground"
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" />
                      {isCompleted && (
                        <CheckCircle className="absolute -top-1 -right-1 h-4 w-4 text-primary-foreground bg-primary rounded-full" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Contenido del paso actual */}
      <ScrollArea className="verflow-y-auto">
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-6">
                {renderStepContent()}
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Barra de navegación inferior */}
      <div className="flex-none bg-background p-6 border-t">
        <div className="container max-w-3xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={currentStepIndex === 0 ? onCancel : handlePrevStep}
            className="min-w-[100px]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentStepIndex === 0 ? "Cancelar" : "Anterior"}
          </Button>

          <Button 
            onClick={handleNextStep}
            disabled={!canProceed()}
            className="min-w-[100px]"
          >
            {currentStepIndex === steps.length - 1 ? (
              <>
                Publicar agente
                <CheckCircle className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}