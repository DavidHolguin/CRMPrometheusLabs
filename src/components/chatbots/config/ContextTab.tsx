import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpenText, Target, Bot, Sparkles } from "lucide-react";

interface ContextTabProps {
  value: {
    main_purpose: string;
    welcome_message: string;
    general_context: string;
    special_instructions: string;
  };
  onChange: (value: ContextTabProps["value"]) => void;
}

export function ContextTab({ value, onChange }: ContextTabProps) {
  const handleChange = (field: string, newValue: string) => {
    onChange({
      ...value,
      [field]: newValue,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="mt-1 bg-primary/10 p-2 rounded-md">
              <Target className="text-primary h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-lg mb-1">Propósito principal</h3>
              <p className="text-sm text-muted-foreground">
                Define el objetivo principal y la función de tu chatbot.
                Esto ayuda al modelo a entender para qué se utilizará principalmente.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="main_purpose">¿Cuál es el propósito principal del chatbot?</Label>
            <Textarea
              id="main_purpose"
              placeholder="Ej: Atender consultas sobre productos, reservar citas, proporcionar información sobre eventos..."
              value={value.main_purpose}
              onChange={(e) => handleChange("main_purpose", e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="mt-1 bg-primary/10 p-2 rounded-md">
              <Bot className="text-primary h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-lg mb-1">Mensaje de bienvenida</h3>
              <p className="text-sm text-muted-foreground">
                Configura el primer mensaje que mostrará el chatbot cuando un usuario inicie la conversación.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="welcome_message">Mensaje de bienvenida</Label>
            <Textarea
              id="welcome_message"
              placeholder="Ej: ¡Hola! Soy el asistente virtual de [Empresa]. ¿En qué puedo ayudarte hoy?"
              value={value.welcome_message}
              onChange={(e) => handleChange("welcome_message", e.target.value)}
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              Este será el primer mensaje que verán tus usuarios. Hazlo amigable y claro.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="mt-1 bg-primary/10 p-2 rounded-md">
              <BookOpenText className="text-primary h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-lg mb-1">Contexto general</h3>
              <p className="text-sm text-muted-foreground">
                Proporciona información de fondo que el chatbot debe conocer para responder con precisión.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="general_context">Contexto y conocimiento base</Label>
            <Textarea
              id="general_context"
              placeholder="Describe información sobre tu empresa, productos, servicios o cualquier dato relevante que el chatbot deba conocer..."
              value={value.general_context}
              onChange={(e) => handleChange("general_context", e.target.value)}
              className="min-h-[150px]"
            />
            <p className="text-xs text-muted-foreground">
              Incluye información sobre tu empresa, productos, servicios, políticas o cualquier conocimiento específico que el chatbot deba tener.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="mt-1 bg-primary/10 p-2 rounded-md">
              <Sparkles className="text-primary h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-lg mb-1">Instrucciones especiales</h3>
              <p className="text-sm text-muted-foreground">
                Indica cualquier instrucción específica que deba seguir el chatbot, como restricciones, limitaciones o comportamientos especiales.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="special_instructions">Instrucciones y restricciones</Label>
            <Textarea
              id="special_instructions"
              placeholder="Ej: No proporcionar precios específicos, derivar consultas técnicas complejas a soporte, mantener un enfoque amigable incluso ante críticas..."
              value={value.special_instructions}
              onChange={(e) => handleChange("special_instructions", e.target.value)}
              className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              Especifica cualquier comportamiento especial, límites de conocimiento o reglas que deba seguir el chatbot.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">Consejos para un buen contexto</h4>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Sea específico:</span>{" "}
              Proporciona detalles concretos sobre tu empresa y servicios.
            </li>
            <li>
              <span className="font-medium text-foreground">Priorice la información:</span>{" "}
              Coloque primero los datos más importantes que el chatbot debe conocer.
            </li>
            <li>
              <span className="font-medium text-foreground">Establezca límites claros:</span>{" "}
              Defina lo que el chatbot NO debe hacer o decir.
            </li>
            <li>
              <span className="font-medium text-foreground">Actualice regularmente:</span>{" "}
              Mantenga el contexto actualizado con la información más reciente.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}