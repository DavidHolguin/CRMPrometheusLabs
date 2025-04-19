import { Card, CardContent } from "@/components/ui/card";
import { FileQuestion } from "lucide-react";
import { QAExampleInput, QAExample } from "@/components/chatbots/QAExampleInput";

interface QATabProps {
  value: QAExample[];
  onChange: (value: QAExample[]) => void;
}

export function QATab({ value, onChange }: QATabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="mt-1 bg-primary/10 p-2 rounded-md">
              <FileQuestion className="text-primary h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-lg mb-1">Ejemplos de preguntas y respuestas</h3>
              <p className="text-sm text-muted-foreground">
                Define ejemplos de preguntas frecuentes con sus respuestas ideales. Esto ayuda al chatbot a 
                entender el tipo de respuestas que debe proporcionar y mejora su precisión ante preguntas similares.
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            <QAExampleInput 
              value={value} 
              onChange={onChange} 
              maxExamples={10}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">Consejos para crear buenos ejemplos Q&A:</h4>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Preguntas reales:</span>{" "}
              Incluye preguntas que los clientes hacen frecuentemente
            </li>
            <li>
              <span className="font-medium text-foreground">Respuestas completas:</span>{" "}
              Proporciona respuestas detalladas y precisas que resuelvan la consulta
            </li>
            <li>
              <span className="font-medium text-foreground">Variedad de temas:</span>{" "}
              Abarca diferentes áreas de consulta para entrenar al chatbot en diversos temas
            </li>
            <li>
              <span className="font-medium text-foreground">Tono consistente:</span>{" "}
              Mantén el mismo estilo y tono en todas las respuestas de ejemplo
            </li>
            <li>
              <span className="font-medium text-foreground">Incluye variaciones:</span>{" "}
              Agrega diferentes formas de preguntar lo mismo para mejorar la comprensión
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}