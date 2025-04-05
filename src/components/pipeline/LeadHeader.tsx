
import { Lead } from "@/hooks/useLeads";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LeadScoreIndicator } from "./LeadScoreIndicator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LeadHeaderProps {
  lead: Lead;
  expanded: boolean;
  scoreColorClass: string;
  normalizedScore: number;
  toggleExpanded: () => void;
  onScoreEdit?: () => void;
}

export function LeadHeader({ 
  lead, 
  expanded, 
  scoreColorClass, 
  normalizedScore, 
  toggleExpanded, 
  onScoreEdit 
}: LeadHeaderProps) {
  // Get initials from name
  const getInitials = () => {
    const firstName = lead.nombre || '';
    const lastName = lead.apellido || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="flex justify-between items-start">
      <div className="flex gap-3 items-center">
        <Avatar className="h-10 w-10 border-2" style={{ borderColor: lead.stage_color || '#ccc' }}>
          <AvatarFallback 
            className="text-white font-semibold"
            style={{ backgroundColor: lead.stage_color || '#ccc' }}
          >
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <h3 className="font-semibold">
            {lead.nombre} {lead.apellido}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {lead.email || lead.telefono || "Sin contacto"}
            </span>
            
            {lead.stage_name && (
              <Badge 
                variant="outline" 
                className="text-xs"
                style={{ 
                  backgroundColor: `${lead.stage_color}20`, 
                  color: lead.stage_color,
                  borderColor: lead.stage_color
                }}
              >
                {lead.stage_name}
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex gap-1">
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
