
import { Lead } from "@/hooks/useLeads";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LeadScoreChart } from "./LeadScoreChart";
import { LeadActivityChart } from "./LeadActivityChart";
import { LeadInteractionsList } from "./LeadInteractionsList";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LeadDataTabProps {
  lead: Lead;
  formatDate: (dateStr: string | null) => string;
}

// Interface for interaction data
interface ActivityData {
  date: string;
  messages: number;
  interactions: number;
}

export function LeadDataTab({ lead, formatDate }: LeadDataTabProps) {
  const [leadInteractions, setLeadInteractions] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (lead.id) {
      fetchLeadInteractions();
      generateActivityData();
    }
  }, [lead.id]);

  const fetchLeadInteractions = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("lead_interactions")
        .select(`
          *,
          lead_interaction_types (*)
        `)
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      console.log("Lead interactions:", data);
      setLeadInteractions(data || []);
    } catch (error) {
      console.error("Error fetching lead interactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate sample activity data (in a real app, this would come from the database)
  const generateActivityData = () => {
    // Create array of last 30 days
    const result: ActivityData[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      // Generate sample data (in a real app, these would be actual counts)
      const dateString = date.toISOString().split('T')[0];
      const randomMessages = Math.floor(Math.random() * 5);
      const randomInteractions = Math.floor(Math.random() * 3);
      
      result.push({
        date: dateString,
        messages: randomMessages,
        interactions: randomInteractions
      });
    }
    
    setActivityData(result);
  };

  return (
    <div className="space-y-6">
      {/* First Section: Progress Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <LeadScoreChart 
          score={Number(lead.score) || 0} 
          interactionCount={lead.interaction_count || 0} 
          stageName={lead.stage_name || "Sin etapa"} 
        />
        
        <LeadActivityChart activityData={activityData} />
      </div>
      
      {/* Second Section: Personal Data and Interactions */}
      <Tabs defaultValue="datos">
        <TabsList className="w-full grid grid-cols-2 h-9 mb-6">
          <TabsTrigger value="datos" className="text-xs sm:text-sm">Datos Personales</TabsTrigger>
          <TabsTrigger value="interacciones" className="text-xs sm:text-sm">Interacciones</TabsTrigger>
        </TabsList>
        
        <TabsContent value="datos" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium w-1/3">Nombre</TableCell>
                    <TableCell>{lead.nombre} {lead.apellido}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Email</TableCell>
                    <TableCell>{lead.email || "No disponible"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Teléfono</TableCell>
                    <TableCell>{lead.telefono || "No disponible"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Ciudad</TableCell>
                    <TableCell>{lead.ciudad || "No disponible"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">País</TableCell>
                    <TableCell>{lead.pais || "No disponible"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Dirección</TableCell>
                    <TableCell>{lead.direccion || "No disponible"}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Información del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium w-1/3">Origen</TableCell>
                    <TableCell>{lead.canal_origen || "Desconocido"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Pipeline</TableCell>
                    <TableCell>
                      {lead.pipeline_id ? lead.pipeline_id.substring(0, 8) : "Sin asignar"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Etapa</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: lead.stage_color || '#cccccc' }}
                        />
                        {lead.stage_name || "Sin etapa"}
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Asignado a</TableCell>
                    <TableCell>
                      {lead.asignado_a ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>
                              {lead.asignado_a.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {lead.asignado_a}
                        </div>
                      ) : (
                        "Sin asignar"
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Fecha de Creación</TableCell>
                    <TableCell>{formatDate(lead.created_at)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Última Interacción</TableCell>
                    <TableCell>{formatDate(lead.ultima_interaccion)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="interacciones">
          <LeadInteractionsList 
            interactions={leadInteractions} 
            isLoading={isLoading} 
            formatDate={formatDate} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
