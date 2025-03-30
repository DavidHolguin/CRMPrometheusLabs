
import { Lead } from "@/hooks/useLeads";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadHeaderProps {
  lead: Lead;
  expanded: boolean;
  scoreColorClass: string;
  normalizedScore: number;
  toggleExpanded: () => void;
}

export function LeadHeader({ lead, expanded, scoreColorClass, normalizedScore, toggleExpanded }: LeadHeaderProps) {
  return (
    <div className="flex justify-between items-start">
      <div className="flex gap-2 items-center">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all",
          scoreColorClass
        )}>
          {normalizedScore}
        </div>
        <div>
          <h3 className="font-semibold">
            {lead.nombre} {lead.apellido}
          </h3>
          <p className="text-xs text-muted-foreground">
            {lead.email || lead.telefono || "Sin contacto"}
          </p>
        </div>
      </div>
      <div className="flex gap-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          onClick={(e) => {
            e.stopPropagation();
            window.location.href = `/dashboard/conversations/${lead.id}`;
          }}
        >
          <MessageSquare size={16} />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          onClick={(e) => {
            e.stopPropagation();
            toggleExpanded();
          }}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
      </div>
    </div>
  );
}
