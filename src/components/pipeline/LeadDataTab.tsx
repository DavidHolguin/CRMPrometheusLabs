
import { Lead } from "@/hooks/useLeads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LeadActivityChart } from "./LeadActivityChart";
import { LeadScoreChart } from "./LeadScoreChart";

interface LeadDataTabProps {
  lead: Lead;
  formatDate: (dateStr: string | null) => string;
}

export function LeadDataTab({ lead, formatDate }: LeadDataTabProps) {
  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Datos del Lead</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Nombre Completo</div>
                  <div className="text-sm">{lead.nombre} {lead.apellido}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Email</div>
                  <div className="text-sm">{lead.email || "—"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Teléfono</div>
                  <div className="text-sm">{lead.telefono || "—"}</div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Canal de Origen</div>
                  <div className="text-sm">{lead.canal_origen || "Desconocido"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Fecha de Registro</div>
                  <div className="text-sm">{formatDate(lead.created_at)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Última Interacción</div>
                  <div className="text-sm">{lead.ultima_interaccion ? formatDate(lead.ultima_interaccion) : "Sin interacciones"}</div>
                </div>
              </div>
            </div>
          </div>
          
          {lead.datos_adicionales && Object.keys(lead.datos_adicionales).length > 0 && (
            <>
              <Separator className="my-3" />
              <div>
                <h4 className="text-sm font-medium mb-2">Datos Adicionales</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(lead.datos_adicionales).map(([key, value]) => (
                    <div key={key}>
                      <div className="text-sm font-medium text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm">
                        {typeof value === 'string' || typeof value === 'number' 
                          ? String(value) 
                          : typeof value === 'boolean'
                            ? value ? 'Sí' : 'No'
                            : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LeadScoreChart lead={lead} />
        <LeadActivityChart leadId={lead.id} />
      </div>
    </div>
  );
}
