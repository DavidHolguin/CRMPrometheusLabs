
import { Lead } from "@/hooks/useLeads";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadDataTab } from "./LeadDataTab";
import { LeadMessagesTab } from "./LeadMessagesTab";
import { LeadHistoryTab } from "./LeadHistoryTab";
import { formatLeadDate } from "./LeadDateUtils";
import { getScoreCircleClass } from "./LeadScoreUtils";

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
        <DrawerHeader className="mb-4">
          <DrawerTitle className="flex items-center gap-3">
            <div className={scoreCircleClass}>
              {normalizedScore}
            </div>
            <span>{lead.nombre} {lead.apellido}</span>
          </DrawerTitle>
        </DrawerHeader>
        
        <div className="px-4 pb-6">
          <Tabs defaultValue="datos" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="datos">Datos y Progreso</TabsTrigger>
              <TabsTrigger value="mensajes">Mensajes</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
            </TabsList>
            
            <TabsContent value="datos" className="space-y-4">
              <LeadDataTab lead={lead} formatDate={formatLeadDate} />
            </TabsContent>
            
            <TabsContent value="mensajes">
              <LeadMessagesTab lead={lead} formatDate={formatLeadDate} />
            </TabsContent>
            
            <TabsContent value="historial">
              <LeadHistoryTab lead={lead} formatDate={formatLeadDate} />
            </TabsContent>
          </Tabs>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
