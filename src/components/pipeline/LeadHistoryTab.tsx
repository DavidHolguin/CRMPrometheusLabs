
import { Lead } from "@/hooks/useLeads";
import { Card, CardContent } from "@/components/ui/card";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import { Activity, ArrowDown, ArrowRight, ArrowUp, Clock, Edit, MessageCircle, Tag, User } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface HistoryEvent {
  id: string;
  lead_id: string;
  campo: string;
  valor_anterior: string | null;
  valor_nuevo: string | null;
  usuario_id: string | null;
  created_at: string;
  usuario_nombre?: string;
}

interface LeadHistoryTabProps {
  lead: Lead;
  formatDate: (date: string | null) => string;
}

export function LeadHistoryTab({ lead, formatDate }: LeadHistoryTabProps) {
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (lead.id) {
      fetchHistory();
    }
  }, [lead.id]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // Get lead history
      const { data: historyData, error: historyError } = await supabase
        .from("lead_history")
        .select("*")
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false });

      if (historyError) throw historyError;

      // Get user names
      const userIds = historyData
        .map((item) => item.usuario_id)
        .filter(Boolean) as string[];

      if (userIds.length > 0) {
        const { data: userData, error: userError } = await supabase
          .from("usuarios")
          .select("id, nombre, apellido")
          .in("id", userIds);

        if (userError) throw userError;

        // Map user names to history events
        const historyWithUsers = historyData.map((event) => {
          const user = userData?.find((u) => u.id === event.usuario_id);
          return {
            ...event,
            usuario_nombre: user
              ? `${user.nombre} ${user.apellido}`
              : "Usuario del sistema",
          };
        });

        setHistory(historyWithUsers);
      } else {
        setHistory(historyData);
      }
    } catch (error) {
      console.error("Error fetching lead history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (campo: string) => {
    switch (campo) {
      case "stage_id":
        return <ArrowRight className="h-4 w-4" />;
      case "score":
        return <Activity className="h-4 w-4" />;
      case "tags":
        return <Tag className="h-4 w-4" />;
      case "asignado_a":
        return <User className="h-4 w-4" />;
      case "message":
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <Edit className="h-4 w-4" />;
    }
  };

  const getEventTitle = (event: HistoryEvent) => {
    switch (event.campo) {
      case "stage_id":
        return "Cambio de etapa";
      case "score":
        return "Actualización de score";
      case "tags":
        return "Modificación de etiquetas";
      case "asignado_a":
        return "Reasignación de lead";
      case "message":
        return "Nuevo mensaje";
      default:
        return `Actualización de ${event.campo}`;
    }
  };

  const getEventDescription = (event: HistoryEvent) => {
    switch (event.campo) {
      case "stage_id":
        return (
          <div className="flex items-center gap-1">
            <span>{event.valor_anterior || "Sin etapa"}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span>{event.valor_nuevo || "Sin etapa"}</span>
          </div>
        );
      case "score": {
        const prevScore = Number(event.valor_anterior || 0);
        const newScore = Number(event.valor_nuevo || 0);
        const diff = newScore - prevScore;
        
        return (
          <div className="flex items-center gap-1">
            <span>{event.valor_anterior || "0"}</span>
            {diff > 0 ? (
              <ArrowUp className="h-3 w-3 text-green-500" />
            ) : diff < 0 ? (
              <ArrowDown className="h-3 w-3 text-red-500" />
            ) : (
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
            )}
            <span>{event.valor_nuevo || "0"}</span>
          </div>
        );
      }
      default:
        return (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {event.valor_anterior && <span>De: {event.valor_anterior}</span>}
            {event.valor_anterior && event.valor_nuevo && (
              <ArrowRight className="h-3 w-3" />
            )}
            {event.valor_nuevo && <span>A: {event.valor_nuevo}</span>}
            {!event.valor_anterior && !event.valor_nuevo && (
              <span>Sin detalles</span>
            )}
          </div>
        );
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-sm font-medium mb-4">Historial del Lead</h3>
        
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">
            Cargando historial...
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No hay registros de actividad para este lead</p>
          </div>
        ) : (
          <Timeline>
            {history.map((event) => (
              <TimelineItem key={event.id}>
                <TimelineItem.Indicator>
                  {getEventIcon(event.campo)}
                </TimelineItem.Indicator>
                
                <TimelineItem.Content>
                  <TimelineItem.Title>{getEventTitle(event)}</TimelineItem.Title>
                  <TimelineItem.Description>
                    {getEventDescription(event)}
                  </TimelineItem.Description>
                  
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{event.usuario_nombre || "Usuario del sistema"}</span>
                    <span>{formatDate(event.created_at)}</span>
                  </div>
                </TimelineItem.Content>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </CardContent>
    </Card>
  );
}
