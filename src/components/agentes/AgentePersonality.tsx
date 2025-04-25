import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Brain, Briefcase, UserRound, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface PersonalityPreset {
  id: string;
  name: string;
  description: string;
  icon: any;
  prompt: string;
  tone: number;
}

const presets: PersonalityPreset[] = [
  {
    id: "formal",
    name: "Formal",
    description: "Profesional y directo, ideal para ambientes corporativos",
    icon: Briefcase,
    prompt: "Eres un asistente profesional y formal. Mantienes un tono respetuoso y directo en todo momento.",
    tone: 20,
  },
  {
    id: "friendly",
    name: "Amigable",
    description: "Cercano y conversacional, perfecto para atención al cliente",
    icon: UserRound,
    prompt: "Eres un asistente amigable y cercano. Tu tono es cálido y empático, buscando siempre ayudar de forma cordial.",
    tone: 70,
  },
  {
    id: "technical",
    name: "Técnico",
    description: "Experto y detallado, óptimo para soporte técnico",
    icon: Brain,
    prompt: "Eres un asistente técnico especializado. Proporcionas explicaciones detalladas y precisas, basadas en hechos.",
    tone: 30,
  },
  {
    id: "creative",
    name: "Creativo",
    description: "Dinámico y entusiasta, ideal para marketing y ventas",
    icon: Sparkles,
    prompt: "Eres un asistente creativo y dinámico. Tu comunicación es enérgica y estimulante, buscando inspirar e innovar.",
    tone: 90,
  },
];

const variables = [
  { name: "{{empresa.nombre}}", description: "Nombre de la empresa" },
  { name: "{{usuario.nombre}}", description: "Nombre del usuario" },
  { name: "{{producto.nombre}}", description: "Nombre del producto" },
];

interface AgentePersonalityProps {
  onDataChange: (data: {
    preset: string;
    tone: number;
    instructions: string;
  }) => void;
  initialData?: {
    preset: string;
    tone: number;
    instructions: string;
  };
}

export function AgentePersonality({
  onDataChange,
  initialData,
}: AgentePersonalityProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>(
    initialData?.preset || presets[0].id
  );
  const [tone, setTone] = useState<number>(initialData?.tone || 50);
  const [instructions, setInstructions] = useState<string>(
    initialData?.instructions || presets[0].prompt
  );

  const handlePresetSelect = (preset: PersonalityPreset) => {
    setSelectedPreset(preset.id);
    setTone(preset.tone);
    setInstructions(preset.prompt);
    onDataChange({
      preset: preset.id,
      tone: preset.tone,
      instructions: preset.prompt,
    });
  };

  const handleInstructionsChange = (value: string) => {
    setInstructions(value);
    onDataChange({
      preset: selectedPreset,
      tone,
      instructions: value,
    });
  };

  const handleToneChange = (value: number[]) => {
    setTone(value[0]);
    onDataChange({
      preset: selectedPreset,
      tone: value[0],
      instructions,
    });
  };

  const insertVariable = (variable: string) => {
    const textarea = document.querySelector(
      'textarea[name="instructions"]'
    ) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newValue = before + variable + after;
      handleInstructionsChange(newValue);
      // Restaurar la posición del cursor después de la variable
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd =
          start + variable.length;
        textarea.focus();
      }, 0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Presets de personalidad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {presets.map((preset) => {
          const Icon = preset.icon;
          const isSelected = selectedPreset === preset.id;
          return (
            <motion.div
              key={preset.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`cursor-pointer transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/50"
                }`}
                onClick={() => handlePresetSelect(preset)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div
                      className={`rounded-lg p-2 ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium">{preset.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {preset.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Control de tono */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Tono de comunicación</Label>
          <span className="text-sm text-muted-foreground">
            {tone < 30
              ? "Muy formal"
              : tone < 50
              ? "Formal"
              : tone < 70
              ? "Neutral"
              : tone < 90
              ? "Casual"
              : "Muy casual"}
          </span>
        </div>
        <Slider
          min={0}
          max={100}
          step={10}
          value={[tone]}
          onValueChange={handleToneChange}
          className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Formal</span>
          <span>Casual</span>
        </div>
      </div>

      {/* Instrucciones personalizadas */}
      <div className="space-y-4">
        <Label>Instrucciones personalizadas</Label>
        <Textarea
          name="instructions"
          value={instructions}
          onChange={(e) => handleInstructionsChange(e.target.value)}
          placeholder="Escribe las instrucciones para tu agente..."
          className="min-h-[150px] font-mono text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <TooltipProvider>
            {variables.map((variable) => (
              <Tooltip key={variable.name}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => insertVariable(variable.name)}
                    className="inline-flex items-center justify-center rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                  >
                    {variable.name}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{variable.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </div>

      {/* Preview */}
      <Card className="bg-muted/50 p-4">
        <div className="space-y-2">
          <Label className="text-sm">Vista previa de respuesta</Label>
          <div className="rounded-lg bg-background p-4">
            <p className="text-sm">
              {tone < 50
                ? "Estimado cliente, agradecemos su consulta. En relación a su pregunta..."
                : tone < 80
                ? "¡Hola! Gracias por contactarnos. Respecto a tu pregunta..."
                : "¡Hey! 👋 ¡Genial que nos escribas! Sobre lo que preguntas..."}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}