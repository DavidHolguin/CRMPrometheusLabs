import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRound, MessagesSquare } from "lucide-react";

interface PersonalityTabProps {
  value: {
    personality: string;
    communication_tone: string;
  };
  onChange: (value: PersonalityTabProps["value"]) => void;
}

export function PersonalityTab({ value, onChange }: PersonalityTabProps) {
  const handleChange = (field: string, newValue: string) => {
    onChange({
      ...value,
      [field]: newValue,
    });
  };

  // Opciones predefinidas de tonos de comunicación
  const toneOptions = [
    { value: "profesional", label: "Profesional" },
    { value: "amigable", label: "Amigable y cálido" },
    { value: "entusiasta", label: "Entusiasta" },
    { value: "formal", label: "Formal y respetuoso" },
    { value: "casual", label: "Casual e informal" },
    { value: "tecnico", label: "Técnico y preciso" },
    { value: "consultivo", label: "Consultivo" },
    { value: "educativo", label: "Educativo e instructivo" },
    { value: "persuasivo", label: "Persuasivo" },
    { value: "personalizado", label: "Personalizado (definir en instrucciones)" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="mt-1 bg-primary/10 p-2 rounded-md">
              <UserRound className="text-primary h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-lg mb-1">Personalidad del chatbot</h3>
              <p className="text-sm text-muted-foreground">
                Define cómo se comportará y expresará tu chatbot al interactuar con los usuarios.
                Una personalidad bien definida ayuda a crear una experiencia más coherente y
                humana.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="personality">Personalidad y características</Label>
              <Textarea
                id="personality"
                placeholder="Describe la personalidad que quieres que tenga tu chatbot (ej: amigable, profesional, servicial, entusiasta...)"
                value={value.personality}
                onChange={(e) => handleChange("personality", e.target.value)}
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                Escribe los rasgos de personalidad, estilo y características que debe
                exhibir el chatbot en sus respuestas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="mt-1 bg-primary/10 p-2 rounded-md">
              <MessagesSquare className="text-primary h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-lg mb-1">Tono de comunicación</h3>
              <p className="text-sm text-muted-foreground">
                El tono influye en cómo perciben tus usuarios al chatbot. Selecciona el que mejor
                represente a tu marca.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="communication_tone">Tono principal</Label>
              <Select
                value={value.communication_tone || ""}
                onValueChange={(newValue) =>
                  handleChange("communication_tone", newValue)
                }
              >
                <SelectTrigger id="communication_tone">
                  <SelectValue placeholder="Selecciona un tono de comunicación" />
                </SelectTrigger>
                <SelectContent>
                  {toneOptions.map((tone) => (
                    <SelectItem key={tone.value} value={tone.value}>
                      {tone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone_details">Detalles sobre el tono</Label>
              <Textarea
                id="tone_details"
                placeholder="Proporciona más detalles sobre el tono que quieres que utilice tu chatbot..."
                value={
                  value.communication_tone === "personalizado"
                    ? value.communication_tone
                    : ""
                }
                onChange={(e) =>
                  handleChange(
                    "communication_tone",
                    value.communication_tone === "personalizado"
                      ? e.target.value
                      : value.communication_tone
                  )
                }
                disabled={value.communication_tone !== "personalizado"}
                className="min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground">
                Si seleccionaste "Personalizado", describe aquí el tono específico que deseas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">Consejos para definir la personalidad</h4>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Sea consistente:</span>{" "}
              La personalidad debe mantenerse uniforme durante toda la conversación.
            </li>
            <li>
              <span className="font-medium text-foreground">Alinee con su marca:</span>{" "}
              Asegúrese de que la personalidad refleje los valores y voz de su marca.
            </li>
            <li>
              <span className="font-medium text-foreground">Sea específico:</span>{" "}
              Cuanto más detallada sea la descripción, más preciso será el comportamiento del chatbot.
            </li>
            <li>
              <span className="font-medium text-foreground">Considere a su audiencia:</span>{" "}
              Adapte la personalidad al tipo de usuario que interactuará con el chatbot.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}