import { Lead } from "@/hooks/useLeads";
import { LeadScoreChart } from "./LeadScoreChart";
import { getScoreColorClass } from "./LeadScoreUtils";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Info, Mail, Phone, MapPin, X, Plus, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadActivityChart } from "./LeadActivityChart";
import { LeadPersonalDataTab } from "./LeadPersonalDataTab";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePipelines } from "@/hooks/usePipelines";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
  const [stagesOpen, setStagesOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  
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
      setStagesOpen(false);
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

  // Buscar el stage actual
  const currentStage = stageOptions.find(s => s.value === lead.stage_id);
  
  return (
    <div className="space-y-6">
      {/* Sección de clasificación */}
      <div className="p-4 bg-muted/20 border rounded-lg">
        <h3 className="text-sm font-medium mb-4">Clasificación del Lead</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Selector de pipeline */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Pipeline</label>
            <Select 
              value={selectedPipelineId} 
              onValueChange={handlePipelineChange}
            >
              <SelectTrigger className="w-full">
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
          
          {/* Selector de etapa con comando */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Etapa</label>
            <Popover open={stagesOpen} onOpenChange={setStagesOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  role="combobox" 
                  aria-expanded={stagesOpen}
                  className="w-full justify-between"
                >
                  {currentStage ? (
                    <div className="flex items-center gap-2">
                      {currentStage.color && (
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: currentStage.color }}
                        />
                      )}
                      <span>{currentStage.label}</span>
                    </div>
                  ) : "Seleccionar etapa"}
                  <X
                    className={cn(
                      "ml-2 h-4 w-4 shrink-0 opacity-50",
                      stagesOpen && "rotate-90"
                    )}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder="Buscar etapa..." />
                  <CommandList>
                    <CommandEmpty>No se encontraron resultados</CommandEmpty>
                    <CommandGroup>
                      {stageOptions.map((stage) => (
                        <CommandItem
                          key={stage.value}
                          value={stage.label}
                          onSelect={() => handleStageChange(stage.value)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2 w-full">
                            {stage.color && (
                              <div 
                                className="h-3 w-3 rounded-full" 
                                style={{ backgroundColor: stage.color }}
                              />
                            )}
                            <span>{stage.label}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {/* Selector de etiquetas */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs text-muted-foreground">Etiquetas</label>
            <Popover open={tagsOpen} onOpenChange={setTagsOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                  <Tag className="h-3 w-3" />
                  <span>Gestionar</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder="Buscar etiqueta..." />
                  <CommandList>
                    <CommandEmpty>No se encontraron resultados</CommandEmpty>
                    <CommandGroup>
                      {tags.map((tag) => {
                        const isSelected = lead.tags?.some(t => t.id === tag.id);
                        return (
                          <CommandItem
                            key={tag.id}
                            value={tag.nombre}
                            onSelect={() => handleTagToggle(tag.id)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2 w-full">
                              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }} />
                              <span>{tag.nombre}</span>
                              {isSelected && (
                                <span className="ml-auto">✓</span>
                              )}
                            </div>
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex flex-wrap gap-1.5 min-h-8 p-2 bg-background rounded-md border">
            {lead.tags && lead.tags.length > 0 ? (
              lead.tags.map((tag) => (
                <Badge 
                  key={tag.id}
                  variant="secondary"
                  className="text-xs flex items-center gap-1 px-2 py-1 cursor-pointer"
                  onClick={() => handleTagToggle(tag.id)}
                  style={{
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                    borderColor: `${tag.color}50`,
                  }}
                >
                  {tag.nombre}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground p-1">Sin etiquetas</span>
            )}
          </div>
        </div>
      </div>

      {/* Información básica del Lead */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Datos de contacto */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
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
          </CardContent>
        </Card>
        
        {/* Score chart */}
        <LeadScoreChart 
          score={normalizedScore} 
          interactionCount={lead.interaction_count || 0}
          stageName={lead.stage_name || "Sin etapa"}
        />
      </div>
      
      {/* Datos personales */}
      <LeadPersonalDataTab lead={lead} />
      
      {/* Gráfico de actividad */}
      <LeadActivityChart leadId={lead.id} />
    </div>
  );
}
