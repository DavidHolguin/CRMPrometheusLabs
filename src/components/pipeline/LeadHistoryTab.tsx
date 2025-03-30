
import { useState, useEffect } from "react";
import { Lead } from "@/hooks/useLeads";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, ArrowRightLeft, User, Calendar, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LeadHistoryEvent {
  id: string;
  created_at: string;
  usuario?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    email: string;
  };
  campo?: string;
  valor_anterior?: string;
  valor_nuevo?: string;
  tiempo_en_stage?: string;
  stage_anterior?: {
    id: string;
    nombre: string;
    color: string;
  };
  stage_nuevo?: {
    id: string;
    nombre: string;
    color: string;
  };
  type: 'field_change' | 'stage_change';
}

interface LeadHistoryTabProps {
  lead: Lead;
  formatDate: (dateStr: string | null) => string;
}

export function LeadHistoryTab({ lead, formatDate }: LeadHistoryTabProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<LeadHistoryEvent[]>([]);
  
  useEffect(() => {
    fetchHistory();
  }, [lead.id]);
  
  const fetchHistory = async () => {
    setIsLoading(true);
    
    try {
      // Fetch field changes
      const { data: fieldChanges, error: fieldError } = await supabase
        .from("lead_history")
        .select(`
          id,
          created_at,
          campo,
          valor_anterior,
          valor_nuevo,
          usuario_id,
          profiles:usuario_id(id, full_name, avatar_url, email)
        `)
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false });
      
      // Fetch stage changes
      const { data: stageChanges, error: stageError } = await supabase
        .from("lead_stage_history")
        .select(`
          id,
          created_at,
          tiempo_en_stage,
          usuario_id,
          anterior:stage_id_anterior(id, nombre, color),
          nuevo:stage_id_nuevo(id, nombre, color),
          profiles:usuario_id(id, full_name, avatar_url, email)
        `)
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false });
      
      if (fieldError) console.error("Error fetching field history:", fieldError);
      if (stageError) console.error("Error fetching stage history:", stageError);
      
      // Format and combine the history events
      const formattedFieldChanges = (fieldChanges || []).map(item => ({
        id: item.id,
        created_at: item.created_at,
        usuario: item.profiles,
        campo: item.campo,
        valor_anterior: item.valor_anterior,
        valor_nuevo: item.valor_nuevo,
        type: 'field_change' as const
      }));
      
      const formattedStageChanges = (stageChanges || []).map(item => ({
        id: item.id,
        created_at: item.created_at,
        usuario: item.profiles,
        tiempo_en_stage: item.tiempo_en_stage,
        stage_anterior: item.anterior,
        stage_nuevo: item.nuevo,
        type: 'stage_change' as const
      }));
      
      // Combine and sort all events by date
      const allEvents = [...formattedFieldChanges, ...formattedStageChanges]
        .sort((a, b) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      
      setHistory(allEvents);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getEventIcon = (event: LeadHistoryEvent) => {
    if (event.type === 'stage_change') {
      return <ArrowRightLeft className="h-5 w-5 text-blue-500" />;
    }
    
    switch (event.campo) {
      case 'nombre':
      case 'apellido':
      case 'email':
      case 'telefono':
        return <User className="h-5 w-5 text-indigo-500" />;
      case 'asignado_a':
        return <User className="h-5 w-5 text-purple-500" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const getEventContent = (event: LeadHistoryEvent) => {
    if (event.type === 'stage_change') {
      const anteriorNombre = event.stage_anterior?.nombre || "Sin etapa";
      const nuevoNombre = event.stage_nuevo?.nombre || "Sin etapa";
      const stageColor = event.stage_nuevo?.color || "#cccccc";
      
      return (
        <div className="flex flex-col">
          <div className="font-medium">
            Cambio de etapa
          </div>
          <div className="flex items-center mt-1">
            <Badge variant="outline" className="mr-2">
              {anteriorNombre}
            </Badge>
            <ArrowRightLeft className="h-4 w-4 mx-1" />
            <Badge 
              variant="outline" 
              className="font-medium" 
              style={{ backgroundColor: `${stageColor}20`, borderColor: stageColor }}
            >
              {nuevoNombre}
            </Badge>
          </div>
          {event.tiempo_en_stage && (
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Tiempo en etapa anterior: {event.tiempo_en_stage.replace(/\.\d+$/, '').replace(/^(\d+):(\d+):(\d+)$/, '$1h $2m $3s')}
            </div>
          )}
        </div>
      );
    }
    
    // Field change
    let fieldName = event.campo || "";
    let readableField = fieldName;
    
    switch (fieldName) {
      case 'nombre': readableField = "Nombre"; break;
      case 'apellido': readableField = "Apellido"; break;
      case 'email': readableField = "Email"; break;
      case 'telefono': readableField = "Teléfono"; break;
      case 'asignado_a': readableField = "Asignación"; break;
      case 'score': readableField = "Puntuación"; break;
      default: readableField = fieldName;
    }
    
    return (
      <div className="flex flex-col">
        <div className="font-medium">
          Cambio en {readableField}
        </div>
        <div className="flex flex-col text-sm mt-1">
          <div className="line-through text-muted-foreground">
            {event.valor_anterior || "(vacío)"}
          </div>
          <div className="font-medium">
            {event.valor_nuevo || "(vacío)"}
          </div>
        </div>
      </div>
    );
  };
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Historial de Cambios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No hay historial de cambios para este lead
          </div>
        ) : (
          <div className="relative space-y-4">
            {history.map((event, index) => (
              <div key={event.id} className="flex items-start gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={event.usuario?.avatar_url || ""} />
                  <AvatarFallback>{event.usuario?.full_name ? getInitials(event.usuario.full_name) : "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-sm">
                      {event.usuario?.full_name || "Usuario del sistema"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(event.created_at)}
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-md p-2 bg-muted/50">
                    <div className="mt-0.5">
                      {getEventIcon(event)}
                    </div>
                    <div className="flex-1">
                      {getEventContent(event)}
                    </div>
                  </div>
                  {event.usuario?.email && (
                    <div className="text-xs text-muted-foreground">
                      {event.usuario.email}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
