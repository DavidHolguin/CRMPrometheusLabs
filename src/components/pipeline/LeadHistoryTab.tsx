
import { Lead } from "@/hooks/useLeads";
import { Clock, MessageSquare, ArrowRight, Edit, Plus, User } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface LeadHistoryTabProps {
  lead: Lead;
  formatDate: (dateStr: string | null) => string;
}

// Mock history data (in a real app this would come from the database)
const generateMockHistory = (lead: Lead) => {
  const history = [
    {
      id: 1,
      type: "created",
      date: lead.created_at,
      description: "Lead creado en el sistema",
      icon: <Plus size={16} className="text-green-500" />
    }
  ];

  if (lead.message_count && lead.message_count > 0) {
    history.push({
      id: 2,
      type: "message",
      date: lead.ultima_interaccion,
      description: `${lead.message_count} mensajes intercambiados`,
      icon: <MessageSquare size={16} className="text-blue-500" />
    });
  }

  if (lead.stage_name) {
    history.push({
      id: 3,
      type: "stage",
      date: new Date(new Date(lead.created_at).getTime() + 86400000).toISOString(),
      description: `Movido a etapa "${lead.stage_name}"`,
      icon: <ArrowRight size={16} className="text-purple-500" />
    });
  }

  if (lead.asignado_a) {
    history.push({
      id: 4,
      type: "assigned",
      date: new Date(new Date(lead.created_at).getTime() + 172800000).toISOString(),
      description: `Asignado a ${lead.asignado_a}`,
      icon: <User size={16} className="text-orange-500" />
    });
  }

  return history.sort((a, b) => 
    new Date(b.date || "").getTime() - new Date(a.date || "").getTime()
  );
};

export function LeadHistoryTab({ lead, formatDate }: LeadHistoryTabProps) {
  const historyEvents = generateMockHistory(lead);

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

  return (
    <div className="py-2">
      <h3 className="text-sm font-medium mb-4">Historial de Actividad</h3>

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
              <div className="absolute left-3 top-6 w-0.5 h-full bg-gray-200 z-0"></div>
            )}
            
            <div className="flex items-start mb-6 relative z-10">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white border-2 border-primary flex-shrink-0">
                {event.icon}
              </div>
              
              <div className="ml-4 bg-white p-3 rounded-lg border shadow-sm w-full">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-medium">{event.description}</h4>
                  <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    {event.date ? formatDistanceToNow(new Date(event.date), {
                      addSuffix: true,
                      locale: es
                    }) : "Fecha desconocida"}
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDate(event.date)}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
