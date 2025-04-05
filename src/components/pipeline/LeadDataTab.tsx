
import { Lead } from "@/hooks/useLeads";
import { LeadScoreChart } from "./LeadScoreChart";
import { getScoreColorClass } from "./LeadScoreUtils";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Info, Mail, Phone, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadActivityChart } from "./LeadActivityChart";
import { LeadPersonalDataTab } from "./LeadPersonalDataTab";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePipelines } from "@/hooks/usePipelines";

interface LeadDataTabProps {
  lead: Lead;
  formatDate: (dateStr: string | null) => string;
}

export function LeadDataTab({ lead, formatDate }: LeadDataTabProps) {
  const email = lead.email;
  const phone = lead.telefono;
  const location = lead.ciudad || lead.pais;
  
  const { pipelines = [] } = usePipelines();
  const [stages, setStages] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(lead.pipeline_id || '');
  
  // Información básica del lead
  const contactInfo = [
    ...(email ? [{ 
      icon: <Mail className="h-4 w-4" />,
      label: "Email", 
      value: email,
      href: `mailto:${email}`,
    }] : []),
    ...(phone ? [{ 
      icon: <Phone className="h-4 w-4" />,
      label: "Teléfono", 
      value: phone,
      href: `tel:${phone}`,
    }] : []),
    ...(location ? [{ 
      icon: <MapPin className="h-4 w-4" />,
      label: "Ubicación", 
      value: location,
    }] : []),
  ];
  
  // Usar el score normalizado del lead para la visualización
  const normalizedScore = lead.score || 0;
  
  // Fetch tags cuando el componente se monta
  useEffect(() => {
    fetchTags();
  }, []);
  
  // Fetch stages cuando el pipeline cambia
  useEffect(() => {
    if (selectedPipelineId) {
      fetchStages(selectedPipelineId);
    }
  }, [selectedPipelineId]);
  
  // Establecer el pipeline inicial
  useEffect(() => {
    if (lead.pipeline_id) {
      setSelectedPipelineId(lead.pipeline_id);
    } else if (pipelines.length > 0) {
      setSelectedPipelineId(pipelines[0].id);
    }
  }, [lead.pipeline_id, pipelines]);
  
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
  
  const fetchStages = async (pipelineId: string) => {
    try {
      const { data } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('pipeline_id', pipelineId)
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
      setSelectedPipelineId(pipelineId);
      
      // Obtener el primer stage del pipeline seleccionado
      const { data: firstStage } = await supabase
        .from('pipeline_stages')
        .select('id')
        .eq('pipeline_id', pipelineId)
        .eq('is_active', true)
        .order('posicion', { ascending: true })
        .limit(1)
        .single();
      
      // Actualizar el pipeline y establecer el primer stage por defecto
      await supabase
        .from('leads')
        .update({ 
          pipeline_id: pipelineId,
          stage_id: firstStage?.id || null 
        })
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
  
  // Preparar opciones para los selectores
  const pipelineOptions = pipelines.map(p => ({
    value: p.id,
    label: p.nombre
  }));
  
  const stageOptions = stages.map(s => ({
    value: s.id,
    label: s.nombre,
    color: s.color
  }));
  
  return (
    <div className="space-y-6">
      {/* Información básica del Lead */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Datos de contacto */}
        <div className="rounded-lg border bg-card shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">Información de contacto</h3>
          </div>
          
          <div className="space-y-3">
            {contactInfo.map((info, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="text-muted-foreground">
                  {info.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">{info.label}</span>
                  {info.href ? (
                    <a href={info.href} className="hover:underline">{info.value}</a>
                  ) : (
                    <span>{info.value}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Pipeline selector */}
          <div className="flex flex-col gap-1 mt-4 pt-3 border-t">
            <span className="text-xs text-muted-foreground">Pipeline</span>
            <Select 
              value={selectedPipelineId} 
              onValueChange={handlePipelineChange}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Seleccionar pipeline" />
              </SelectTrigger>
              <SelectContent>
                {pipelineOptions.map((pipeline) => (
                  <SelectItem key={pipeline.value} value={pipeline.value}>
                    {pipeline.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Stage selector */}
          <div className="flex flex-col gap-1 mt-4 pt-3 border-t">
            <span className="text-xs text-muted-foreground">Etapa actual</span>
            <Select 
              value={lead.stage_id || ''} 
              onValueChange={handleStageChange}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Seleccionar etapa" />
              </SelectTrigger>
              <SelectContent>
                {stageOptions.map((stage) => (
                  <SelectItem key={stage.value} value={stage.value}>
                    <div className="flex items-center gap-2">
                      <span>{stage.label}</span>
                      {stage.color && (
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: stage.color }}
                        />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Tags */}
          <div className="flex flex-col gap-1 mt-4 pt-3 border-t">
            <span className="text-xs text-muted-foreground">Etiquetas</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => {
                const isSelected = lead.tags?.some(t => t.id === tag.id);
                return (
                  <Badge 
                    key={tag.id}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer text-xs flex items-center gap-1 px-2 py-1"
                    onClick={() => handleTagToggle(tag.id)}
                    style={{
                      borderColor: tag.color || undefined,
                      color: isSelected ? 'white' : tag.color,
                      backgroundColor: isSelected ? tag.color : undefined,
                    }}
                  >
                    {tag.nombre}
                    {isSelected && (
                      <X className="h-3 w-3 ml-1 hover:text-white/80" />
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Score chart */}
        <LeadScoreChart 
          score={normalizedScore} 
          interactionCount={lead.interaction_count || 0}
          stageName={lead.stage_name || "Sin etapa"}
        />
      </div>
      
      {/* Tabs para separar diferentes métricas */}
      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="activity">Actividad</TabsTrigger>
          <TabsTrigger value="personalData">Datos Personales</TabsTrigger>
        </TabsList>
        
        <TabsContent value="activity" className="mt-4">
          <LeadActivityChart leadId={lead.id} />
        </TabsContent>
        
        <TabsContent value="personalData" className="mt-4">
          <LeadPersonalDataTab lead={lead} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
