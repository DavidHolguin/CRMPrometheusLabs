
import { Lead } from "@/hooks/useLeads";
import { Clock } from "lucide-react";

interface LeadHistoryTabProps {
  lead: Lead;
  formatDate: (dateStr: string | null) => string;
}

export function LeadHistoryTab({ lead, formatDate }: LeadHistoryTabProps) {
  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground flex items-center">
        <Clock size={12} className="mr-1" />
        Creado {formatDate(lead.created_at)}
      </div>
      <div className="text-xs text-muted-foreground flex items-center">
        <Clock size={12} className="mr-1" />
        Última interacción {formatDate(lead.ultima_interaccion)}
      </div>
      
      <p className="text-sm mt-4 text-muted-foreground">
        Historial detallado de actividades disponible próximamente.
      </p>
    </div>
  );
}
