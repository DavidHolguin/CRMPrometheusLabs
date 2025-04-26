import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, FileText, CheckCircle, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Example {
  id: string;
  type: 'positive' | 'negative';
  text: string;
}

interface AgenteGoalsExamplesProps {
  onDataChange: (data: {
    objectives: string;
    keyPoints: string[];
    examples: Example[];
  }) => void;
  initialData?: {
    objectives: string;
    keyPoints: string[];
    examples: Example[];
  };
}

export function AgenteGoalsExamples({ onDataChange, initialData }: AgenteGoalsExamplesProps) {
  const [objectives, setObjectives] = useState(initialData?.objectives || '');
  const [keyPoints, setKeyPoints] = useState<string[]>(initialData?.keyPoints || []);
  const [examples, setExamples] = useState<Example[]>(initialData?.examples || []);
  const [newKeyPoint, setNewKeyPoint] = useState('');
  const [newExample, setNewExample] = useState('');
  const [exampleType, setExampleType] = useState<'positive' | 'negative'>('positive');

  const updateData = (
    updatedObjectives?: string, 
    updatedKeyPoints?: string[], 
    updatedExamples?: Example[]
  ) => {
    const newData = {
      objectives: updatedObjectives !== undefined ? updatedObjectives : objectives,
      keyPoints: updatedKeyPoints !== undefined ? updatedKeyPoints : keyPoints,
      examples: updatedExamples !== undefined ? updatedExamples : examples
    };
    
    onDataChange(newData);
  };

  const handleObjectivesChange = (value: string) => {
    setObjectives(value);
    updateData(value);
  };

  const addKeyPoint = () => {
    if (!newKeyPoint.trim()) return;
    
    const updatedKeyPoints = [...keyPoints, newKeyPoint.trim()];
    setKeyPoints(updatedKeyPoints);
    setNewKeyPoint('');
    updateData(undefined, updatedKeyPoints);
  };

  const removeKeyPoint = (index: number) => {
    const updatedKeyPoints = keyPoints.filter((_, i) => i !== index);
    setKeyPoints(updatedKeyPoints);
    updateData(undefined, updatedKeyPoints);
  };

  const addExample = () => {
    if (!newExample.trim()) return;
    
    const newItem: Example = {
      id: Math.random().toString(36).substr(2, 9),
      type: exampleType,
      text: newExample.trim()
    };
    
    const updatedExamples = [...examples, newItem];
    setExamples(updatedExamples);
    setNewExample('');
    updateData(undefined, undefined, updatedExamples);
  };

  const removeExample = (id: string) => {
    const updatedExamples = examples.filter(example => example.id !== id);
    setExamples(updatedExamples);
    updateData(undefined, undefined, updatedExamples);
  };

  return (
    <div className="space-y-8">
      {/* Encabezado con descripción */}
      <div>
        <h3 className="text-lg font-medium mb-2">Objetivos y ejemplos</h3>
        <p className="text-sm text-muted-foreground">
          Define los objetivos claros y proporciona ejemplos para mejorar la precisión del agente
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          {/* Objetivos del agente */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Objetivos del agente</h4>
            <Textarea 
              placeholder="Describe los principales objetivos del agente. Por ejemplo: Asistir a clientes con consultas sobre productos, resolver problemas técnicos comunes, etc."
              value={objectives}
              onChange={(e) => handleObjectivesChange(e.target.value)}
              className="min-h-[150px]"
            />
          </div>

          {/* Puntos clave */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Puntos clave</h4>
            <div className="flex items-center gap-2">
              <Input
                value={newKeyPoint}
                onChange={(e) => setNewKeyPoint(e.target.value)}
                placeholder="Añade un punto clave..."
                onKeyPress={(e) => e.key === 'Enter' && addKeyPoint()}
              />
              <Button 
                size="icon" 
                onClick={addKeyPoint}
                disabled={!newKeyPoint.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {keyPoints.length > 0 ? (
              <div className="border rounded-md p-4 space-y-2">
                {keyPoints.map((point, index) => (
                  <div key={index} className="flex items-start justify-between group">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-1" />
                      <p className="text-sm">{point}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeKeyPoint(index)}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aún no hay puntos clave definidos
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6 lg:pl-6">
          {/* Ejemplos */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Ejemplos positivos y negativos</h4>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Textarea 
                      placeholder="Añade un ejemplo de interacción..."
                      value={newExample}
                      onChange={(e) => setNewExample(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button 
                      size="sm"
                      variant={exampleType === 'positive' ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => setExampleType('positive')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Positivo
                    </Button>
                    <Button 
                      size="sm"
                      variant={exampleType === 'negative' ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => setExampleType('negative')}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Negativo
                    </Button>
                    <Button
                      size="sm" 
                      className="w-full"
                      onClick={addExample}
                      disabled={!newExample.trim()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Añadir
                    </Button>
                  </div>
                </div>
              </div>

              {examples.length > 0 ? (
                <ScrollArea className="h-[300px] rounded-md border">
                  <div className="p-4 space-y-4">
                    {examples.map((example) => (
                      <Card key={example.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <Badge
                              variant={example.type === 'positive' ? 'default' : 'destructive'}
                              className="mb-2"
                            >
                              {example.type === 'positive' ? 'Ejemplo positivo' : 'Ejemplo negativo'}
                            </Badge>
                            <p className="text-sm">{example.text}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeExample(example.id)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aún no hay ejemplos añadidos
                </p>
              )}
            </div>
          </div>

          {/* Consejos */}
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Consejos para ejemplos efectivos</h4>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>
                  <span className="font-medium text-foreground">Sé específico:</span>{" "}
                  Usa escenarios reales y detallados
                </li>
                <li>
                  <span className="font-medium text-foreground">Incluye contexto:</span>{" "}
                  Proporciona suficiente información para entender el escenario
                </li>
                <li>
                  <span className="font-medium text-foreground">Diversidad:</span>{" "}
                  Incluye diferentes tipos de situaciones y consultas
                </li>
                <li>
                  <span className="font-medium text-foreground">Ejemplos negativos:</span>{" "}
                  Muestra lo que el agente debe evitar hacer o decir
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}