
import { useState, useEffect } from "react";
import { usePipelines, Pipeline, PipelineStage } from "@/hooks/usePipelines";
import { usePipelineLeads } from "@/hooks/usePipelineLeads";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreatePipelineDialog } from "@/components/pipeline/CreatePipelineDialog";
import { CreateStageDialog } from "@/components/pipeline/CreateStageDialog";
import { EditStageDialog } from "@/components/pipeline/EditStageDialog";
import { LeadCard } from "@/components/pipeline/LeadCard";
import { Lead } from "@/hooks/useLeads";
import { DragDropContext, Droppable, Draggable, DropResult, ResponderProvided } from "react-beautiful-dnd";
import { ChevronLeft, ChevronRight, GripVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PipelineManagement = () => {
  const { pipelines, isLoading: pipelinesLoading } = usePipelines();
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const [stagesScrollPosition, setStagesScrollPosition] = useState(0);
  const { leadsByStage, updateLeadStage } = usePipelineLeads(selectedPipeline);

  // Select the first pipeline by default when data loads
  useEffect(() => {
    if (pipelines.length > 0 && !selectedPipeline) {
      // Find the default pipeline or use the first one
      const defaultPipeline = pipelines.find(p => p.is_default) || pipelines[0];
      setSelectedPipeline(defaultPipeline.id);
    }
  }, [pipelines, selectedPipeline]);

  const handleDragEnd = (result: DropResult, provided: ResponderProvided) => {
    const { source, destination } = result;
    
    // Dropped outside a valid area
    if (!destination) {
      return;
    }
    
    // Dropped in the same place
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }
    
    // If we're dragging a lead
    if (result.type === "lead") {
      // Get the lead that was dragged
      const sourceStageId = source.droppableId;
      const destinationStageId = destination.droppableId;
      
      // If source and destination are the same, we're just reordering within the stage
      // (We don't need to handle this case for now as we're sorting by last interaction)
      
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

  const scrollStagesLeft = () => {
    setStagesScrollPosition(Math.max(0, stagesScrollPosition - 300));
  };

  const scrollStagesRight = () => {
    const currentPipeline = getCurrentPipeline();
    if (!currentPipeline || !currentPipeline.stages) return;
    
    const stagesCount = currentPipeline.stages.length;
    const maxScroll = Math.max(0, stagesCount * 280 - window.innerWidth + 100);
    setStagesScrollPosition(Math.min(maxScroll, stagesScrollPosition + 300));
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
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">CRM</h1>
        <CreatePipelineDialog />
      </div>

      {pipelines.length > 0 ? (
        <>
          <Tabs 
            value={selectedPipeline || undefined} 
            onValueChange={setSelectedPipeline}
            className="w-full"
          >
            <TabsList className="mb-4">
              {pipelines.map((pipeline) => (
                <TabsTrigger key={pipeline.id} value={pipeline.id}>
                  {pipeline.nombre}
                  {pipeline.is_default && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Default
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {pipelines.map((pipeline) => (
              <TabsContent key={pipeline.id} value={pipeline.id} className="mt-0">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">{pipeline.nombre}</h2>
                  <CreateStageDialog pipeline={pipeline} />
                </div>
                
                {/* Pipeline Stages */}
                <div className="relative">
                  {/* Scroll controls */}
                  {currentPipeline?.stages && currentPipeline.stages.length > 3 && (
                    <>
                      <Button
                        onClick={scrollStagesLeft}
                        variant="outline"
                        size="icon"
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full opacity-80 hover:opacity-100"
                      >
                        <ChevronLeft size={16} />
                      </Button>
                      <Button
                        onClick={scrollStagesRight}
                        variant="outline"
                        size="icon"
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full opacity-80 hover:opacity-100"
                      >
                        <ChevronRight size={16} />
                      </Button>
                    </>
                  )}
                  
                  <div 
                    className="overflow-x-auto pb-4 flex" 
                    style={{
                      transform: `translateX(-${stagesScrollPosition}px)`,
                      transition: 'transform 0.3s ease',
                    }}
                  >
                    <DragDropContext onDragEnd={handleDragEnd}>
                      {currentPipeline?.stages?.map((stage, index) => (
                        <div key={stage.id} className="flex-shrink-0 w-[280px] mx-2 first:ml-0">
                          <div 
                            className="bg-muted/30 rounded-t-lg p-2 flex justify-between items-center sticky top-0"
                            style={{ borderTop: `3px solid ${stage.color}` }}
                          >
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{stage.nombre}</h3>
                              <Badge variant="outline" className="text-xs">
                                {Object.keys(leadsByStage).length > 0 && leadsByStage[stage.id] 
                                  ? leadsByStage[stage.id].length 
                                  : 0}
                              </Badge>
                            </div>
                            <div className="flex items-center">
                              <Badge 
                                variant="secondary" 
                                className="mr-2 text-xs"
                              >
                                {stage.probabilidad}%
                              </Badge>
                              <EditStageDialog stage={stage} />
                            </div>
                          </div>
                          
                          <Droppable droppableId={stage.id} type="lead">
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={cn(
                                  "bg-muted/15 p-2 rounded-b-lg min-h-[70vh] transition-colors",
                                  snapshot.isDraggingOver ? "bg-muted/30" : ""
                                )}
                              >
                                {Object.keys(leadsByStage).length > 0 && leadsByStage[stage.id] ? (
                                  <ScrollArea className="h-[70vh]">
                                    {leadsByStage[stage.id].map((lead: Lead, leadIndex: number) => (
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
                                    ))}
                                  </ScrollArea>
                                ) : (
                                  <div className="flex justify-center items-center h-[70vh] text-muted-foreground">
                                    No hay leads en esta etapa
                                  </div>
                                )}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      ))}
                    </DragDropContext>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </>
      ) : (
        <div className="text-center py-10">
          <h2 className="text-xl mb-4">No hay pipelines configurados</h2>
          <p className="text-muted-foreground mb-6">
            Crea tu primer pipeline para comenzar a gestionar tus leads por etapas.
          </p>
          <CreatePipelineDialog />
        </div>
      )}
    </div>
  );
};

export default PipelineManagement;
