
import { Lead } from "@/hooks/useLeads";
import { Card, CardHeader } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadHeader } from "./LeadHeader";
import { LeadDataTab } from "./LeadDataTab";
import { LeadMessagesTab } from "./LeadMessagesTab";
import { LeadHistoryTab } from "./LeadHistoryTab";
import { normalizeLeadScore, getScoreColorClass, getScoreCircleClass } from "./LeadScoreUtils";
import { formatLeadDate } from "./LeadDateUtils";
import { LeadDrawer } from "./LeadDrawer";
import { useIsMobile } from "@/hooks/use-mobile";

interface LeadCardProps {
  lead: Lead;
  isDragging?: boolean;
}

export function LeadCard({ lead, isDragging }: LeadCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Normalize score and get color class
  const normalizedScore = normalizeLeadScore(lead.score);
  const scoreColorClass = getScoreColorClass(normalizedScore);
  const scoreCircleClass = getScoreCircleClass(scoreColorClass);

  // Close drawer/sheet when dragging starts
  useEffect(() => {
    if (isDragging) {
      setDetailsOpen(false);
    }
  }, [isDragging]);
  
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

      {/* Mobile drawer */}
      {isMobile && (
        <LeadDrawer
          lead={lead}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          scoreColorClass={scoreColorClass}
          normalizedScore={normalizedScore}
        />
      )}

      {/* Desktop/tablet sheet */}
      {!isMobile && (
        <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
          <SheetContent className="sm:max-w-md md:max-w-lg lg:max-w-xl overflow-y-auto">
            <SheetHeader className="mb-4">
              <SheetTitle className="flex items-center gap-3">
                <div className={scoreCircleClass}>
                  {normalizedScore}
                </div>
                <span>{lead.nombre} {lead.apellido}</span>
              </SheetTitle>
            </SheetHeader>
            
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
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
