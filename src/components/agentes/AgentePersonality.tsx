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
import { Button } from "@/components/ui/button";

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
    <div className="space-y-8">
      {/* Presets de personalidad */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-medium">Personalidad predefinida</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="rounded-full h-5 w-5 bg-muted flex items-center justify-center cursor-help">
                  <span className="text-xs text-muted-foreground">?</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">Selecciona una personalidad base y ajústala según tus necesidades</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

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
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          {/* Control de tono */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Tono de comunicación</Label>
              <span className="text-sm font-medium">
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
            <div className="flex items-center justify-between">
              <Label>Instrucciones personalizadas</Label>
              <div className="flex items-center gap-2">
                {variables.map((variable) => (
                  <TooltipProvider key={variable.name}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => insertVariable(variable.name)}
                          className="h-7 px-2 text-xs"
                        >
                          {variable.name}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{variable.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
            <Textarea
              name="instructions"
              value={instructions}
              onChange={(e) => handleInstructionsChange(e.target.value)}
              placeholder="Escribe las instrucciones detalladas para tu agente..."
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
        </div>

        <div className="lg:pl-6">
          {/* Recomendaciones */}
          <Card className="bg-muted/50 border-dashed mb-6">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Consejos para definir la personalidad</h4>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>
                  <span className="font-medium text-foreground">Sea consistente:</span>{" "}
                  La personalidad debe mantenerse uniforme durante toda la conversación
                </li>
                <li>
                  <span className="font-medium text-foreground">Alinee con su marca:</span>{" "}
                  La personalidad debe reflejar los valores y voz de su marca
                </li>
                <li>
                  <span className="font-medium text-foreground">Sea específico:</span>{" "}
                  Cuanto más detallada sea la descripción, más preciso será el comportamiento
                </li>
                <li>
                  <span className="font-medium text-foreground">Use variables:</span>{" "}
                  Personaliza las respuestas usando las variables disponibles
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="sticky top-6">
            <CardContent className="p-6">
              <h4 className="font-medium mb-4">Vista previa de respuestas</h4>
              <div className="space-y-4">
                <div className="bg-background rounded-lg p-4 border">
                  <p className="text-sm mb-2 text-muted-foreground">Saludo inicial:</p>
                  <p className="text-sm">
                    {tone < 50
                      ? "Estimado cliente, bienvenido. ¿En qué puedo ayudarle hoy?"
                      : tone < 80
                      ? "¡Hola! Gracias por contactarnos. ¿En qué puedo ayudarte?"
                      : "¡Hey! 👋 ¡Qué gusto saludarte! ¿Cómo puedo ayudarte hoy?"}
                  </p>
                </div>

                <div className="bg-background rounded-lg p-4 border">
                  <p className="text-sm mb-2 text-muted-foreground">Respuesta a consulta:</p>
                  <p className="text-sm">
                    {tone < 50
                      ? "Comprendo su consulta. Permítame proporcionarle la información pertinente..."
                      : tone < 80
                      ? "Entiendo lo que necesitas. Déjame ayudarte con esa información..."
                      : "¡Claro! Te ayudo con eso enseguida... 😊"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}