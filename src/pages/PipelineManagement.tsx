
import { useState, useEffect, useRef } from "react";
import { usePipelines, Pipeline, PipelineStage } from "@/hooks/usePipelines";
import { usePipelineLeads } from "@/hooks/usePipelineLeads";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreatePipelineDialog } from "@/components/pipeline/CreatePipelineDialog";
import { CreateStageDialog } from "@/components/pipeline/CreateStageDialog";
import { EditStageDialog } from "@/components/pipeline/EditStageDialog";
import { LeadCard } from "@/components/pipeline/LeadCard";
import { Lead } from "@/hooks/useLeads";
import { DragDropContext, Droppable, Draggable, DropResult, ResponderProvided } from "react-beautiful-dnd";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const PipelineManagement = () => {
  const { pipelines, isLoading: pipelinesLoading } = usePipelines();
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
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
    <div className="container mx-auto p-4 space-y-6 max-w-full">
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
            <TabsList className="mb-4 flex-wrap">
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
                
                {/* Pipeline Stages using Carousel */}
                {currentPipeline?.stages && currentPipeline.stages.length > 0 ? (
                  <div className="relative w-full">
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Carousel className="w-full">
                        <CarouselContent className="ml-0">
                          {currentPipeline.stages.map((stage, index) => (
                            <CarouselItem key={stage.id} className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 pl-4 first:pl-0">
                              <Card className="h-full">
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
                                        "bg-muted/15 p-2 rounded-b-lg min-h-[60vh] transition-colors",
                                        snapshot.isDraggingOver ? "bg-muted/30" : ""
                                      )}
                                    >
                                      {Object.keys(leadsByStage).length > 0 && leadsByStage[stage.id] ? (
                                        <ScrollArea className="h-[60vh]">
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
                                        <div className="flex justify-center items-center h-[60vh] text-muted-foreground">
                                          No hay leads en esta etapa
                                        </div>
                                      )}
                                      {provided.placeholder}
                                    </div>
                                  )}
                                </Droppable>
                              </Card>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <div className="flex justify-center mt-4">
                          <CarouselPrevious className="relative static left-0 translate-y-0 mr-2" />
                          <CarouselNext className="relative static right-0 translate-y-0" />
                        </div>
                      </Carousel>
                    </DragDropContext>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No hay etapas configuradas para este pipeline</p>
                    <CreateStageDialog pipeline={pipeline} />
                  </div>
                )}
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
