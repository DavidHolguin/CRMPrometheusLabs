import { useState, useEffect, useRef, useMemo } from "react";
import { usePipelines } from "@/hooks/usePipelines";
import { usePipelineLeads } from "@/hooks/usePipelineLeads";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StageCard } from "@/components/pipeline/StageCard";
import { toast } from "sonner";
import { PipelineToolbar, FilterOptions } from "@/components/pipeline/PipelineToolbar";
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
  SortableContext, 
  horizontalListSortingStrategy, 
  sortableKeyboardCoordinates
} from "@dnd-kit/sortable";
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { Lead } from "@/hooks/useLeads";
import { LeadCard } from "@/components/pipeline/LeadCard";
import { format } from "date-fns";

const PipelineManagement = () => {
  const { pipelines, isLoading: pipelinesLoading } = usePipelines();
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const { leadsByStage, updateLeadStage, isLoading: leadsLoading, refetch } = usePipelineLeads(selectedPipeline);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [visibleStages, setVisibleStages] = useState(3);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});

  // Filtrado de leads basado en búsqueda y filtros activos
  const filteredLeadsByStage = useMemo(() => {
    if (!leadsByStage) return {};

    const result: Record<string, Lead[]> = {};
    const today = format(new Date(), 'yyyy-MM-dd');

    Object.entries(leadsByStage).forEach(([stageId, leads]) => {
      // Si hay un filtro por etapa y no es esta, saltamos
      if (filterOptions.stageFilter && filterOptions.stageFilter !== stageId) {
        result[stageId] = [];
        return;
      }

      // Filtrar leads según criterios
      const filteredLeads = leads.filter(lead => {
        // Búsqueda por texto
        if (searchQuery && !matchesSearchQuery(lead, searchQuery)) {
          return false;
        }

        // Filtro: Solo sin asignar
        if (filterOptions.onlyUnassigned && lead.asignado_a) {
          return false;
        }

        // Filtro: Creados hoy
        if (filterOptions.createdToday) {
          const createdDate = format(new Date(lead.created_at), 'yyyy-MM-dd');
          if (createdDate !== today) {
            return false;
          }
        }

        // Filtro: Actualizados recientemente (últimas 24 horas)
        if (filterOptions.recentlyUpdated && lead.updated_at) {
          const updatedTime = new Date(lead.updated_at).getTime();
          const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
          if (updatedTime < oneDayAgo) {
            return false;
          }
        }

        return true;
      });

      result[stageId] = filteredLeads;
    });

    return result;
  }, [leadsByStage, searchQuery, filterOptions]);

  // Función auxiliar para buscar por texto en diferentes campos del lead
  function matchesSearchQuery(lead: Lead, query: string): boolean {
    const searchTerms = query.toLowerCase().split(' ');
    
    return searchTerms.every(term => {
      const fullName = `${lead.nombre || ''} ${lead.apellido || ''}`.toLowerCase();
      return (
        fullName.includes(term) ||
        (lead.email && lead.email.toLowerCase().includes(term)) ||
        (lead.telefono && lead.telefono.toLowerCase().includes(term)) ||
        (lead.canal_origen && lead.canal_origen.toLowerCase().includes(term))
      );
    });
  }

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
        
        // Crear una copia del lead con el nuevo stage_id
        const leadToMove = { ...active.data.current.lead, stage_id: destinationStageId };
        
        // Actualización optimista del estado local para un feedback visual inmediato
        const updatedLeadsByStage = { ...leadsByStage };
        
        // Eliminar el lead del stage origen
        if (sourceStageId && updatedLeadsByStage[sourceStageId]) {
          updatedLeadsByStage[sourceStageId] = updatedLeadsByStage[sourceStageId].filter(l => l.id !== leadId);
        }
        
        // Asegurarnos que existe el array para el stage destino
        if (!updatedLeadsByStage[destinationStageId]) {
          updatedLeadsByStage[destinationStageId] = [];
        }
        
        // Añadir el lead al stage destino
        updatedLeadsByStage[destinationStageId] = [...updatedLeadsByStage[destinationStageId], leadToMove];
        
        // Actualizar inmediatamente el estado local antes de la llamada a la API
        // Esto se hace mediante una función que modifica directamente el estado de leadsByStage en el custom hook
        if (typeof updateLeadStage === 'function') {
          updateLeadStage(
            { leadId, stageId: destinationStageId },
            {
              // En lugar de usar onMutate directamente (que causa error de TS),
              // utilizamos las opciones permitidas por TanStack Query
              onSettled: () => {
                // Esta función se ejecuta después de la mutación, sea exitosa o no
              },
              onError: (error, variables, context) => {
                // Si hay un error, mostramos el mensaje
                toast.error("Error al mover el lead");
                console.error("Error moving lead:", error);
                
                // La lógica de rollback ya está manejada en el hook usePipelineLeads
              },
              onSuccess: () => {
                toast.success("Lead movido correctamente");
              }
            }
          );
        }
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

  // Funciones para editar o eliminar stages (implementación futura)
  const handleStageEdit = (stage: any) => {
    // Aquí se implementaría la edición de etapas
    toast.info(`Editar etapa: ${stage.nombre}`);
  };
  
  const handleStageDelete = (stageId: string) => {
    // Aquí se implementaría la eliminación de etapas
    toast.info(`Eliminar etapa: ${stageId}`);
  };
  
  const handleLeadAdded = () => {
    // Refrescar los leads cuando se añade uno nuevo
    refetch();
  };

  // Manejar cambios en la búsqueda
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // Manejar cambios en los filtros
  const handleFilterChange = (filters: FilterOptions) => {
    setFilterOptions(filters);
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
        <>
          {/* Barra de herramientas con búsqueda y filtros funcionales */}
          <PipelineToolbar 
            pipelines={pipelines}
            selectedPipeline={selectedPipeline}
            onPipelineChange={setSelectedPipeline}
            currentPipeline={currentPipeline}
            onLeadAdded={handleLeadAdded}
            onSearchChange={handleSearchChange}
            onFilterChange={handleFilterChange}
          />
          
          {/* Contenedor principal del pipeline */}
          <div className="flex-1 relative overflow-hidden bg-muted/10">
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
                <div ref={boardRef} className="h-full px-4 pt-2 pb-4 relative flex kanban-board">
                  {currentSlide > 0 && (
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      onClick={handlePrev}
                      className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-background/80 shadow-md h-10 w-10 rounded-full"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                  )}

                  <div className="flex h-full w-full gap-6 transition-transform duration-300 pb-2">
                    {visibleStageData.map((stage) => (
                      <div key={stage.id} className="flex-1 min-w-0 max-w-[380px] kanban-column">
                        <StageCard 
                          stage={stage} 
                          leads={filteredLeadsByStage[stage.id] || []}
                          onAddLead={handleLeadAdded}
                          pipelineId={selectedPipeline || undefined}
                          onStageEdit={handleStageEdit}
                          onStageDelete={handleStageDelete}
                        />
                      </div>
                    ))}
                  </div>

                  {currentSlide + visibleStages < stages.length && (
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      onClick={handleNext}
                      className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-background/80 shadow-md h-10 w-10 rounded-full"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  )}
                </div>

                <DragOverlay 
                  adjustScale={false} 
                  dropAnimation={{
                    duration: 250,
                    easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
                  }}
                  zIndex={1000}
                  className="transform-none"
                >
                  {activeLead ? (
                    <div className="opacity-95 transform-gpu pointer-events-none w-[370px] animate-pulse-light">
                      <div className="shadow-md rounded-lg border border-primary/20 overflow-hidden relative">
                        <div className="absolute inset-0 bg-primary/5 z-0"></div>
                        <div className="relative z-10">
                          <LeadCard lead={activeLead} isDragging={true} />
                        </div>
                      </div>
                    </div>
                  ) : null}
                </DragOverlay>
              </SortableContext>
            </DndContext>
          </div>
        </>
      ) : (
        <div className="text-center py-10">
          <h2 className="text-xl mb-4">No hay pipelines configurados</h2>
          <p className="text-muted-foreground mb-6">
            Crea tu primer pipeline para comenzar a gestionar tus leads por etapas.
          </p>
          {/* Integramos el componente de creación de pipeline dentro de la página */}
          <Button 
            size="lg" 
            className="gap-2"
            onClick={() => {
              // Aquí podrías abrir directamente el modal de creación de pipeline
              const createPipelineButton = document.querySelector("[data-create-pipeline]");
              if (createPipelineButton && createPipelineButton instanceof HTMLElement) {
                createPipelineButton.click();
              }
            }}
          >
            <Plus size={18} />
            Crear Primer Pipeline
          </Button>
        </div>
      )}
    </div>
  );
};

export default PipelineManagement;
