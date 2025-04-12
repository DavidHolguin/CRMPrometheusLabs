import { ScrollArea } from "@/components/ui/scroll-area";
import { Lead } from "@/hooks/useLeads";
import { PipelineStage } from "@/hooks/usePipelines";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  MoveHorizontal, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  ArrowUpDown 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LeadCard } from "@/components/pipeline/LeadCard";
import { CSSProperties, useRef, useEffect, useState } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { CreateStageDialog } from "./CreateStageDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface StageCardProps {
  stage: PipelineStage;
  leads: Lead[];
  onAddLead?: () => void;
  pipelineId?: string;
  onStageEdit?: (stage: PipelineStage) => void;
  onStageDelete?: (stageId: string) => void;
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
    position: isDragging ? 'relative' : 'static',
    zIndex: isDragging ? 999 : 1,
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
          opacity: isDragging ? 0.4 : 1,
          y: 0,
          boxShadow: isDragging ? "0 8px 16px -2px rgba(0, 0, 0, 0.1)" : "none",
        }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 25,
          mass: 0.8
        }}
        className={cn(
          "origin-center transition-all duration-150 ease-out",
          isDragging ? "opacity-40" : "opacity-100"
        )}
      >
        <LeadCard 
          lead={lead} 
          isDragging={isDragging}
        />
      </motion.div>
    </div>
  );
}

export function StageCard({ 
  stage, 
  leads, 
  onAddLead, 
  pipelineId,
  onStageEdit,
  onStageDelete
}: StageCardProps) {
  const { setNodeRef, isOver, active } = useDroppable({
    id: stage.id,
    data: {
      type: "stage",
      stage
    }
  });

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [leadsCount, setLeadsCount] = useState(leads?.length || 0);

  // Mantener el conteo actualizado 
  useEffect(() => {
    setLeadsCount(leads?.length || 0);
  }, [leads]);

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

  // Determinar el color de fondo basado en el color del stage
  const getBgColor = (color: string) => {
    // Convertir color a rgba con baja opacidad para el fondo
    return `${color}10`;
  };

  const handleDelete = () => {
    if (onStageDelete) {
      onStageDelete(stage.id);
    }
    setShowDeleteConfirm(false);
  };

  const handleEdit = () => {
    if (onStageEdit) {
      onStageEdit(stage);
    }
    setShowEditDialog(true);
  };

  // Improved stage card with better visual feedback
  return (
    <div className={cn(
      "flex flex-col h-full overflow-hidden rounded-lg shadow-sm bg-gradient-to-b from-card/90 to-card/100 transition-all duration-300",
      isOver ? "ring-2 ring-primary/30" : "border border-border/40",
    )}>
      {/* Cabecera moderna */}
      <div 
        className={cn(
          "flex justify-between items-center transition-colors duration-300 py-2.5 px-3 border-b",
          isOver ? "bg-muted/30" : "bg-card"
        )}
        style={{ 
          borderTop: `3px solid ${stage.color}`,
          background: isOver 
            ? `linear-gradient(180deg, ${getBgColor(stage.color)} 0%, transparent 100%)` 
            : `linear-gradient(180deg, ${getBgColor(stage.color)} 0%, transparent 100%)` 
        }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div 
            className="h-3 w-3 rounded-full flex-shrink-0" 
            style={{ backgroundColor: stage.color }}
          />
          <h3 className="font-medium truncate text-sm">{stage.nombre}</h3>
          <div className="flex-shrink-0">
            <Badge 
              variant={isOver ? "secondary" : "outline"} 
              className={cn(
                "text-[10px] px-1.5 h-5 transition-all duration-300 flex items-center",
                isOver ? "bg-primary/20" : "bg-muted/50"
              )}
            >
              {leadsCount}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Badge 
            variant="secondary" 
            className="text-[10px] px-1.5 h-5 flex-shrink-0 bg-muted/50"
          >
            <ArrowUpDown className="h-2.5 w-2.5 mr-0.5" />
            <span>{stage.probabilidad}%</span>
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                <span>Editar etapa</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"  
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                <span>Eliminar etapa</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div 
        ref={setNodeRef}
        className={cn(
          "flex-1 transition-all duration-300 relative",
          isOver 
            ? "bg-muted/20 border-2 border-dashed border-primary/30" 
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

      {/* Dialog de confirmación para eliminar etapa */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta etapa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la etapa "{stage.nombre}" y todos los leads deberán ser movidos manualmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
