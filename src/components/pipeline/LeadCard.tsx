
import { Lead } from "@/hooks/useLeads";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadHeader } from "./LeadHeader";
import { LeadDataTab } from "./LeadDataTab";
import { LeadMessagesTab } from "./LeadMessagesTab";
import { LeadHistoryTab } from "./LeadHistoryTab";
import { normalizeLeadScore, getScoreColorClass } from "./LeadScoreUtils";
import { formatLeadDate } from "./LeadDateUtils";

interface LeadCardProps {
  lead: Lead;
  isDragging?: boolean;
}

export function LeadCard({ lead, isDragging }: LeadCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Normalize score and get color class
  const normalizedScore = normalizeLeadScore(lead.score);
  const scoreColorClass = getScoreColorClass(normalizedScore);
  
  // Toggle expanded state
  const toggleExpanded = () => setExpanded(!expanded);

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-200 mb-2 w-full cursor-move", 
        isDragging 
          ? "opacity-80 shadow-lg ring-2 ring-primary ring-opacity-50 scale-[1.02] border-dashed" 
          : "hover:shadow-md hover:border-primary/30",
        expanded && "shadow-md"
      )}
    >
      <CardHeader className="pb-2 pt-3">
        <LeadHeader 
          lead={lead}
          expanded={expanded}
          scoreColorClass={scoreColorClass}
          normalizedScore={normalizedScore}
          toggleExpanded={toggleExpanded}
        />
      </CardHeader>
      
      {expanded && (
        <CardContent className="pt-0 pb-4">
          <Tabs defaultValue="datos" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-2">
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
        </CardContent>
      )}
    </Card>
  );
}
