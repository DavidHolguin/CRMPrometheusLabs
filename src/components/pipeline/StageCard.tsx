
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lead } from "@/hooks/useLeads";
import { PipelineStage } from "@/hooks/usePipelines";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { LeadCard } from "@/components/pipeline/LeadCard";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface StageCardProps {
  stage: PipelineStage;
  leads: Lead[];
  onAddLead?: () => void;
}

export function StageCard({ stage, leads, onAddLead }: StageCardProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden rounded-lg border border-border/40 shadow-sm bg-gradient-to-b from-card/90 to-card/70 backdrop-blur-sm">
      <div 
        className="p-3 flex justify-between items-center border-b border-border/20"
        style={{ 
          borderLeft: `4px solid ${stage.color}`,
          background: `linear-gradient(90deg, ${stage.color}10 0%, transparent 100%)` 
        }}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">{stage.nombre}</h3>
          <Badge variant="outline" className="text-xs">
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
      
      <Droppable droppableId={stage.id} type="lead">
        {(provided, snapshot) => (
          <div 
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 transition-colors",
              snapshot.isDraggingOver ? "bg-muted/40" : "bg-transparent"
            )}
          >
            <ScrollArea className="h-[calc(100vh-180px)] w-full pr-2">
              <div className="p-2 space-y-2">
                <AnimatePresence>
                  {leads && leads.length > 0 ? (
                    leads.map((lead: Lead, leadIndex: number) => (
                      <Draggable 
                        key={lead.id} 
                        draggableId={lead.id} 
                        index={leadIndex}
                      >
                        {(provided, snapshot) => (
                          <motion.div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="transition-all"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ 
                              opacity: 1, 
                              y: 0,
                              scale: snapshot.isDragging ? 1.02 : 1,
                              boxShadow: snapshot.isDragging ? "0 10px 25px -5px rgba(0, 0, 0, 0.1)" : "none",
                              zIndex: snapshot.isDragging ? 10 : 'auto'
                            }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ 
                              type: "spring", 
                              stiffness: 500, 
                              damping: 30,
                              mass: 1
                            }}
                            style={{
                              ...provided.draggableProps.style,
                            }}
                          >
                            <LeadCard 
                              lead={lead} 
                              isDragging={snapshot.isDragging}
                            />
                          </motion.div>
                        )}
                      </Draggable>
                    ))
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col justify-center items-center h-24 text-muted-foreground text-sm"
                    >
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
                    </motion.div>
                  )}
                </AnimatePresence>
                {provided.placeholder}
              </div>
            </ScrollArea>
          </div>
        )}
      </Droppable>
    </div>
  );
}
