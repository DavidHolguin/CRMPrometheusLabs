
import { useState, useEffect } from "react";
import { usePipelines } from "@/hooks/usePipelines";
import { usePipelineLeads } from "@/hooks/usePipelineLeads";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreatePipelineDialog } from "@/components/pipeline/CreatePipelineDialog";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { StageCard } from "@/components/pipeline/StageCard";
import { AddStageCard } from "@/components/pipeline/AddStageCard";
import { toast } from "sonner";

const PipelineManagement = () => {
  const { pipelines, isLoading: pipelinesLoading } = usePipelines();
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const { leadsByStage, updateLeadStage, isLoading: leadsLoading } = usePipelineLeads(selectedPipeline);
  const [showAddStageForm, setShowAddStageForm] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [visibleStages, setVisibleStages] = useState(3);

  // Select the first pipeline by default when data loads
  useEffect(() => {
    if (pipelines.length > 0 && !selectedPipeline) {
      // Find the default pipeline or use the first one
      const defaultPipeline = pipelines.find(p => p.is_default) || pipelines[0];
      setSelectedPipeline(defaultPipeline.id);
    }
  }, [pipelines, selectedPipeline]);

  // Update visible stages based on screen size
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

    handleResize(); // Initial call
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    
    // Dropped outside a valid area
    if (!destination) return;
    
    // Dropped in the same place
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    
    // If we're dragging a lead
    if (result.type === "lead") {
      // Get the lead that was dragged
      const sourceStageId = source.droppableId;
      const destinationStageId = destination.droppableId;
      
      // If source and destination are different, we're moving to a new stage
      if (sourceStageId !== destinationStageId) {
        const leadId = result.draggableId;
        
        // Update the lead stage in Supabase via our hook
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
    <div className="flex flex-col h-screen overflow-hidden bg-background max-w-full">
      {/* Pipeline Selector */}
      {pipelines.length > 0 ? (
        <div className="p-4 w-full">
          <div className="flex items-center justify-between">
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
      
      {/* Pipeline Stages with Improved Drag and Drop */}
      {currentPipeline?.stages && currentPipeline.stages.length > 0 ? (
        <div className="flex-1 relative overflow-hidden">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="h-full px-4 relative flex">
              {/* Left Navigation Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handlePrev}
                disabled={currentSlide === 0}
                className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-background/80 shadow-md h-10 w-10 rounded-full"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              {/* Visible Stages */}
              <div className="flex h-full w-full gap-4 transition-transform duration-300">
                {visibleStageData.map((stage) => (
                  <div key={stage.id} className="flex-1 min-w-0 max-w-[400px]">
                    <StageCard 
                      stage={stage} 
                      leads={leadsByStage[stage.id] || []}
                      onAddLead={() => toast.info("Función de agregar lead en construcción")}
                    />
                  </div>
                ))}
                
                {/* Add Stage Card (only visible if we can see the end of the stages) */}
                {currentSlide + visibleStages >= stages.length && (
                  <div className="flex-1 min-w-0 max-w-[400px]">
                    <AddStageCard 
                      showForm={showAddStageForm}
                      onToggleForm={() => setShowAddStageForm(!showAddStageForm)}
                      pipeline={currentPipeline}
                      onComplete={() => setShowAddStageForm(false)}
                    />
                  </div>
                )}
              </div>

              {/* Right Navigation Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleNext}
                disabled={currentSlide + visibleStages >= stages.length + 1}
                className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-background/80 shadow-md h-10 w-10 rounded-full"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          </DragDropContext>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <h3 className="text-lg font-medium mb-2">No hay etapas configuradas</h3>
            <p className="text-muted-foreground mb-4">
              Agrega etapas a tu pipeline para organizar tus leads en el proceso de ventas.
            </p>
            {currentPipeline && (
              <Button onClick={() => setShowAddStageForm(true)} className="gap-2">
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
