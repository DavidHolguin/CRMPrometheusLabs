
import React, { useState } from "react";
import { Lead } from "@/hooks/useLeads";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LeadScoreIndicator } from "./LeadScoreIndicator";
import { LeadHeader } from "./LeadHeader";
import { Calendar, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { LeadDrawer } from "./LeadDrawer";

interface LeadCardProps {
  lead: Lead;
  isDragging?: boolean;
  onScoreEdit?: () => void;
}

export function LeadCard({ lead, isDragging = false, onScoreEdit }: LeadCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const normalizedScore = Math.min(100, Math.max(0, lead.score || 0));
  const scoreColorClass = normalizedScore < 30 ? "text-red-500" 
    : normalizedScore < 70 ? "text-amber-500" 
    : "text-green-500";
    
  // Format the date for last interaction
  let lastInteractionText = "Sin interacciones";
  
  if (lead.ultima_interaccion) {
    try {
      const interactionDate = new Date(lead.ultima_interaccion);
      lastInteractionText = formatDistanceToNow(interactionDate, {
        addSuffix: true,
        locale: es
      });
    } catch (error) {
      console.error("Error formatting date:", error);
    }
  }
  
  const hasInteracted = lead.message_count && lead.message_count > 0;
  
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const handleCardClick = () => {
    if (!isDragging) {
      setShowDetails(true);
    }
  };

  return (
    <>
      <div
        className={cn(
          "w-full transition-all duration-300 ease-out rounded-md border border-border/60 bg-card overflow-hidden shadow-sm select-none",
          isDragging ? "shadow-lg ring-2 ring-primary/20" : "hover:border-primary/30 cursor-pointer",
          expanded ? "shadow-md" : ""
        )}
        onClick={handleCardClick}
      >
        <div className="p-3" onClick={(e) => {
          e.stopPropagation(); // Prevent triggering the card click
          toggleExpanded();
        }}>
          <LeadHeader 
            lead={lead}
            expanded={expanded}
            scoreColorClass={scoreColorClass}
            normalizedScore={normalizedScore}
            toggleExpanded={toggleExpanded}
            onScoreEdit={onScoreEdit}
          />
          
          <div className={cn("transition-all origin-top", 
            expanded ? "h-auto opacity-100 mt-3" : "h-0 opacity-0 -mt-4")}>
            
            <LeadScoreIndicator 
              score={normalizedScore} 
              className="mt-2 mb-3"
              editable={true}
              onEdit={onScoreEdit}
            />
            
            <div className="flex flex-wrap gap-1 mt-2">
              {lead.tags && lead.tags.map(tag => (
                <Badge 
                  key={tag.id}
                  variant="outline"
                  className="text-[10px] px-1"
                  style={{
                    backgroundColor: `${tag.color}20`,
                    borderColor: tag.color,
                    color: tag.color
                  }}
                >
                  {tag.nombre}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        <div className={cn("px-3 py-2 bg-muted/30 flex items-center justify-between border-t border-border/30 text-xs gap-2 text-muted-foreground")}>
          {hasInteracted ? (
            <div className="flex items-center gap-1.5">
              <MessageCircle size={12} />
              <span>{lead.message_count} interacciones</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Calendar size={12} />
              <span>Sin interacciones</span>
            </div>
          )}
          
          {lead.ultima_interaccion && (
            <span className="text-[10px] truncate">{lastInteractionText}</span>
          )}
        </div>
      </div>

      {/* Lead Drawer for detailed view */}
      <LeadDrawer 
        lead={lead} 
        open={showDetails} 
        onOpenChange={setShowDetails}
        scoreColorClass={scoreColorClass}
        normalizedScore={normalizedScore}
      />
    </>
  );
}
