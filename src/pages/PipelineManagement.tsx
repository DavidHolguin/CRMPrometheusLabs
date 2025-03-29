
import { useState, useEffect } from "react";
import { usePipelines, Pipeline } from "@/hooks/usePipelines";
import { usePipelineLeads } from "@/hooks/usePipelineLeads";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreatePipelineDialog } from "@/components/pipeline/CreatePipelineDialog";
import { LeadCard } from "@/components/pipeline/LeadCard";
import { Lead } from "@/hooks/useLeads";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { CreateStageDialog } from "@/components/pipeline/CreateStageDialog";

const PipelineManagement = () => {
  const { pipelines, isLoading: pipelinesLoading } = usePipelines();
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const { leadsByStage, updateLeadStage } = usePipelineLeads(selectedPipeline);
  const [showAddStageForm, setShowAddStageForm] = useState(false);

  // Select the first pipeline by default when data loads
  useEffect(() => {
    if (pipelines.length > 0 && !selectedPipeline) {
      // Find the default pipeline or use the first one
      const defaultPipeline = pipelines.find(p => p.is_default) || pipelines[0];
      setSelectedPipeline(defaultPipeline.id);
    }
  }, [pipelines, selectedPipeline]);

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
        updateLeadStage({ leadId, stageId: destinationStageId });
      }
    }
  };

  const getCurrentPipeline = (): Pipeline | undefined => {
    if (!selectedPipeline) return undefined;
    return pipelines.find(p => p.id === selectedPipeline);
  };

  if (pipelinesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-primary">Cargando pipelines...</div>
      </div>
    );
  }

  const currentPipeline = getCurrentPipeline();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background max-w-full">
      {/* Pipeline Selector */}
      {pipelines.length > 0 ? (
        <div className="container p-4 mx-auto mb-2">
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
      
      {/* Pipeline Stages */}
      {currentPipeline?.stages && currentPipeline.stages.length > 0 ? (
        <div className="flex-1 relative overflow-hidden">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Carousel className="w-full h-full">
              <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10" />
              <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10" />
              
              <CarouselContent className="h-full pl-8 pr-8">
                {currentPipeline.stages.map((stage) => (
                  <CarouselItem key={stage.id} className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 pl-2 pr-2 h-full">
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
                            {Object.keys(leadsByStage).length > 0 && leadsByStage[stage.id] 
                              ? leadsByStage[stage.id].length 
                              : 0}
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
                                {Object.keys(leadsByStage).length > 0 && leadsByStage[stage.id] && leadsByStage[stage.id].length > 0 ? (
                                  leadsByStage[stage.id].map((lead: Lead, leadIndex: number) => (
                                    <Draggable 
                                      key={lead.id} 
                                      draggableId={lead.id} 
                                      index={leadIndex}
                                    >
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                        >
                                          <LeadCard 
                                            lead={lead} 
                                            isDragging={snapshot.isDragging}
                                          />
                                        </div>
                                      )}
                                    </Draggable>
                                  ))
                                ) : (
                                  <div className="flex flex-col justify-center items-center h-24 text-muted-foreground text-sm">
                                    <span>No hay leads</span>
                                    <Button variant="ghost" size="sm" className="mt-2">
                                      <Plus className="h-4 w-4 mr-1" />
                                      Agregar Lead
                                    </Button>
                                  </div>
                                )}
                              </div>
                              {provided.placeholder}
                            </ScrollArea>
                          </div>
                        )}
                      </Droppable>
                    </div>
                  </CarouselItem>
                ))}
                
                {/* Add New Stage Card */}
                <CarouselItem className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 pl-2 pr-2 h-full">
                  {showAddStageForm ? (
                    <div className="flex flex-col h-full overflow-hidden rounded-lg border border-border/40 shadow-sm bg-card/90 backdrop-blur-sm">
                      <div className="p-3 border-b border-border/20 flex justify-between">
                        <h3 className="font-medium">Nueva Etapa</h3>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => setShowAddStageForm(false)}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="p-4 flex-1">
                        {currentPipeline && (
                          <CreateStageDialog 
                            pipeline={currentPipeline} 
                            onComplete={() => setShowAddStageForm(false)} 
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="h-full w-full border-dashed flex flex-col items-center justify-center gap-2 rounded-lg hover:bg-muted/50"
                      onClick={() => setShowAddStageForm(true)}
                    >
                      <Plus className="h-8 w-8 text-muted-foreground" />
                      <span className="text-muted-foreground">Agregar Etapa</span>
                    </Button>
                  )}
                </CarouselItem>
              </CarouselContent>
            </Carousel>
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
