import { useState, useEffect, useRef } from "react";
import { usePipelines } from "@/hooks/usePipelines";
import { usePipelineLeads } from "@/hooks/usePipelineLeads";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreatePipelineDialog } from "@/components/pipeline/CreatePipelineDialog";
import { CreateStageDialog } from "@/components/pipeline/CreateStageDialog";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StageCard } from "@/components/pipeline/StageCard";
import { toast } from "sonner";
import { 
  DndContext, 
  DragOverlay, 
  pointerWithin,
  rectIntersection,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  DragMoveEvent
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  horizontalListSortingStrategy, 
  sortableKeyboardCoordinates,
  rectSwappingStrategy,
  verticalListSortingStrategy 
} from "@dnd-kit/sortable";
import { restrictToWindowEdges, snapCenterToCursor } from '@dnd-kit/modifiers';
import { Lead } from "@/hooks/useLeads";
import { LeadCard } from "@/components/pipeline/LeadCard";

const PipelineManagement = () => {
  const { pipelines, isLoading: pipelinesLoading } = usePipelines();
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const { leadsByStage, updateLeadStage, isLoading: leadsLoading } = usePipelineLeads(selectedPipeline);
  const [showAddStageDialog, setShowAddStageDialog] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [visibleStages, setVisibleStages] = useState(3);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pipelines.length > 0 && !selectedPipeline) {
      const defaultPipeline = pipelines.find(p => p.is_default) || pipelines[0];
      setSelectedPipeline(defaultPipeline.id);
    }
  }, [pipelines, selectedPipeline]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setVisibleStages(1);
      } else if (width < 1024) {
        setVisibleStages(2);
      } else if (width < 1280) {
        setVisibleStages(3);
      } else {
        setVisibleStages(4);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { data } = active;
    
    if (data?.current?.type === "lead") {
      setActiveLead(data.current.lead);
      document.body.style.overflow = 'hidden';
    }
  };

  const handleDragMove = (event: DragMoveEvent) => {
    if (!boardRef.current) return;
    
    const board = boardRef.current;
    const { clientX } = event.activatorEvent as MouseEvent;
    
    const rect = board.getBoundingClientRect();
    const threshold = 150; // Aumentado para detectar antes
    
    // Zona de scroll a la derecha
    if (clientX > rect.right - threshold) {
      // Calculamos la velocidad basada en la distancia al borde
      const distance = rect.right - clientX;
      const speed = Math.max(5, 30 - (distance / threshold) * 30);
      
      // Usamos requestAnimationFrame para un scroll más suave
      requestAnimationFrame(() => {
        board.scrollLeft += Math.round(speed);
      });
      
      // Si estamos cerca del final y aún hay más stages, cambiamos de slide
      const isNearEnd = board.scrollWidth - board.scrollLeft - board.clientWidth < 100;
      if (isNearEnd && currentSlide + visibleStages < stages.length) {
        handleNext();
      }
    } 
    // Zona de scroll a la izquierda
    else if (clientX < rect.left + threshold) {
      // Calculamos la velocidad basada en la distancia al borde
      const distance = clientX - rect.left;
      const speed = Math.max(5, 30 - (distance / threshold) * 30);
      
      requestAnimationFrame(() => {
        board.scrollLeft -= Math.round(speed);
      });
      
      // Si estamos cerca del inicio y hay slides previos, cambiamos de slide
      const isNearStart = board.scrollLeft < 100;
      if (isNearStart && currentSlide > 0) {
        handlePrev();
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (over && active.data.current?.type === "lead" && over.data.current?.type === "stage") {
      console.log("Dragging over stage:", over.id);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    document.body.style.overflow = '';
    
    if (!over) {
      setActiveLead(null);
      return;
    }
    
    if (active.data.current?.type === "lead" && over.data.current?.type === "stage") {
      const leadId = active.id as string;
      const sourceStageId = active.data.current.lead.stage_id;
      const destinationStageId = over.id as string;
      
      if (sourceStageId !== destinationStageId) {
        console.log('Moving lead:', leadId, 'from stage:', sourceStageId, 'to stage:', destinationStageId);
        
        const leadToMove = { ...active.data.current.lead };
        leadToMove.stage_id = destinationStageId;
        
        const localLeadsByStage = { ...leadsByStage };
        
        if (sourceStageId && localLeadsByStage[sourceStageId]) {
          localLeadsByStage[sourceStageId] = localLeadsByStage[sourceStageId].filter(l => l.id !== leadId);
        }
        
        if (!localLeadsByStage[destinationStageId]) {
          localLeadsByStage[destinationStageId] = [];
        }
        localLeadsByStage[destinationStageId].push(leadToMove);
        
        updateLeadStage(
          { leadId, stageId: destinationStageId },
          {
            onSuccess: () => {
              toast.success("Lead movido correctamente");
            },
            onError: (error) => {
              toast.error("Error al mover el lead");
              console.error("Error moving lead:", error);
            }
          }
        );
      }
    }
    
    setActiveLead(null);
  };

  const getCurrentPipeline = () => {
    if (!selectedPipeline) return undefined;
    return pipelines.find(p => p.id === selectedPipeline);
  };

  const handleNext = () => {
    const currentPipeline = getCurrentPipeline();
    if (!currentPipeline || !currentPipeline.stages) return;
    
    const maxSlide = Math.max(0, currentPipeline.stages.length - visibleStages);
    setCurrentSlide(prev => Math.min(prev + 1, maxSlide));
  };

  const handlePrev = () => {
    setCurrentSlide(prev => Math.max(0, prev - 1));
  };

  const currentPipeline = getCurrentPipeline();
  const stages = currentPipeline?.stages || [];
  const visibleStageData = stages.slice(currentSlide, currentSlide + visibleStages);
  
  if (pipelinesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-primary">Cargando pipelines...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background max-w-full">
      {pipelines.length > 0 ? (
        <div className="p-4 w-full z-10 bg-background/95 backdrop-blur-sm border-b sticky top-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-64">
                <Select value={selectedPipeline || ''} onValueChange={setSelectedPipeline}>
                  <SelectTrigger className="w-full border-primary/20 bg-background/50 backdrop-blur-sm">
                    <SelectValue placeholder="Seleccionar pipeline" />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelines.map((pipeline) => (
                      <SelectItem key={pipeline.id} value={pipeline.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{pipeline.nombre}</span>
                          {pipeline.is_default && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                    <div className="py-2 border-t">
                      <CreatePipelineDialog>
                        <Button variant="ghost" className="w-full flex items-center justify-start text-blue-500 hover:text-blue-600 hover:bg-blue-50/50 pl-8">
                          <Plus className="w-4 h-4 mr-2" />
                          Crear Pipeline
                        </Button>
                      </CreatePipelineDialog>
                    </div>
                  </SelectContent>
                </Select>
              </div>
              
              {currentPipeline && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="gap-1 h-9"
                  onClick={() => setShowAddStageDialog(true)}
                >
                  <Plus className="h-4 w-4" />
                  <span>Añadir Etapa</span>
                </Button>
              )}
              
              {showAddStageDialog && currentPipeline && (
                <CreateStageDialog 
                  pipeline={currentPipeline}
                  onComplete={() => setShowAddStageDialog(false)}
                  open={showAddStageDialog}
                  onOpenChange={setShowAddStageDialog}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-10">
          <h2 className="text-xl mb-4">No hay pipelines configurados</h2>
          <p className="text-muted-foreground mb-6">
            Crea tu primer pipeline para comenzar a gestionar tus leads por etapas.
          </p>
          <CreatePipelineDialog />
        </div>
      )}
      
      {currentPipeline?.stages && currentPipeline.stages.length > 0 ? (
        <div className="flex-1 relative overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={(args) => {
              // Primero intentamos detectar colisión con rectIntersection (más preciso)
              const intersections = rectIntersection(args);
              
              // Si hay intersecciones, las devolvemos
              if (intersections.length > 0) {
                return intersections;
              }
              
              // Si no hay intersecciones, utilizamos pointerWithin para una detección más amplia
              return pointerWithin(args);
            }}
            measuring={{
              droppable: {
                strategy: MeasuringStrategy.Always
              }
            }}
            modifiers={[restrictToWindowEdges]}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={visibleStageData.map(stage => stage.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div ref={boardRef} className="h-full px-4 relative flex kanban-board">
                {currentSlide > 0 && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handlePrev}
                    className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-background/80 shadow-md h-10 w-10 rounded-full"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                )}

                <div className="flex h-full w-full gap-4 transition-transform duration-300 pb-2">
                  {visibleStageData.map((stage) => (
                    <div key={stage.id} className="flex-1 min-w-0 max-w-[400px] kanban-column">
                      <StageCard 
                        stage={stage} 
                        leads={leadsByStage[stage.id] || []}
                        onAddLead={() => toast.info("Función de agregar lead en construcción")}
                      />
                    </div>
                  ))}
                </div>

                {currentSlide + visibleStages < stages.length && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleNext}
                    className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-background/80 shadow-md h-10 w-10 rounded-full"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                )}
              </div>

              <DragOverlay 
                adjustScale={true} 
                dropAnimation={{
                  duration: 300,
                  easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
                }}
                zIndex={1000}
              >
                {activeLead ? (
                  <div className="opacity-90 transform-gpu pointer-events-none w-[370px]">
                    <LeadCard lead={activeLead} isDragging={true} />
                  </div>
                ) : null}
              </DragOverlay>
            </SortableContext>
          </DndContext>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <h3 className="text-lg font-medium mb-2">No hay etapas configuradas</h3>
            <p className="text-muted-foreground mb-4">
              Agrega etapas a tu pipeline para organizar tus leads en el proceso de ventas.
            </p>
            {currentPipeline && (
              <Button onClick={() => setShowAddStageDialog(true)} className="gap-2">
                <Plus size={16} />
                Agregar Primera Etapa
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineManagement;
