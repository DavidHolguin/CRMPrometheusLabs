
import { Lead } from "@/hooks/useLeads";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadHeader } from "./LeadHeader";
import { LeadDataTab } from "./LeadDataTab";
import { LeadHistoryTab } from "./LeadHistoryTab";
import { LeadCommentsTab } from "./LeadCommentsTab";
import { normalizeLeadScore, getScoreColorClass, getScoreCircleClass } from "./LeadScoreUtils";
import { formatLeadDate } from "./LeadDateUtils";
import { LeadDrawer } from "./LeadDrawer";
import { LeadAIEvaluation } from "./LeadAIEvaluation";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePipelines } from "@/hooks/usePipelines";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, Tag, Award, Timer, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

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
  const [leadEvaluation, setLeadEvaluation] = useState<any | null>(null);
  
  const normalizedScore = normalizeLeadScore(lead.score);
  const scoreColorClass = getScoreColorClass(normalizedScore);
  const scoreCircleClass = getScoreCircleClass(scoreColorClass);
  
  // Get initials from name
  const getInitials = () => {
    const firstName = lead.nombre || '';
    const lastName = lead.apellido || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  useEffect(() => {
    if (isDragging) {
      setDetailsOpen(false);
    }
  }, [isDragging]);
  
  useEffect(() => {
    if (detailsOpen) {
      fetchTags();
      fetchStages();
      fetchLeadEvaluation();
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
  
  const fetchLeadEvaluation = async () => {
    try {
      const { data } = await supabase
        .from('evaluaciones_llm')
        .select('*')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (data && data.length > 0) {
        setLeadEvaluation(data[0]);
      }
    } catch (error) {
      console.error('Error fetching lead evaluation:', error);
    }
  };
  
  return (
    <>
      <Card 
        className={cn(
          "overflow-hidden transition-all duration-200 mb-2 w-full hover:shadow-lg", 
          isDragging 
            ? "opacity-80 shadow-lg ring-2 ring-primary ring-opacity-50 scale-[1.02] border-dashed" 
            : "hover:border-primary/30 hover:shadow-md"
        )}
        onClick={() => setDetailsOpen(true)}
      >
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex justify-between items-start gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2" style={{ borderColor: lead.stage_color || '#ccc' }}>
                <AvatarFallback 
                  className="text-white font-semibold"
                  style={{ backgroundColor: lead.stage_color || '#ccc' }}
                >
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h3 className="font-semibold text-base leading-tight">
                  {lead.nombre} {lead.apellido}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {lead.email || lead.telefono || "Sin contacto"}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <Badge 
                variant="outline" 
                className="text-xs font-medium"
                style={{ 
                  backgroundColor: `${lead.stage_color}20`, 
                  color: lead.stage_color,
                  borderColor: lead.stage_color
                }}
              >
                {lead.stage_name}
              </Badge>
              
              <div className="mt-1 text-xs text-muted-foreground">
                {formatLeadDate(lead.created_at)}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="px-4 pt-1 pb-3">
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <div className="text-xs font-medium flex items-center gap-1">
                <Award className="h-3 w-3" />
                Score
              </div>
              <span className="text-xs font-semibold">{lead.score}/100</span>
            </div>
            <div className="relative h-2 w-full bg-muted/50 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${lead.score}%`, 
                  backgroundColor: getScoreColorClass(normalizedScore).split(' ')[0]
                }}
              />
            </div>
          </div>
          
          {lead.tags && lead.tags.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-1 mb-1.5 text-xs font-medium">
                <Tag className="h-3 w-3" />
                <span>Tags</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {lead.tags.slice(0, 3).map(tag => (
                  <Badge 
                    key={tag.id} 
                    variant="outline" 
                    className="text-[10px] py-0 px-1.5 h-5"
                    style={{ borderColor: tag.color, color: tag.color }}
                  >
                    {tag.nombre}
                  </Badge>
                ))}
                {lead.tags.length > 3 && (
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-5">
                    +{lead.tags.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              <span>{lead.interaction_count || 0} interact.</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Timer className="h-3 w-3" />
              <span>Últ. {lead.ultima_interaccion ? formatLeadDate(lead.ultima_interaccion) : "nunca"}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>{lead.canal_origen || "N/A"}</span>
            </div>
          </div>
        </CardContent>
        
        {leadEvaluation && leadEvaluation.interes_productos && leadEvaluation.interes_productos.length > 0 && (
          <CardFooter className="border-t px-4 py-2 bg-muted/20">
            <div className="w-full">
              <div className="text-xs font-medium mb-1.5">Interés en productos</div>
              <div className="flex flex-wrap gap-1">
                {leadEvaluation.interes_productos.slice(0, 3).map((producto: string, index: number) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-[10px] py-0 px-1.5 h-5"
                  >
                    {producto}
                  </Badge>
                ))}
                {leadEvaluation.interes_productos.length > 3 && (
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-5">
                    +{leadEvaluation.interes_productos.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          </CardFooter>
        )}
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
          <SheetContent className="sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-[80%] overflow-y-auto">
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
            
            <div className="flex flex-col-reverse lg:flex-row gap-4 pt-4 pb-8">
              <div className="lg:w-1/3 space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Evaluación Inteligente</h3>
                <LeadAIEvaluation lead={lead} />
              </div>
              
              <div className="lg:w-2/3">
                <Tabs defaultValue="datos" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="datos">Datos y Progreso</TabsTrigger>
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
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
