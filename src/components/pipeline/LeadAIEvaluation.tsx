
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Sparkles, LineChart, Zap, MessageCircle, BrainCircuit } from "lucide-react";
import { Lead } from "@/hooks/useLeads";
import { cn } from "@/lib/utils";

type EvaluacionLLM = {
  id: number;
  lead_id: string;
  conversacion_id: string;
  mensaje_id?: string;
  fecha_evaluacion: string;
  score_potencial: number;
  score_satisfaccion: number;
  interes_productos: string[];
  comentario?: string;
  palabras_clave?: string[];
  llm_configuracion_id?: string;
  prompt_utilizado?: string;
  created_at: string;
};

interface LeadAIEvaluationProps {
  lead: Lead;
}

export function LeadAIEvaluation({ lead }: LeadAIEvaluationProps) {
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionLLM[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvaluaciones = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('evaluaciones_llm')
          .select('*')
          .eq('lead_id', lead.id)
          .order('fecha_evaluacion', { ascending: false });
        
        if (error) {
          console.error('Error al obtener evaluaciones:', error);
          return;
        }
        
        setEvaluaciones(data || []);
      } catch (error) {
        console.error('Error inesperado:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvaluaciones();
  }, [lead.id]);
  
  // Obtener la evaluación más reciente
  const ultimaEvaluacion = evaluaciones.length > 0 ? evaluaciones[0] : null;
  
  // Calcular promedio de potencial y satisfacción si hay evaluaciones
  const promedioScorePotencial = evaluaciones.length > 0 
    ? Math.round(evaluaciones.reduce((acc, eval_) => acc + eval_.score_potencial, 0) / evaluaciones.length) 
    : 0;
    
  const promedioScoreSatisfaccion = evaluaciones.length > 0 
    ? Math.round(evaluaciones.reduce((acc, eval_) => acc + eval_.score_satisfaccion, 0) / evaluaciones.length)
    : 0;
  
  // Obtener productos de interés únicos de todas las evaluaciones
  const productosInteres = evaluaciones.length > 0 
    ? [...new Set(evaluaciones.flatMap(eval_ => eval_.interes_productos || []))]
    : [];
  
  // Obtener palabras clave únicas
  const palabrasClave = evaluaciones.length > 0 
    ? [...new Set(evaluaciones.flatMap(eval_ => eval_.palabras_clave || []))]
    : [];
  
  // Función para obtener el color según el score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };
  
  // Función para obtener la clase de color del progreso según el score
  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  if (isLoading) {
    return (
      <div className="space-y-4 min-h-[300px] flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Cargando evaluaciones...</div>
      </div>
    );
  }

  if (evaluaciones.length === 0) {
    return (
      <div className="space-y-4 min-h-[300px] flex flex-col items-center justify-center p-4">
        <BrainCircuit className="text-muted-foreground h-12 w-12 mb-2" />
        <h3 className="text-lg font-medium">Sin evaluaciones IA</h3>
        <p className="text-muted-foreground text-center max-w-xs">
          Este lead aún no tiene evaluaciones de inteligencia artificial disponibles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Score de Potencial */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium flex items-center">
                <Zap className="h-4 w-4 mr-1 text-amber-500" />
                Potencial de Conversión
              </CardTitle>
              <span className={cn("text-xl font-bold", getScoreColor(promedioScorePotencial))}>
                {promedioScorePotencial}%
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative w-full">
              <Progress 
                value={promedioScorePotencial} 
                className="h-2"
              />
              <div 
                className={cn("absolute inset-0 h-full rounded-full", getProgressColor(promedioScorePotencial))}
                style={{ width: `${promedioScorePotencial}%` }}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Score de Satisfacción */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium flex items-center">
                <MessageCircle className="h-4 w-4 mr-1 text-blue-500" />
                Nivel de Satisfacción
              </CardTitle>
              <span className={cn("text-xl font-bold", getScoreColor(promedioScoreSatisfaccion))}>
                {promedioScoreSatisfaccion}%
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative w-full">
              <Progress 
                value={promedioScoreSatisfaccion}
                className="h-2"
              />
              <div 
                className={cn("absolute inset-0 h-full rounded-full", getProgressColor(promedioScoreSatisfaccion))}
                style={{ width: `${promedioScoreSatisfaccion}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Última evaluación */}
      {ultimaEvaluacion && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium flex items-center">
                <Sparkles className="h-4 w-4 mr-1 text-purple-500" />
                Análisis IA más reciente
              </CardTitle>
              <Badge variant="outline">
                {new Date(ultimaEvaluacion.fecha_evaluacion).toLocaleDateString()}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Basado en las últimas interacciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ultimaEvaluacion.comentario && (
              <div className="bg-muted/50 rounded-md p-3 text-sm italic">
                "{ultimaEvaluacion.comentario}"
              </div>
            )}
            
            {/* Productos de interés */}
            {productosInteres.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Posibles productos de interés:</p>
                <div className="flex flex-wrap gap-1">
                  {productosInteres.map((producto, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {producto}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Palabras clave detectadas */}
            {palabrasClave.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Palabras clave detectadas:</p>
                <div className="flex flex-wrap gap-1">
                  {palabrasClave.map((palabra, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {palabra}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Histórico de Evaluaciones */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <LineChart className="h-4 w-4 mr-1 text-green-500" />
            Evolución de Evaluaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground">
            {evaluaciones.length === 1 ? (
              <p>Solo hay una evaluación disponible hasta el momento.</p>
            ) : (
              <div className="space-y-2">
                {evaluaciones.slice(0, 3).map((evaluacion, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1 border-b border-border/40 last:border-0">
                    <span>{new Date(evaluacion.fecha_evaluacion).toLocaleDateString()}</span>
                    <div className="flex gap-2">
                      <span className={getScoreColor(evaluacion.score_potencial)}>
                        Pot: {evaluacion.score_potencial}%
                      </span>
                      <span className={getScoreColor(evaluacion.score_satisfaccion)}>
                        Sat: {evaluacion.score_satisfaccion}%
                      </span>
                    </div>
                  </div>
                ))}
                {evaluaciones.length > 3 && (
                  <p className="text-center text-muted-foreground pt-1">
                    + {evaluaciones.length - 3} evaluaciones más
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
