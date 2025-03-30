
import { useState, useEffect } from "react";
import { Lead } from "@/hooks/useLeads";
import { Clock, MessageSquare, ArrowRight, Edit, Plus, User, Check, X, Calendar, PhoneCall, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface LeadHistoryTabProps {
  lead: Lead;
  formatDate: (dateStr: string | null) => string;
}

interface HistoryEvent {
  id: string | number;
  type: string;
  date: string | null;
  description: string;
  icon: JSX.Element;
  details?: string;
  color?: string;
}

export function LeadHistoryTab({ lead, formatDate }: LeadHistoryTabProps) {
  const [historyEvents, setHistoryEvents] = useState<HistoryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (lead.id) {
      fetchHistoryData();
    }
  }, [lead.id]);

  const fetchHistoryData = async () => {
    setIsLoading(true);
    try {
      // Fetch lead history from database
      const { data: historyData, error: historyError } = await supabase
        .from("lead_history")
        .select("*")
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false });
        
      if (historyError) throw historyError;
      
      // Fetch stage history from database
      const { data: stageHistory, error: stageError } = await supabase
        .from("lead_stage_history")
        .select(`
          *,
          stage_anterior:stage_id_anterior(nombre, color),
          stage_nuevo:stage_id_nuevo(nombre, color)
        `)
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false });
        
      if (stageError) throw stageError;
      
      // Fetch interactions from database (for message history)
      const { data: interactions, error: interactionsError } = await supabase
        .from("lead_interactions")
        .select(`
          *,
          lead_interaction_types (nombre, color)
        `)
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false });
        
      if (interactionsError) throw interactionsError;
      
      // Combine and transform all history items
      const combinedHistory: HistoryEvent[] = [];
      
      // Add lead creation event
      combinedHistory.push({
        id: "creation",
        type: "created",
        date: lead.created_at,
        description: "Lead creado en el sistema",
        icon: <Plus size={16} className="text-green-500" />,
        color: "bg-green-500"
      });
      
      // Add field change history events
      if (historyData) {
        historyData.forEach(item => {
          let description = `Campo "${item.campo}" actualizado`;
          
          // Format specific fields differently
          switch(item.campo) {
            case "nombre":
              description = `Nombre cambiado de "${item.valor_anterior || 'no definido'}" a "${item.valor_nuevo || 'no definido'}"`;
              break;
            case "email":
              description = `Email cambiado de "${item.valor_anterior || 'no definido'}" a "${item.valor_nuevo || 'no definido'}"`;
              break;
            case "telefono":
              description = `Teléfono cambiado de "${item.valor_anterior || 'no definido'}" a "${item.valor_nuevo || 'no definido'}"`;
              break;
            case "asignado_a":
              description = `Lead asignado a ${item.valor_nuevo || 'ningún usuario'}`;
              break;
            case "score":
              description = `Puntuación cambiada de ${item.valor_anterior || '0'} a ${item.valor_nuevo || '0'}`;
              break;
            default:
              description = `Campo "${item.campo}" actualizado de "${item.valor_anterior || 'no definido'}" a "${item.valor_nuevo || 'no definido'}"`;
          }
          
          combinedHistory.push({
            id: item.id,
            type: "field_update",
            date: item.created_at,
            description: description,
            icon: <Edit size={16} className="text-blue-500" />,
            color: "bg-blue-500"
          });
        });
      }
      
      // Add stage change history events
      if (stageHistory) {
        stageHistory.forEach(item => {
          const stageAnteriorNombre = item.stage_anterior?.nombre || "Sin etapa";
          const stageNuevoNombre = item.stage_nuevo?.nombre || "Sin etapa";
          const color = item.stage_nuevo?.color || "#6366f1";
          
          combinedHistory.push({
            id: item.id,
            type: "stage_change",
            date: item.created_at,
            description: `Movido de "${stageAnteriorNombre}" a "${stageNuevoNombre}"`,
            details: item.tiempo_en_stage ? `Tiempo en etapa anterior: ${formatStageTime(item.tiempo_en_stage)}` : undefined,
            icon: <ArrowRight size={16} style={{ color }} />,
            color: `bg-[${color}]`
          });
        });
      }
      
      // Add interaction events
      if (interactions) {
        interactions.forEach(item => {
          // Skip interactions that are already represented in other history items
          if (item.interaction_type_id) {
            const typeName = item.lead_interaction_types?.nombre || "Interacción";
            const color = item.lead_interaction_types?.color || "#cbd5e1";
            
            let icon;
            switch(typeName.toLowerCase()) {
              case "mensaje enviado":
              case "mensaje recibido":
                icon = <MessageSquare size={16} style={{ color }} />;
                break;
              case "llamada":
                icon = <PhoneCall size={16} style={{ color }} />;
                break;
              case "email":
                icon = <Mail size={16} style={{ color }} />;
                break;
              case "reunión":
                icon = <Calendar size={16} style={{ color }} />;
                break;
              default:
                icon = <Clock size={16} style={{ color }} />;
            }
            
            combinedHistory.push({
              id: item.id,
              type: "interaction",
              date: item.created_at,
              description: typeName,
              details: item.notas || undefined,
              icon: icon,
              color: `bg-[${color}]`
            });
          }
        });
      }
      
      // Sort by date (newest first)
      combinedHistory.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
      
      setHistoryEvents(combinedHistory);
    } catch (error) {
      console.error("Error fetching lead history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format stage time from interval
  const formatStageTime = (interval: string): string => {
    // Simple formatting for demonstration
    // In a real app, you would parse the Postgres interval format
    return interval.replace(/(\d+):(\d+):(\d+)/, "$1h $2m");
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return (
      <div className="py-2">
        <h3 className="text-sm font-medium mb-4">Historial de Actividad</h3>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-start p-4">
                  <Skeleton className="h-6 w-6 rounded-full mr-4" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-2">
      <h3 className="text-sm font-medium mb-4">Historial de Actividad</h3>

      {historyEvents.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          No hay actividad registrada para este lead
        </div>
      ) : (
        <motion.div 
          className="space-y-0" 
          variants={container}
          initial="hidden"
          animate="show"
        >
          {historyEvents.map((event, index) => (
            <motion.div key={event.id} variants={item} className="relative">
              {/* Timeline connector */}
              {index < historyEvents.length - 1 && (
                <div className="absolute left-3 top-6 w-0.5 h-full bg-muted z-0"></div>
              )}
              
              <div className="flex items-start mb-6 relative z-10">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full ${event.color || 'bg-primary'} flex-shrink-0`}>
                  {event.icon}
                </div>
                
                <Card className="ml-4 w-full shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium">{event.description}</h4>
                      <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {event.date ? formatDistanceToNow(new Date(event.date), {
                          addSuffix: true,
                          locale: es
                        }) : "Fecha desconocida"}
                      </div>
                    </div>
                    
                    {event.details && (
                      <div className="text-xs text-muted-foreground mt-1 border-t pt-1">
                        {event.details}
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDate(event.date)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
