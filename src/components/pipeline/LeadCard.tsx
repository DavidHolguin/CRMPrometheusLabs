
import { Lead } from "@/hooks/useLeads";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageSquare, User, Star, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LeadCardProps {
  lead: Lead;
  isDragging?: boolean;
}

export function LeadCard({ lead, isDragging }: LeadCardProps) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    try {
      return formatDistanceToNow(new Date(dateStr), { 
        addSuffix: true,
        locale: es
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Fecha inválida";
    }
  };

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-200 mb-2 w-full cursor-move", 
        isDragging 
          ? "opacity-80 shadow-lg ring-2 ring-primary ring-opacity-50 scale-[1.02] border-dashed" 
          : "hover:shadow-md hover:border-primary/30"
      )}
    >
      <CardHeader className="pb-2 pt-3">
        <div className="flex justify-between items-start">
          <div className="flex gap-2 items-center">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
              {lead.nombre ? lead.nombre.charAt(0) : "?"}
              {lead.apellido ? lead.apellido.charAt(0) : ""}
            </div>
            <div>
              <h3 className="font-semibold">
                {lead.nombre} {lead.apellido}
              </h3>
              <p className="text-xs text-muted-foreground">{lead.email || "Sin correo"}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-0 h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3 pt-0">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <Phone size={12} className="text-muted-foreground" />
            <span>{lead.telefono || "No disponible"}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare size={12} className="text-muted-foreground" />
            <span>{lead.message_count} msgs</span>
          </div>
          <div className="flex items-center gap-1">
            <User size={12} className="text-muted-foreground" />
            <span>{lead.interaction_count} int.</span>
          </div>
          <div className="flex items-center gap-1">
            <Star size={12} className="text-muted-foreground" />
            <span>{lead.score} pts</span>
          </div>
        </div>
        
        {expanded && (
          <div className="mt-3 border-t pt-2">
            <div className="flex flex-wrap gap-1 mb-2">
              {lead.tags && lead.tags.map(tag => (
                <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }}>
                  {tag.nombre}
                </Badge>
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="text-muted-foreground">Origen:</div>
              <div>{lead.canal_origen || "Desconocido"}</div>
              
              <div className="text-muted-foreground">Creado:</div>
              <div>{formatDate(lead.created_at)}</div>
              
              <div className="text-muted-foreground">Última actividad:</div>
              <div>{formatDate(lead.ultima_interaccion)}</div>
              
              {lead.pais && (
                <>
                  <div className="text-muted-foreground">País:</div>
                  <div>{lead.pais}</div>
                </>
              )}
              
              {lead.ciudad && (
                <>
                  <div className="text-muted-foreground">Ciudad:</div>
                  <div>{lead.ciudad}</div>
                </>
              )}
            </div>
            
            <div className="mt-2 flex justify-end">
              <Button variant="link" size="sm" className="h-6 p-0" asChild>
                <a href={`/dashboard/conversations/${lead.id}`}>Ver conversaciones</a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
