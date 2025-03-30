
import { Lead } from "@/hooks/useLeads";
import { Button } from "@/components/ui/button";
import { MessageSquare, User } from "lucide-react";

interface LeadMessagesTabProps {
  lead: Lead;
  formatDate: (dateStr: string | null) => string;
}

export function LeadMessagesTab({ lead, formatDate }: LeadMessagesTabProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Datos Personales</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-md p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <User size={18} className="text-primary" />
            <h4 className="text-sm font-medium">Información Básica</h4>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Nombre completo:</span>
              <span className="text-xs font-medium">{lead.nombre} {lead.apellido}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Email:</span>
              <span className="text-xs font-medium">{lead.email || "No disponible"}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Teléfono:</span>
              <span className="text-xs font-medium">{lead.telefono || "No disponible"}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">País:</span>
              <span className="text-xs font-medium">{lead.pais || "No disponible"}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Ciudad:</span>
              <span className="text-xs font-medium">{lead.ciudad || "No disponible"}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-md p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={18} className="text-primary" />
            <h4 className="text-sm font-medium">Estado de Comunicación</h4>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Mensajes totales:</span>
              <span className="text-xs font-medium">{lead.message_count || 0}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Última interacción:</span>
              <span className="text-xs font-medium">{formatDate(lead.ultima_interaccion)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Canal de origen:</span>
              <span className="text-xs font-medium">{lead.canal_origen || "Desconocido"}</span>
            </div>
          </div>
          
          <Button variant="outline" size="sm" className="w-full mt-4" asChild>
            <a href={`/dashboard/conversations/${lead.id}`}>
              <MessageSquare size={14} className="mr-1" />
              Ver conversaciones
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
