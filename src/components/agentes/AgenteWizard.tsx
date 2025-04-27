import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Bot, FileText, Sparkles, Target, CheckCircle, Loader2 } from "lucide-react";
import { AgenteBasicInfo } from "./AgenteBasicInfo";
import { AgenteKnowledgeSource } from "./AgenteKnowledgeSource";
import { AgentePersonality } from "./AgentePersonality";
import { AgenteGoalsExamples } from "./AgenteGoalsExamples";
import { AgenteReview } from "./AgenteReview";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Step = "basic" | "knowledge" | "personality" | "goals" | "review";

const steps = [
  { id: "basic", label: "Información básica", icon: Bot },
  { id: "knowledge", label: "Fuentes de conocimiento", icon: FileText },
  { id: "personality", label: "Personalidad & estilo", icon: Sparkles },
  { id: "goals", label: "Objetivos & Ejemplos", icon: Target },
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
  const [agenteId, setAgenteId] = useState<string | null>(null);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [isSavingStep, setIsSavingStep] = useState(false);
  const [loadingSources, setLoadingSources] = useState(false);

  // Índice del paso actual
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  // Efecto para detectar cambios en las fuentes de conocimiento
  useEffect(() => {
    if (formData.knowledge?.sources) {
      const processingItems = formData.knowledge.sources.filter(
        (s: any) => s.status === 'processing'
      );
      setLoadingSources(processingItems.length > 0);
    }
  }, [formData.knowledge]);

  const handleNextStep = async () => {
    // Detectar si hay fuentes procesándose antes de continuar
    if (currentStep === "knowledge" && loadingSources) {
      const confirmed = window.confirm(
        "Hay documentos que siguen procesándose. ¿Deseas continuar de todos modos?"
      );
      if (!confirmed) return;
    }

    setIsSavingStep(true);

    try {
      // Guardar datos del paso actual en el servidor
      if (agenteId) {
        await saveStepDataToServer(currentStep);
      }

      // Crear el agente si estamos en el primer paso y aún no tenemos ID
      if (currentStep === "basic" && !agenteId) {
        await createInitialAgent();
      }

      // Avanzar al siguiente paso
      if (currentStepIndex < steps.length - 1) {
        setCurrentStep(steps[currentStepIndex + 1].id as Step);
        setProgress(((currentStepIndex + 2) / steps.length) * 100);
      } else {
        // Si es el último paso, finalizar el proceso
        await finalizeAgentCreation();
        onComplete({...formData, agenteId});
      }
    } catch (error) {
      console.error("Error al avanzar al siguiente paso:", error);
      toast.error("Error al guardar los datos. Inténtalo de nuevo.");
    } finally {
      setIsSavingStep(false);
    }
  };

  const saveStepDataToServer = async (step: Step) => {
    if (!agenteId) return;

    try {
      switch (step) {
        case "personality":
          // En lugar de actualizar la tabla 'agentes', insertamos en la tabla 'agente_personalidad'
          const { error: personalityError } = await supabase
            .from('agente_personalidad')
            .upsert({
              agente_id: agenteId,
              rasgos: {
                tone: formData.personality?.tone || 50,
                preset: formData.personality?.preset || "default"
              },
              estilo_comunicacion: {
                instructions: formData.personality?.instructions || ""
              },
              preferencias_interaccion: {},
              adaptabilidad_contextual: formData.personality?.tone || 50
            })
            .select();

          if (personalityError) throw personalityError;
          break;

        case "goals":
          // Para objetivos, usamos una estructura diferente según tu esquema
          const { error: goalsError } = await supabase
            .from('agentes')
            .update({
              objetivos: formData.goals?.objectives || "",
              puntos_clave: formData.goals?.keyPoints || []
            })
            .eq('id', agenteId);

          // Los ejemplos podrían ir en una tabla específica o como parte de conocimiento
          if (formData.goals?.examples && formData.goals.examples.length > 0) {
            // Insertar ejemplos como conocimiento del agente
            const ejemplos = formData.goals.examples.map((ejemplo: any) => ({
              agente_id: agenteId,
              tipo: 'ejemplo',
              fuente: 'manual',
              formato: 'text',
              contenido: `Pregunta: ${ejemplo.question}\nRespuesta: ${ejemplo.answer}`,
              prioridad: 2,
              metadata: {
                type: 'example',
                question: ejemplo.question,
                answer: ejemplo.answer
              }
            }));

            const { error: ejemplosError } = await supabase
              .from('agente_conocimiento')
              .upsert(ejemplos);

            if (ejemplosError) throw ejemplosError;
          }

          if (goalsError) throw goalsError;
          break;
        
        default:
          return; // No guardar otros pasos
      }

      toast.success(`Datos guardados correctamente`);
    } catch (error) {
      console.error(`Error al guardar datos del paso ${step}:`, error);
      throw error;
    }
  };

  const finalizeAgentCreation = async () => {
    if (!agenteId) return;

    try {
      // Actualizar el estado del agente a "activo"
      const { error } = await supabase
        .from('agentes')
        .update({
          status: "activo"
        })
        .eq('id', agenteId);

      if (error) throw error;
      
      toast.success("¡Agente creado y activado correctamente!");
    } catch (error) {
      console.error("Error al finalizar la creación del agente:", error);
      throw error;
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

  // Crear un registro inicial del agente para obtener el ID
  const createInitialAgent = async () => {
    if (!formData.basic?.nombre) return;
    
    setIsCreatingAgent(true);
    
    try {
      // Crear el registro del agente en la tabla principal - eliminamos sitio_web que tampoco existe
      const { data, error } = await supabase
        .from('agentes')
        .insert({
          nombre: formData.basic.nombre,
          descripcion: formData.basic.descripcion || "",
          tipo: "asistente", // tipo predeterminado
          nivel_autonomia: 1,
          status: "entrenamiento"
        })
        .select('id')
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setAgenteId(data.id);
        toast.success("Agente creado correctamente. Puedes continuar configurándolo.");
      }
    } catch (error) {
      toast.error(`Error al crear el agente: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      console.error("Error al crear el agente:", error);
      throw error;
    } finally {
      setIsCreatingAgent(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case "basic":
        return formData.basic?.nombre && !isCreatingAgent; // Ya no requerimos email
      case "knowledge":
      case "personality":
      case "goals":
        return true; // Estos pasos son opcionales
      case "review":
        return formData.basic?.nombre && !isSavingStep; // Ya no requerimos email
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
            agenteId={agenteId}
          />
        );
      case "personality":
        return (
          <AgentePersonality
            onDataChange={(data) => updateFormData("personality", data)}
            initialData={formData.personality}
          />
        );
      case "goals":
        return (
          <AgenteGoalsExamples
            onDataChange={(data) => updateFormData("goals", data)}
            initialData={formData.goals}
          />
        );
      case "review":
        return (
          <AgenteReview
            data={{...formData, agenteId}}
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
                const isLoading = step.id === "knowledge" && loadingSources && currentStep !== "knowledge";
                
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
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
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
      <ScrollArea className="flex-1 overflow-y-auto">
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
            disabled={isCreatingAgent || isSavingStep}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentStepIndex === 0 ? "Cancelar" : "Anterior"}
          </Button>

          <Button 
            onClick={handleNextStep}
            disabled={!canProceed() || isSavingStep}
            className="min-w-[100px]"
          >
            {isCreatingAgent ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando agente...
              </>
            ) : isSavingStep ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : currentStepIndex === steps.length - 1 ? (
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