import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Search, CalendarDays, Star } from "lucide-react";
import { Lead } from "@/hooks/useLeads";
import { Conversation } from "@/hooks/useConversations";
import { useEvaluaciones } from "@/hooks/useEvaluaciones";

interface LeadConversationsListProps {
  leads: Lead[];
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  selectedConversationId: string | null;
  filterStatus: string;
}

export function LeadConversationsList({
  leads,
  conversations,
  onSelectConversation,
  selectedConversationId,
  filterStatus
}: LeadConversationsListProps) {
  const { obtenerEvaluaciones, isLoading: isLoadingEvaluaciones } = useEvaluaciones();
  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [evaluacionesCargadas, setEvaluacionesCargadas] = useState<Record<string, boolean>>({});

  // Cargar evaluaciones solo para la conversación seleccionada
  useEffect(() => {
    if (!selectedConversationId) return;
    
    // Si ya cargamos las evaluaciones de esta conversación, no volvemos a cargar
    if (evaluacionesCargadas[selectedConversationId]) return;
    
    const loadSelectedEvaluacion = async () => {
      try {
        setIsLoading(true);
        const evaluacionesData = await obtenerEvaluaciones(selectedConversationId);
        
        // Agregar las nuevas evaluaciones sin perder las anteriores
        setEvaluaciones(prev => {
          // Filtrar evaluaciones existentes para esta conversación
          const filtradas = prev.filter(ev => ev.mensaje_id !== selectedConversationId);
          return [...filtradas, ...evaluacionesData];
        });
        
        // Marcar como cargada
        setEvaluacionesCargadas(prev => ({
          ...prev,
          [selectedConversationId]: true
        }));
      } catch (error) {
        console.error("Error al cargar evaluaciones:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSelectedEvaluacion();
  }, [selectedConversationId, obtenerEvaluaciones, evaluacionesCargadas]);
  
  // Para mostrar badges de "Evaluado" sin cargar todas las evaluaciones,
  // cargamos evaluaciones en lotes pequeños al inicializar
  useEffect(() => {
    const loadEvaluacionesEnLotes = async () => {
      if (conversations.length === 0) return;
      
      setIsLoading(true);
      
      // Procesar en lotes de 5 para evitar sobrecarga
      const loteSize = 5;
      const conversationsToProcess = conversations.filter(
        conv => !evaluacionesCargadas[conv.id]
      );
      
      // Procesar solo los primeros conversationsToShow (visible ones)
      const visibleConversations = conversationsToProcess.slice(0, 10);
      
      for (let i = 0; i < visibleConversations.length; i += loteSize) {
        const lote = visibleConversations.slice(i, i + loteSize);
        
        try {
          // Procesar un lote a la vez, no en paralelo
          const resultados = await Promise.all(
            lote.map(conv => obtenerEvaluaciones(conv.id))
          );
          
          // Actualizar evaluaciones
          const nuevasEvaluaciones = resultados.flat();
          setEvaluaciones(prev => [...prev, ...nuevasEvaluaciones]);
          
          // Actualizar el estado de carga
          const nuevasCargadas = {};
          lote.forEach(conv => {
            nuevasCargadas[conv.id] = true;
          });
          
          setEvaluacionesCargadas(prev => ({
            ...prev,
            ...nuevasCargadas
          }));
          
          // Pequeña pausa entre lotes para no sobrecargar la API
          if (i + loteSize < visibleConversations.length) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        } catch (error) {
          console.error(`Error al cargar lote de evaluaciones (${i}-${i + loteSize}):`, error);
        }
      }
      
      setIsLoading(false);
    };
    
    loadEvaluacionesEnLotes();
  }, [conversations, obtenerEvaluaciones]);
  
  const filteredConversations = conversations.filter(conv => {
    const hasEvaluation = evaluaciones?.some(evaluation => evaluation.mensaje_id === conv.id);
    
    if (filterStatus === 'rated') {
      return hasEvaluation;
    } else if (filterStatus === 'unrated') {
      return !hasEvaluation;
    }
    
    return true;
  });

  const isLoadingAny = isLoading || isLoadingEvaluaciones;

  if (isLoadingAny && filteredConversations.length === 0) {
    return <div className="flex items-center justify-center h-32">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-2">
      {isLoadingAny && (
        <div className="flex items-center justify-center py-2">
          <div className="text-xs text-muted-foreground">Cargando evaluaciones...</div>
        </div>
      )}
      
      {filteredConversations.map((conversation) => {
        const lead = leads.find((l) => l.id === conversation.lead_id);
        if (!lead) return null;

        const hasEvaluation = evaluaciones?.some(evaluation => evaluation.mensaje_id === conversation.id);
        const evaluacionesCount = evaluaciones?.filter(evaluacion => evaluacion.mensaje_id === conversation.id).length || 0;

        return (
          <button
            key={conversation.id}
            className={`w-full text-left p-3 rounded-lg transition-colors ${
              selectedConversationId === conversation.id
                ? "bg-primary/10"
                : "hover:bg-secondary"
            }`}
            onClick={() => onSelectConversation(conversation.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-medium">
                  {lead.nombre} {lead.apellido}
                </span>
                <span className="text-xs text-muted-foreground">
                  {evaluacionesCargadas[conversation.id] 
                    ? `${evaluacionesCount} evaluaciones` 
                    : "Cargando..."}
                </span>
              </div>
              {hasEvaluation && (
                <div className="h-2 w-2 rounded-full bg-green-500" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}