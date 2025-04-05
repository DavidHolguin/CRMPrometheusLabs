
import { Lead } from "@/hooks/useLeads";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { LeadScoreIndicator } from "./LeadScoreIndicator";

interface LeadDataTabProps {
  lead: Lead;
  formatDate: (date: string | null) => string;
}

export function LeadDataTab({ lead, formatDate }: LeadDataTabProps) {
  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-medium mb-3">Información Personal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Nombre</p>
              <p className="text-sm">{lead.nombre} {lead.apellido}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Email</p>
              <p className="text-sm">{lead.email || "No disponible"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Teléfono</p>
              <p className="text-sm">{lead.telefono || "No disponible"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Ubicación</p>
              <p className="text-sm">
                {[lead.ciudad, lead.pais].filter(Boolean).join(", ") || "No disponible"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lead Status */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-medium mb-3">Estado y Puntuación</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Etapa Actual</p>
              <Badge 
                style={{ 
                  backgroundColor: `${lead.stage_color}20`, 
                  color: lead.stage_color,
                  borderColor: lead.stage_color
                }}
              >
                {lead.stage_name || "Sin etapa"}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Score</p>
              <LeadScoreIndicator score={lead.score || 0} size="md" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Origen</p>
              <p className="text-sm">{lead.canal_origen || "Desconocido"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-medium mb-3">Etiquetas</h3>
          <div className="flex flex-wrap gap-2">
            {lead.tags && lead.tags.length > 0 ? (
              lead.tags.map((tag) => (
                <Badge 
                  key={tag.id}
                  variant="outline"
                  style={{
                    backgroundColor: `${tag.color}20`,
                    borderColor: tag.color,
                    color: tag.color
                  }}
                >
                  {tag.nombre}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Sin etiquetas</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Data */}
      {lead.datos_adicionales && Object.keys(lead.datos_adicionales).length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium mb-3">Datos Adicionales</h3>
            <div className="space-y-2">
              {Object.entries(lead.datos_adicionales).map(([key, value]) => (
                <div key={key}>
                  <p className="text-xs text-muted-foreground mb-1">{key}</p>
                  <p className="text-sm">{value?.toString() || "No disponible"}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Meta Data */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-medium mb-3">Datos del Sistema</h3>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Creado el</p>
              <p className="text-sm">{formatDate(lead.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Última interacción</p>
              <p className="text-sm">{formatDate(lead.ultima_interaccion)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">ID</p>
              <p className="text-sm font-mono text-xs">{lead.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
