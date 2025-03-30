
import { Lead } from "@/hooks/useLeads";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface LeadMessagesTabProps {
  lead: Lead;
  formatDate: (dateStr: string | null) => string;
}

export function LeadMessagesTab({ lead, formatDate }: LeadMessagesTabProps) {
  return (
    <div className="space-y-2">
      <Button variant="outline" size="sm" asChild>
        <a href={`/dashboard/conversations/${lead.id}`}>
          <MessageSquare size={14} className="mr-1" />
          Ver conversaciones
        </a>
      </Button>
      
      <div className="text-sm">
        <p>Último mensaje: {formatDate(lead.ultima_interaccion)}</p>
        <p>Total mensajes: {lead.message_count}</p>
      </div>
    </div>
  );
}
