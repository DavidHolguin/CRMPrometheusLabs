import { ScrollArea } from "@/components/ui/scroll-area";
import { Lead } from "@/hooks/useLeads";
import { PipelineStage } from "@/hooks/usePipelines";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, MoveHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LeadCard } from "@/components/pipeline/LeadCard";
import { CSSProperties, useRef, useEffect } from "react";

interface StageCardProps {
  stage: PipelineStage;
  leads: Lead[];
  onAddLead?: () => void;
}

export function LeadItem({ lead, index }: { lead: Lead; index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: lead.id,
    data: {
      lead,
      type: "lead"
    }
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 1,
    position: isDragging ? 'relative' : 'static',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-2 touch-manipulation relative"
      data-lead-id={lead.id}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          scale: isDragging ? 1.03 : 1,
          boxShadow: isDragging ? "0 10px 25px -5px rgba(0, 0, 0, 0.2)" : "none",
        }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 25,
          mass: 0.8
        }}
      >
        <LeadCard 
          lead={lead} 
          isDragging={isDragging}
        />
      </motion.div>
    </div>
  );
}

export function StageCard({ stage, leads, onAddLead }: StageCardProps) {
  const { setNodeRef, isOver, active } = useDroppable({
    id: stage.id,
    data: {
      type: "stage",
      stage
    }
  });

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Función para hacer scroll al final cuando se agrega un nuevo lead
  useEffect(() => {
    if (scrollAreaRef.current && leads.length > 0) {
      const lastAddedDate = Math.max(...leads.map(lead => new Date(lead.updated_at || lead.created_at).getTime()));
      const wasJustUpdated = Date.now() - lastAddedDate < 1000;
      
      if (wasJustUpdated) {
        setTimeout(() => {
          if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
              scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
          }
        }, 100);
      }
    }
  }, [leads.length]);

  // Improved stage card with better visual feedback
  return (
    <div className="flex flex-col h-full overflow-hidden rounded-lg border border-border/40 shadow-sm bg-gradient-to-b from-card/90 to-card/70 backdrop-blur-sm transition-all duration-300">
      <div 
        className={cn(
          "p-3 flex justify-between items-center border-b border-border/20 transition-colors duration-300",
          isOver ? "bg-muted/30" : ""
        )}
        style={{ 
          borderLeft: `4px solid ${stage.color}`,
          background: isOver 
            ? `linear-gradient(90deg, ${stage.color}20 0%, transparent 100%)` 
            : `linear-gradient(90deg, ${stage.color}10 0%, transparent 100%)` 
        }}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">{stage.nombre}</h3>
          <Badge 
            variant={isOver ? "secondary" : "outline"} 
            className={cn(
              "text-xs transition-all duration-300",
              isOver ? "bg-primary/20 scale-110" : ""
            )}
          >
            {leads?.length || 0}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Badge 
            variant="secondary" 
            className="text-xs"
          >
            Score: {stage.probabilidad}
          </Badge>
        </div>
      </div>
      
      <div 
        ref={setNodeRef}
        className={cn(
          "flex-1 transition-all duration-300 relative",
          isOver 
            ? "bg-muted/50 border-2 border-dashed border-primary/40" 
            : "bg-transparent"
        )}
        data-stage-id={stage.id}
      >
        {isOver && active && (
          <motion.div 
            className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-primary/10 backdrop-blur-sm rounded-lg px-4 py-2 text-sm font-medium text-primary flex items-center gap-2 shadow-lg">
              <MoveHorizontal className="h-4 w-4" />
              <span>Soltar aquí</span>
            </div>
          </motion.div>
        )}

        <ScrollArea 
          ref={scrollAreaRef} 
          className="h-[calc(100vh-180px)] w-full pr-2"
        >
          <div className="p-2 space-y-2 min-h-[200px]">
            <SortableContext 
              items={leads.map(lead => lead.id)} 
              strategy={verticalListSortingStrategy}
            >
              <AnimatePresence>
                {leads && leads.length > 0 ? (
                  leads.map((lead: Lead, leadIndex: number) => (
                    <LeadItem key={lead.id} lead={lead} index={leadIndex} />
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "flex flex-col justify-center items-center h-32 text-muted-foreground text-sm",
                      isOver ? "bg-primary/5" : ""
                    )}
                  >
                    {isOver ? (
                      <span className="font-medium text-primary">Soltar lead aquí</span>
                    ) : (
                      <>
                        <span>No hay leads</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-2"
                          onClick={onAddLead}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Agregar Lead
                        </Button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </SortableContext>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
