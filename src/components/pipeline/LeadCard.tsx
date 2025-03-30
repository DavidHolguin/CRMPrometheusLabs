import { Lead } from "@/hooks/useLeads";
import { Card, CardHeader } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadHeader } from "./LeadHeader";
import { LeadDataTab } from "./LeadDataTab";
import { LeadHistoryTab } from "./LeadHistoryTab";
import { LeadCommentsTab } from "./LeadCommentsTab";
import { LeadActionBar } from "./LeadActionBar";
import { normalizeLeadScore, getScoreColorClass, getScoreCircleClass } from "./LeadScoreUtils";
import { formatLeadDate } from "./LeadDateUtils";
import { LeadDrawer } from "./LeadDrawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePipelines } from "@/hooks/usePipelines";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface LeadCardProps {
  lead: Lead;
  isDragging?: boolean;
}

export function LeadCard({ lead, isDragging }: LeadCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const isMobile = useIsMobile();
  const { pipelines = [] } = usePipelines();
  const [stages, setStages] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  
  const normalizedScore = normalizeLeadScore(lead.score);
  const scoreColorClass = getScoreColorClass(normalizedScore);
  const scoreCircleClass = getScoreCircleClass(scoreColorClass);

  useEffect(() => {
    if (isDragging) {
      setDetailsOpen(false);
    }
  }, [isDragging]);
  
  useEffect(() => {
    if (detailsOpen) {
      fetchTags();
      fetchStages();
    }
  }, [detailsOpen]);
  
  const fetchTags = async () => {
    try {
      const { data } = await supabase
        .from('lead_tags')
        .select('*')
        .eq('empresa_id', lead.empresa_id);
      
      if (data) {
        setTags(data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };
  
  const fetchStages = async () => {
    try {
      const { data } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('is_active', true)
        .order('posicion', { ascending: true });
      
      if (data) {
        setStages(data);
      }
    } catch (error) {
      console.error('Error fetching stages:', error);
    }
  };
  
  const handleStageChange = async (stageId: string) => {
    try {
      await supabase
        .from('leads')
        .update({ stage_id: stageId })
        .eq('id', lead.id);
      
      toast.success('Etapa actualizada');
    } catch (error) {
      toast.error('Error al actualizar la etapa');
      console.error(error);
    }
  };
  
  const handlePipelineChange = async (pipelineId: string) => {
    try {
      await supabase
        .from('leads')
        .update({ pipeline_id: pipelineId })
        .eq('id', lead.id);
      
      toast.success('Pipeline actualizado');
    } catch (error) {
      toast.error('Error al actualizar el pipeline');
      console.error(error);
    }
  };
  
  const handleTagToggle = async (tagId: string) => {
    try {
      const isTagged = lead.tags?.some(t => t.id === tagId);
      
      if (isTagged) {
        await supabase
          .from('lead_tag_relation')
          .delete()
          .eq('lead_id', lead.id)
          .eq('tag_id', tagId);
        
        toast.success('Etiqueta removida');
      } else {
        await supabase
          .from('lead_tag_relation')
          .insert({
            lead_id: lead.id,
            tag_id: tagId
          });
        
        toast.success('Etiqueta añadida');
      }
    } catch (error) {
      toast.error('Error al gestionar etiquetas');
      console.error(error);
    }
  };
  
  const pipelinesOptions = pipelines.map(p => ({
    value: p.id,
    label: p.nombre
  }));
  
  const stagesOptions = stages.map(s => ({
    value: s.id,
    label: s.nombre,
    color: s.color
  }));
  
  return (
    <>
      <Card 
        className={cn(
          "overflow-hidden transition-all duration-200 mb-2 w-full cursor-move", 
          isDragging 
            ? "opacity-80 shadow-lg ring-2 ring-primary ring-opacity-50 scale-[1.02] border-dashed" 
            : "hover:shadow-md hover:border-primary/30"
        )}
        onClick={() => setDetailsOpen(true)}
      >
        <CardHeader className="pb-2 pt-3">
          <LeadHeader 
            lead={lead}
            expanded={false}
            scoreColorClass={scoreCircleClass}
            normalizedScore={normalizedScore}
            toggleExpanded={() => setDetailsOpen(true)}
          />
        </CardHeader>
      </Card>

      {isMobile && (
        <LeadDrawer
          lead={lead}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          scoreColorClass={scoreCircleClass}
          normalizedScore={normalizedScore}
        />
      )}

      {!isMobile && (
        <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
          <SheetContent className="sm:max-w-md md:max-w-lg lg:max-w-xl overflow-y-auto">
            <SheetHeader className="mb-1 pb-2 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className={scoreCircleClass}>
                  {normalizedScore}
                </div>
                <div className="flex-1">
                  <SheetTitle className="mb-1">
                    {lead.nombre} {lead.apellido}
                  </SheetTitle>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-2">
                    {lead.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        <a 
                          href={`mailto:${lead.email}`} 
                          className="hover:underline hover:text-primary"
                        >
                          {lead.email}
                        </a>
                      </div>
                    )}
                    {lead.telefono && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        <a 
                          href={`tel:${lead.telefono}`} 
                          className="hover:underline hover:text-primary"
                        >
                          {lead.telefono}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Creado el {formatLeadDate(lead.created_at)} · Canal: {lead.canal_origen || "Desconocido"}
                  </div>
                </div>
                
                <div className="flex gap-2 mt-2 sm:mt-0">
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    Llamar
                  </Button>
                </div>
              </div>
            </SheetHeader>
            
            <Tabs defaultValue="datos" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="datos">Datos</TabsTrigger>
                <TabsTrigger value="historial">Historial</TabsTrigger>
                <TabsTrigger value="comentarios">Comentarios</TabsTrigger>
              </TabsList>
              
              <TabsContent value="datos" className="space-y-4">
                <LeadDataTab lead={lead} formatDate={formatLeadDate} />
              </TabsContent>
              
              <TabsContent value="historial">
                <LeadHistoryTab lead={lead} formatDate={formatLeadDate} />
              </TabsContent>
              
              <TabsContent value="comentarios">
                <LeadCommentsTab lead={lead} formatDate={formatLeadDate} />
              </TabsContent>
            </Tabs>
            
            <div className="pb-16"></div>
            
            <LeadActionBar
              lead={lead}
              pipelines={pipelinesOptions}
              stages={stagesOptions}
              tags={tags}
              onStageChange={handleStageChange}
              onPipelineChange={handlePipelineChange}
              onTagToggle={handleTagToggle}
            />
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
