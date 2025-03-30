
import { useState, useEffect } from "react";
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
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  KeyboardSensor
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  horizontalListSortingStrategy, 
  sortableKeyboardCoordinates 
} from "@dnd-kit/sortable";
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

  // Configure sensors with more permissive settings
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Even lower activationConstraint for easier dragging
      activationConstraint: {
        distance: 3,
        delay: 0,
        tolerance: 10
      }
    }),
    useSensor(TouchSensor, {
      // Very permissive touch handling
      activationConstraint: {
        delay: 0,
        tolerance: 10
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
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // This is intentionally left empty for now
    // Future implementation could handle drag sorting within a stage
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
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
        
        // Immediately update UI optimistically
        // This is a UI-only update that will be overwritten when the query is invalidated
        const leadToMove = { ...active.data.current.lead };
        leadToMove.stage_id = destinationStageId;
        
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
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={visibleStageData.map(stage => stage.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="h-full px-4 relative flex">
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
                    <div key={stage.id} className="flex-1 min-w-0 max-w-[400px]">
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
                  dragSourceOpacity: 0.2,
                }}
                zIndex={1000}
              >
                {activeLead ? (
                  <div className="opacity-90 transform-gpu pointer-events-none">
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
