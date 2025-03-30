
import { Lead } from "@/hooks/useLeads";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadDataTab } from "./LeadDataTab";
import { LeadHistoryTab } from "./LeadHistoryTab";
import { LeadCommentsTab } from "./LeadCommentsTab";
import { formatLeadDate } from "./LeadDateUtils";
import { getScoreCircleClass } from "./LeadScoreUtils";
import { Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadAIEvaluation } from "./LeadAIEvaluation";

interface LeadDrawerProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scoreColorClass: string;
  normalizedScore: number;
}

export function LeadDrawer({ 
  lead, 
  open, 
  onOpenChange, 
  scoreColorClass, 
  normalizedScore 
}: LeadDrawerProps) {
  const scoreCircleClass = getScoreCircleClass(scoreColorClass);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90%]">
        <DrawerHeader className="mb-1 pb-2 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className={scoreCircleClass}>
              {normalizedScore}
            </div>
            <div className="flex-1">
              <DrawerTitle className="mb-1">
                {lead.nombre} {lead.apellido}
              </DrawerTitle>
              
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
        </DrawerHeader>
        
        <div className="px-4 pb-8">
          <div className="flex flex-col-reverse lg:flex-row gap-4">
            {/* Columna izquierda - Evaluación IA */}
            <div className="lg:w-1/3 space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Evaluación Inteligente</h3>
              <LeadAIEvaluation lead={lead} />
            </div>
            
            {/* Columna derecha - Información principal */}
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
        </div>
      </DrawerContent>
    </Drawer>
  );
}
