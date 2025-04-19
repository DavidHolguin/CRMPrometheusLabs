import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TagsInput } from "@/components/ui/tags-input";

interface KeyPointsTabProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function KeyPointsTab({ value, onChange }: KeyPointsTabProps) {
  const [newPoint, setNewPoint] = useState("");

  const handleAddPoint = () => {
    if (!newPoint.trim()) return;
    
    onChange([...value, newPoint.trim()]);
    setNewPoint("");
  };

  const handleRemovePoint = (index: number) => {
    const newPoints = [...value];
    newPoints.splice(index, 1);
    onChange(newPoints);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="mt-1 bg-primary/10 p-2 rounded-md">
              <Lightbulb className="text-primary h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-lg mb-1">Puntos clave</h3>
              <p className="text-sm text-muted-foreground">
                Define aspectos importantes que el chatbot debe recordar constantemente durante una conversación.
                Estos puntos ayudarán al chatbot a dar respuestas más precisas y enfocadas.
              </p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="key_points_tags">Puntos clave actuales</Label>
              <TagsInput 
                value={value} 
                onChange={onChange}
                placeholder="Presiona Enter para agregar..."
                maxTags={15}
              />
              <p className="text-xs text-muted-foreground">
                Escribe cada punto y presiona Enter para agregar. Puedes eliminarlos haciendo clic en la X.
              </p>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="new_point">Agregar punto clave detallado</Label>
              <div className="flex gap-2">
                <Textarea
                  id="new_point"
                  placeholder="Escribe un punto clave detallado que el chatbot deba recordar..."
                  value={newPoint}
                  onChange={(e) => setNewPoint(e.target.value)}
                  className="flex-1 min-h-[100px]"
                />
              </div>
              <div className="flex justify-end">
                <Button 
                  size="sm"
                  onClick={handleAddPoint}
                  disabled={!newPoint.trim()}
                >
                  <Plus size={16} className="mr-2" />
                  Agregar punto
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium mb-3">Puntos clave activos ({value.length})</h4>
          
          {value.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed rounded-md bg-muted/20">
              <Lightbulb className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-muted-foreground">No hay puntos clave definidos</p>
              <p className="text-xs text-muted-foreground mt-1">
                Agrega puntos clave para mejorar la precisión de las respuestas del chatbot
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {value.map((point, index) => (
                <li key={index} className="flex items-start gap-2 p-3 bg-muted/20 rounded-md">
                  <div className="flex-1">
                    <p className="text-sm">{point}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleRemovePoint(index)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={15} />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">Ejemplos de puntos clave efectivos:</h4>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Características únicas:</span>{" "}
              "Nuestro producto X es el único en el mercado con tecnología Y"
            </li>
            <li>
              <span className="font-medium text-foreground">Políticas importantes:</span>{" "}
              "Todas las devoluciones deben procesarse dentro de los 30 días posteriores a la compra"
            </li>
            <li>
              <span className="font-medium text-foreground">Ventajas competitivas:</span>{" "}
              "Ofrecemos envío gratuito en todos los pedidos, sin mínimo de compra"
            </li>
            <li>
              <span className="font-medium text-foreground">Condiciones especiales:</span>{" "}
              "Los descuentos para estudiantes requieren la verificación con una identificación válida"
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}